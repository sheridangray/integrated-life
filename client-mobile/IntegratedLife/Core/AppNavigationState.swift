import SwiftUI

/// userInfo key for local and remote notifications that should change in-app navigation.
enum NotificationDeepLink {
	static let userInfoKey = "deepLink"
	/// Opens Pillars tab and pushes Sleep pillar.
	static let pillarsSleep = "pillars/sleep"
}

@MainActor
final class AppNavigationState: ObservableObject {
	static let shared = AppNavigationState()

	/// `MainTabView` tags: 0 Home, 1 Pillars, 2 Profile
	@Published var selectedTabIndex: Int = 0
	@Published var pillarsPath = NavigationPath()

	func openSleepPillar() {
		selectedTabIndex = 1
		pillarsPath = NavigationPath()
		pillarsPath.append(Pillar.sleep)
	}
}
