import UserNotifications

enum NotificationCategory: String, CaseIterable {
    case workoutReminder = "WORKOUT_REMINDER"
    case healthReport = "HEALTH_REPORT"

    var identifierPrefix: String {
        switch self {
        case .workoutReminder: return "workout-"
        case .healthReport: return "health-report-"
        }
    }

    var unCategory: UNNotificationCategory {
        switch self {
        case .workoutReminder, .healthReport:
            return UNNotificationCategory(
                identifier: rawValue,
                actions: [],
                intentIdentifiers: [],
                options: []
            )
        }
    }
}
