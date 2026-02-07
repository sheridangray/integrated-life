import Foundation

struct AuthResponse: Codable {
	let accessToken: String
	let refreshToken: String
	let expiresIn: Int
	let user: User
}

struct RefreshResponse: Codable {
	let accessToken: String
	let expiresIn: Int
	let user: User
}

final class AuthService {
	private let keychain = KeychainService.shared
	private let apiClient = APIClient.shared

	private let accessTokenKey = "access_token"
	private let refreshTokenKey = "refresh_token"
	private let expiresAtKey = "expires_at"

	var hasStoredTokens: Bool {
		(try? keychain.getString(forKey: accessTokenKey)) != nil &&
			(try? keychain.getString(forKey: refreshTokenKey)) != nil
	}

	func storeTokens(accessToken: String, refreshToken: String, expiresIn: Int) {
		let expiresAt = Date().addingTimeInterval(TimeInterval(expiresIn))
		try? keychain.set(accessToken, forKey: accessTokenKey)
		try? keychain.set(refreshToken, forKey: refreshTokenKey)
		try? keychain.set(String(expiresAt.timeIntervalSince1970), forKey: expiresAtKey)
	}

	func clearTokens() {
		try? keychain.delete(forKey: accessTokenKey)
		try? keychain.delete(forKey: refreshTokenKey)
		try? keychain.delete(forKey: expiresAtKey)
	}

	func getValidAccessToken() async throws -> String {
		let accessToken = try keychain.getString(forKey: accessTokenKey)
		let refreshToken = try keychain.getString(forKey: refreshTokenKey)
		let expiresAtStr = try keychain.getString(forKey: expiresAtKey)

		guard let access = accessToken, let refresh = refreshToken else {
			throw AuthError.notAuthenticated
		}

		let buffer: TimeInterval = 60
		let expiresAt = expiresAtStr.flatMap { Double($0) }.map { Date(timeIntervalSince1970: $0) } ?? .distantPast

		if Date().addingTimeInterval(buffer) < expiresAt {
			return access
		}

		let response = try await apiClient.post(path: "/v1/auth/refresh", body: ["refreshToken": refresh], as: RefreshResponse.self)

		storeTokens(
			accessToken: response.accessToken,
			refreshToken: refresh,
			expiresIn: response.expiresIn
		)

		return response.accessToken
	}

	func authenticateWithGoogle(idToken: String) async throws -> AuthResponse {
		try await apiClient.post(path: "/v1/auth/google", body: ["idToken": idToken], as: AuthResponse.self)
	}

	func fetchCurrentUser() async throws -> User {
		let token = try await getValidAccessToken()
		return try await apiClient.get(path: "/v1/auth/me", token: token, as: User.self)
	}
}

enum AuthError: Error {
	case notAuthenticated
}
