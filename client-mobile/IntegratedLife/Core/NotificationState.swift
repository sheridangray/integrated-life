import Foundation
import os.log

private let stateLog = Logger(subsystem: Bundle.main.bundleIdentifier ?? "com.integratedlife.app", category: "NotificationState")

@MainActor
final class NotificationState: ObservableObject {
    private let notificationService = NotificationService.shared
    private let scheduler = WorkoutNotificationScheduler.shared
    private let healthKitService = HealthKitService.shared

    private let enabledKey = "notification.workoutReminder.enabled"
    private let timeKey = "notification.workoutReminder.time"

    @Published var isAuthorized = false
    @Published var isDenied = false

    @Published var workoutRemindersEnabled: Bool {
        didSet {
            UserDefaults.standard.set(workoutRemindersEnabled, forKey: enabledKey)
        }
    }

    @Published var notificationTime: Date {
        didSet {
            UserDefaults.standard.set(notificationTime, forKey: timeKey)
        }
    }

    init() {
        let defaults = UserDefaults.standard
        self.workoutRemindersEnabled = defaults.bool(forKey: enabledKey)
        self.notificationTime = (defaults.object(forKey: timeKey) as? Date)
            ?? Calendar.current.date(from: DateComponents(hour: 7, minute: 0))
            ?? Date()
    }

    func refreshAuthorizationStatus() async {
        let status = await notificationService.authorizationStatus()
        isAuthorized = status == .authorized || status == .provisional
        isDenied = status == .denied
        stateLog.debug("Refreshed auth status: authorized=\(self.isAuthorized) denied=\(self.isDenied)")
    }

    func requestPermission() async {
        stateLog.info("Requesting notification permission")
        let granted = await notificationService.requestAuthorization()
        isAuthorized = granted
        isDenied = !granted
        stateLog.info("Permission result: granted=\(granted)")
    }

    func toggleWorkoutReminders(_ enabled: Bool) async {
        stateLog.info("Toggle workout reminders: \(enabled)")
        workoutRemindersEnabled = enabled

        if enabled {
            if !isAuthorized {
                await requestPermission()
            }
            if isAuthorized {
                await scheduler.rescheduleAll()
            } else {
                stateLog.info("Permission denied, disabling workout reminders")
                workoutRemindersEnabled = false
            }
        } else {
            scheduler.cancelAll()
        }
    }

    func updateNotificationTime(_ time: Date) async {
        let comps = Calendar.current.dateComponents([.hour, .minute], from: time)
        stateLog.info("Updated notification time to \(comps.hour ?? 0):\(String(format: "%02d", comps.minute ?? 0))")
        notificationTime = time
        if workoutRemindersEnabled {
            await scheduler.rescheduleAll()
        }
    }

    /// Reads HealthKit sleep data to suggest a wake-up-based notification time.
    func suggestTimeFromSleepSchedule() async -> Date? {
        do {
            return try await healthKitService.fetchRecentWakeUpTime()
        } catch {
            return nil
        }
    }
}
