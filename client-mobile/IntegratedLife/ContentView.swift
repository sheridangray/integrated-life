import SwiftUI

struct ContentView: View {
	@StateObject private var authState = AuthState()

	var body: some View {
		Group {
			if authState.isLoading {
				ProgressView()
					.frame(maxWidth: .infinity, maxHeight: .infinity)
			} else if authState.user != nil {
				MainTabView(authState: authState)
			} else {
				SignInView(authState: authState)
			}
		}
	}
}
