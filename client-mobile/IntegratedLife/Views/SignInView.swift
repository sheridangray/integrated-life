import SwiftUI
import GoogleSignIn

struct SignInView: View {
	@ObservedObject var authState: AuthState
	@State private var isSigningIn = false
	@State private var errorMessage: String?

	var body: some View {
		VStack(spacing: 24) {
			Spacer()

			Text("\u{222B}")
				.font(.system(size: 96, weight: .light))
				.foregroundStyle(Color.accentColor)

			Text("Integrated Life")
				.font(.title)
				.fontWeight(.semibold)

			Text("Sign in to continue")
				.foregroundStyle(.secondary)

			if let errorMessage {
				Text(errorMessage)
					.font(.caption)
					.foregroundStyle(.red)
					.multilineTextAlignment(.center)
			}

			Button {
				signInWithGoogle()
			} label: {
				HStack {
					if isSigningIn {
						ProgressView()
							.tint(.white)
					} else {
						Image(systemName: "globe")
						Text("Sign in with Google")
					}
				}
			}
			.buttonStyle(PrimaryButtonStyle())
			.disabled(isSigningIn || Config.googleClientID.isEmpty)

			if Config.googleClientID.isEmpty {
				Text("GOOGLE_CLIENT_ID not configured")
					.font(.caption)
					.foregroundStyle(.orange)
			}

			Spacer()
		}
		.padding()
	}

	private func signInWithGoogle() {
		guard !Config.googleClientID.isEmpty else { return }

		errorMessage = nil
		isSigningIn = true

		guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
		      let rootViewController = windowScene.windows.first?.rootViewController
		else {
			errorMessage = "Could not find root view controller"
			isSigningIn = false
			return
		}

		Task {
			do {
				let config = GIDConfiguration(
					clientID: Config.googleClientID,
					serverClientID: Config.googleServerClientID.isEmpty ? nil : Config.googleServerClientID
				)
				GIDSignIn.sharedInstance.configuration = config

				let calendarScope = "https://www.googleapis.com/auth/calendar.readonly"
				let result = try await GIDSignIn.sharedInstance.signIn(
					withPresenting: rootViewController,
					hint: nil,
					additionalScopes: [calendarScope]
				)

				guard let idToken = result.user.idToken?.tokenString else {
					await MainActor.run {
						errorMessage = "No ID token received"
						isSigningIn = false
					}
					return
				}

				try await authState.signInWithGoogle(
					idToken: idToken,
					serverAuthCode: result.serverAuthCode
				)

				await MainActor.run {
					isSigningIn = false
				}
			} catch {
				await MainActor.run {
					errorMessage = error.localizedDescription
					isSigningIn = false
				}
			}
		}
	}
}
