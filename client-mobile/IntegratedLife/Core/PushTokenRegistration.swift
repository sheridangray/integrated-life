import Foundation

extension Notification.Name {
	static let apnsDeviceTokenDidUpdate = Notification.Name("apnsDeviceTokenDidUpdate")
}

enum PushTokenRegistration {
	private static var didStartObserving = false

	/// Call once at launch so token updates are sent to the API when the user is signed in.
	static func startObserving() {
		guard !didStartObserving else { return }
		didStartObserving = true

		NotificationCenter.default.addObserver(
			forName: .apnsDeviceTokenDidUpdate,
			object: nil,
			queue: .main
		) { _ in
			Task { await syncWithServerIfPossible() }
		}
	}

	/// Registers the stored APNs token with the server (after login or when token refreshes).
	@MainActor
	static func syncWithServerIfPossible() async {
		guard let token = UserDefaults.standard.string(forKey: "apns.deviceTokenHex"), !token.isEmpty else { return }
		guard AuthService.shared.hasStoredTokens else { return }

		do {
			try await HealthService.shared.registerPushDeviceToken(hex: token)
		} catch {
			// Non-fatal: user can still use the app; token will retry on next launch / sign-in.
		}
	}
}
