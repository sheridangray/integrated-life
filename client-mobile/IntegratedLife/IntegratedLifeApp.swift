import os.log
import SwiftUI
import UIKit

private let appLog = Logger(subsystem: Bundle.main.bundleIdentifier ?? "com.integratedlife.app", category: "App")

class AppDelegate: NSObject, UIApplicationDelegate {
	func application(
		_ application: UIApplication,
		didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
	) -> Bool {
		appLog.info("App launched, configuring notification service")
		NotificationService.shared.configure()
		PushTokenRegistration.startObserving()
		return true
	}

	func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
		let hex = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
		UserDefaults.standard.set(hex, forKey: "apns.deviceTokenHex")
		appLog.info("APNs device token received (\(hex.count) hex chars)")
		NotificationCenter.default.post(name: .apnsDeviceTokenDidUpdate, object: nil)
	}

	func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
		appLog.error("APNs registration failed: \(error.localizedDescription)")
	}
}

@main
struct IntegratedLifeApp: App {
	@UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
	@Environment(\.scenePhase) private var scenePhase

	var body: some Scene {
		WindowGroup {
			ContentView()
				.environmentObject(AppNavigationState.shared)
		}
		.onChange(of: scenePhase) { _, newPhase in
			if newPhase == .active {
				appLog.debug("App became active, rescheduling workout notifications")
				Task {
					await WorkoutNotificationScheduler.shared.rescheduleAll()
					await PushTokenRegistration.syncWithServerIfPossible()
					SleepScoresBackgroundDeliveryService.shared.syncRegistrationWithUserPreference()
				}
			}
		}
	}
}
