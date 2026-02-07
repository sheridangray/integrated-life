import SwiftUI

struct MainTabView: View {
	@ObservedObject var authState: AuthState

	var body: some View {
		TabView {
			HomeView()
				.tabItem {
					Label("Home", systemImage: "house")
				}

			ProfileView(authState: authState)
				.tabItem {
					Label("Profile", systemImage: "person")
				}
		}
	}
}

struct HomeView: View {
	var body: some View {
		NavigationStack {
			VStack {
				Text("Welcome to Integrated Life")
					.font(.title2)
				Text("Your dashboard will appear here.")
					.foregroundStyle(.secondary)
			}
			.frame(maxWidth: .infinity, maxHeight: .infinity)
			.navigationTitle("Home")
		}
	}
}

struct ProfileView: View {
	@ObservedObject var authState: AuthState

	var body: some View {
		NavigationStack {
			VStack(alignment: .leading, spacing: 16) {
				if let user = authState.user {
					Text(user.name)
						.font(.title2)
					Text(user.email)
						.foregroundStyle(.secondary)
				}

				Button("Sign out") {
					authState.signOut()
				}
				.foregroundStyle(.red)
			}
			.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
			.padding()
			.navigationTitle("Profile")
		}
	}
}
