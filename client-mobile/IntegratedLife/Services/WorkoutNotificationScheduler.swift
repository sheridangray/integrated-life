import Foundation
import os.log

private let schedulerLog = Logger(subsystem: Bundle.main.bundleIdentifier ?? "com.integratedlife.app", category: "WorkoutScheduler")

final class WorkoutNotificationScheduler {
    static let shared = WorkoutNotificationScheduler()

    private let healthService = HealthService.shared
    private let notificationService = NotificationService.shared
    private let category = NotificationCategory.workoutReminder

    private let defaultHour = 7
    private let defaultMinute = 0
    private let maxHour = 7
    private let maxMinute = 45
    private let lookAheadDays = 14

    private init() {}

    func rescheduleAll() async {
        schedulerLog.debug("rescheduleAll() called")

        guard UserDefaults.standard.bool(forKey: "notification.workoutReminder.enabled") else {
            schedulerLog.info("Workout reminders disabled, cancelling all")
            cancelAll()
            return
        }

        let status = await notificationService.authorizationStatus()
        guard status == .authorized || status == .provisional else {
            schedulerLog.info("Notifications not authorized (status=\(String(describing: status))), skipping reschedule")
            return
        }

        cancelAll()

        let time = notificationTime()
        let hour = Calendar.current.component(.hour, from: time)
        let minute = Calendar.current.component(.minute, from: time)
        schedulerLog.debug("Notification time: \(hour):\(String(format: "%02d", minute))")

        do {
            let workouts = try await healthService.fetchWorkouts()
            let scheduled = workouts.filter { $0.schedule != nil }
            schedulerLog.info("Fetched \(workouts.count) workouts, \(scheduled.count) with schedules")

            var scheduledCount = 0
            for workout in scheduled {
                guard let rule = workout.schedule else { continue }
                let dates = RecurrenceExpander.expandDates(from: rule, days: lookAheadDays)

                for date in dates {
                    let calendar = Calendar.current
                    guard calendar.startOfDay(for: date) >= calendar.startOfDay(for: Date()) else { continue }

                    var components = calendar.dateComponents([.year, .month, .day], from: date)
                    components.hour = hour
                    components.minute = minute

                    let dateString = formatDate(date)
                    let identifier = "\(category.identifierPrefix)\(workout.id)-\(dateString)"

                    let exerciseCount = workout.exerciseCount ?? workout.exercises?.count ?? 0
                    let body = exerciseCount > 0
                        ? "\(workout.name) - \(exerciseCount) exercise\(exerciseCount == 1 ? "" : "s") scheduled today"
                        : "\(workout.name) is scheduled for today"

                    try await notificationService.schedule(
                        identifier: identifier,
                        category: category,
                        title: "Workout Today",
                        body: body,
                        dateComponents: components
                    )
                    scheduledCount += 1
                }
            }
            schedulerLog.info("Scheduled \(scheduledCount) workout notifications")
        } catch {
            schedulerLog.error("Workout fetch failed, cannot reschedule: \(error.localizedDescription)")
        }
    }

    func cancelAll() {
        schedulerLog.debug("Cancelling all workout notifications")
        notificationService.cancelNotifications(withPrefix: category.identifierPrefix)
    }

    // MARK: - Private

    private func notificationTime() -> Date {
        let calendar = Calendar.current

        if let stored = UserDefaults.standard.object(forKey: "notification.workoutReminder.time") as? Date {
            let hour = calendar.component(.hour, from: stored)
            let minute = calendar.component(.minute, from: stored)
            if hour < maxHour || (hour == maxHour && minute <= maxMinute) {
                return stored
            }
            return calendar.date(from: DateComponents(hour: maxHour, minute: maxMinute)) ?? stored
        }

        return calendar.date(from: DateComponents(hour: defaultHour, minute: defaultMinute)) ?? Date()
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}
