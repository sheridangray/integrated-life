import SwiftUI

struct MainTabView: View {
	@ObservedObject var authState: AuthState
	@StateObject private var healthKitService = HealthKitService.shared

	var body: some View {
		TabView {
			HomeView()
				.tabItem {
					Label("Home", systemImage: "house")
				}

			PillarsOverviewView(healthKitService: healthKitService)
				.tabItem {
					Label("Pillars", systemImage: "square.grid.2x2")
				}

			ProfileView(authState: authState, healthKitService: healthKitService)
				.tabItem {
					Label("Profile", systemImage: "person")
				}
		}
	}
}
