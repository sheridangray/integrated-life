import UserNotifications

enum NotificationCategory: String, CaseIterable {
    case workoutReminder = "WORKOUT_REMINDER"

    var identifierPrefix: String {
        switch self {
        case .workoutReminder: return "workout-"
        }
    }

    var unCategory: UNNotificationCategory {
        switch self {
        case .workoutReminder:
            return UNNotificationCategory(
                identifier: rawValue,
                actions: [],
                intentIdentifiers: [],
                options: []
            )
        }
    }
}
