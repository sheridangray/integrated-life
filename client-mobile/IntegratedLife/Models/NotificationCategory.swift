import UserNotifications

enum NotificationCategory: String, CaseIterable {
    case workoutReminder = "WORKOUT_REMINDER"
    case healthReport = "HEALTH_REPORT"
    case sleepScoresMorning = "SLEEP_SCORES_MORNING"

    var identifierPrefix: String {
        switch self {
        case .workoutReminder: return "workout-"
        case .healthReport: return "health-report-"
        case .sleepScoresMorning: return "sleep-scores-"
        }
    }

    var unCategory: UNNotificationCategory {
        switch self {
        case .workoutReminder, .healthReport, .sleepScoresMorning:
            return UNNotificationCategory(
                identifier: rawValue,
                actions: [],
                intentIdentifiers: [],
                options: []
            )
        }
    }
}
