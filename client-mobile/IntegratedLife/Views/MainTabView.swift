import SwiftUI

struct MainTabView: View {
	@ObservedObject var authState: AuthState
	@EnvironmentObject private var appNavigation: AppNavigationState
	@StateObject private var healthKitService = HealthKitService.shared
	@StateObject private var timeState = TimeState()
	@StateObject private var sleepState = SleepState()
	@StateObject private var healthState = HealthState()

	var body: some View {
		TabView(selection: $appNavigation.selectedTabIndex) {
			HomeView(timeState: timeState)
				.tabItem {
					Label("Home", systemImage: "house")
				}
				.tag(0)

			PillarsOverviewView(
				pillarsPath: $appNavigation.pillarsPath,
				healthKitService: healthKitService,
				timeState: timeState,
				sleepState: sleepState,
				healthState: healthState
			)
				.tabItem {
					Label("Pillars", systemImage: "square.grid.2x2")
				}
				.tag(1)

			ProfileView(authState: authState, healthKitService: healthKitService)
				.tabItem {
					Label("Profile", systemImage: "person")
				}
				.tag(2)
		}
	}
}
