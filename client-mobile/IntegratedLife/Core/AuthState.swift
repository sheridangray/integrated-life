import Foundation

struct User: Codable {
	let id: String
	let email: String
	let name: String
	let avatarUrl: String?
	let gender: String?
	let dateOfBirth: String?

	var age: Int? {
		guard let dob = dateOfBirth,
			  let date = ISO8601DateFormatter().date(from: dob) else { return nil }
		return Calendar.current.dateComponents([.year], from: date, to: Date()).year
	}
}

@MainActor
final class AuthState: ObservableObject {
	@Published var user: User?
	@Published var isLoading = true

	private let authService = AuthService.shared

	init() {
		Task {
			await loadSession()
		}
	}

	func loadSession() async {
		isLoading = true
		defer { isLoading = false }

		guard authService.hasStoredTokens else {
			return
		}

		do {
			let user = try await authService.fetchCurrentUser()
			self.user = user
			await PushTokenRegistration.syncWithServerIfPossible()
		} catch {
			authService.clearTokens()
		}
	}

	func signInWithGoogle(idToken: String) async throws {
		let response = try await authService.authenticateWithGoogle(idToken: idToken)
		authService.storeTokens(
			accessToken: response.accessToken,
			refreshToken: response.refreshToken,
			expiresIn: response.expiresIn
		)
		user = response.user
		await PushTokenRegistration.syncWithServerIfPossible()
	}

	func signOut() {
		authService.clearTokens()
		user = nil
	}

	func updateProfile(gender: String?, dateOfBirth: String?) async {
		do {
			let updated = try await authService.updateProfile(gender: gender, dateOfBirth: dateOfBirth)
			user = updated
		} catch {}
	}
}
