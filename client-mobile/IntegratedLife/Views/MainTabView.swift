import SwiftUI

struct MainTabView: View {
	@ObservedObject var authState: AuthState
	@StateObject private var healthKitService = HealthKitService.shared
	@StateObject private var timeState = TimeState()

	var body: some View {
		TabView {
			HomeView(timeState: timeState)
				.tabItem {
					Label("Home", systemImage: "house")
				}

			PillarsOverviewView(healthKitService: healthKitService, timeState: timeState)
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
