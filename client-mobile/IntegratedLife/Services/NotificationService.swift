import Foundation
import os.log
import UserNotifications

private let notificationLog = Logger(subsystem: Bundle.main.bundleIdentifier ?? "com.integratedlife.app", category: "Notifications")

final class NotificationService: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationService()

    private let center = UNUserNotificationCenter.current()

    private override init() {
        super.init()
    }

    // MARK: - Setup

    func configure() {
        center.delegate = self
        let categories = Set(NotificationCategory.allCases.map(\.unCategory))
        center.setNotificationCategories(categories)
        notificationLog.info("Configured notification center with \(categories.count) categories")
    }

    // MARK: - Authorization

    func requestAuthorization() async -> Bool {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            notificationLog.info("Notification permission requested: granted=\(granted)")
            return granted
        } catch {
            notificationLog.error("Notification permission request failed: \(error.localizedDescription)")
            return false
        }
    }

    func authorizationStatus() async -> UNAuthorizationStatus {
        let status = await center.notificationSettings().authorizationStatus
        notificationLog.debug("Authorization status: \(String(describing: status))")
        return status
    }

    // MARK: - Scheduling

    func schedule(
        identifier: String,
        category: NotificationCategory,
        title: String,
        body: String,
        dateComponents: DateComponents
    ) async throws {
        notificationLog.debug("Scheduling notification id=\(identifier) title=\(title) at \(String(describing: dateComponents))")

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.categoryIdentifier = category.rawValue

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: false)
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        try await center.add(request)

        notificationLog.info("Scheduled notification id=\(identifier)")
    }

    // MARK: - Cancellation

    func cancelNotifications(withPrefix prefix: String) {
        center.getPendingNotificationRequests { requests in
            let ids = requests
                .map(\.identifier)
                .filter { $0.hasPrefix(prefix) }
            self.center.removePendingNotificationRequests(withIdentifiers: ids)
            notificationLog.info("Cancelled \(ids.count) notifications with prefix \(prefix)")
        }
    }

    func cancelAll() {
        center.removeAllPendingNotificationRequests()
        notificationLog.info("Cancelled all pending notifications")
    }

    // MARK: - UNUserNotificationCenterDelegate

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        notificationLog.info("Will present notification: \(notification.request.identifier)")
        return [.banner, .sound]
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        notificationLog.info("User responded to notification: \(response.notification.request.identifier) action=\(response.actionIdentifier)")
        // Future: handle action buttons (Skip, Add to Calendar)
    }
}
