import Foundation

struct User: Codable {
	let id: String
	let email: String
	let name: String
	let avatarUrl: String?
}

@MainActor
final class AuthState: ObservableObject {
	@Published var user: User?
	@Published var isLoading = true

	private let authService = AuthService()

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
	}

	func signOut() {
		authService.clearTokens()
		user = nil
	}
}
