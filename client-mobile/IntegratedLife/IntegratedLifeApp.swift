import os.log
import SwiftUI

private let appLog = Logger(subsystem: Bundle.main.bundleIdentifier ?? "com.integratedlife.app", category: "App")

class AppDelegate: NSObject, UIApplicationDelegate {
	func application(
		_ application: UIApplication,
		didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
	) -> Bool {
		appLog.info("App launched, configuring notification service")
		NotificationService.shared.configure()
		return true
	}
}

@main
struct IntegratedLifeApp: App {
	@UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
	@Environment(\.scenePhase) private var scenePhase

	var body: some Scene {
		WindowGroup {
			ContentView()
		}
		.onChange(of: scenePhase) { _, newPhase in
			if newPhase == .active {
				appLog.debug("App became active, rescheduling workout notifications")
				Task {
					await WorkoutNotificationScheduler.shared.rescheduleAll()
				}
			}
		}
	}
}
