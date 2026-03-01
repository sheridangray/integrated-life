import Foundation

struct RecurrenceExpander {

    private static let dayNameMap: [String: Int] = [
        "sunday": 1, "monday": 2, "tuesday": 3, "wednesday": 4,
        "thursday": 5, "friday": 6, "saturday": 7,
        "sun": 1, "mon": 2, "tue": 3, "wed": 4,
        "thu": 5, "fri": 6, "sat": 7,
    ]

    static func expandDates(
        from rule: RecurrenceRule,
        startingFrom start: Date = Date(),
        days: Int = 14
    ) -> [Date] {
        let calendar = Calendar.current
        let startDay = calendar.startOfDay(for: start)
        guard let windowEnd = calendar.date(byAdding: .day, value: days, to: startDay) else {
            return []
        }

        let endLimit = parseEndDate(rule.endDate) ?? windowEnd

        switch rule.frequency.lowercased() {
        case "daily":
            return expandDaily(rule: rule, from: startDay, through: min(windowEnd, endLimit), calendar: calendar)
        case "weekly":
            return expandWeekly(rule: rule, from: startDay, through: min(windowEnd, endLimit), calendar: calendar)
        case "weekdays":
            return expandWeekdays(from: startDay, through: min(windowEnd, endLimit), calendar: calendar)
        case "monthly":
            return expandMonthly(rule: rule, from: startDay, through: min(windowEnd, endLimit), calendar: calendar)
        case "yearly":
            return expandYearly(rule: rule, from: startDay, through: min(windowEnd, endLimit), calendar: calendar)
        default:
            return []
        }
    }

    // MARK: - Frequency Handlers

    private static func expandDaily(
        rule: RecurrenceRule,
        from start: Date,
        through end: Date,
        calendar: Calendar
    ) -> [Date] {
        let interval = max(rule.interval, 1)
        var dates: [Date] = []
        var current = start

        while current < end {
            dates.append(current)
            guard let next = calendar.date(byAdding: .day, value: interval, to: current) else { break }
            current = next
            if let limit = rule.count, dates.count >= limit { break }
        }
        return dates
    }

    private static func expandWeekly(
        rule: RecurrenceRule,
        from start: Date,
        through end: Date,
        calendar: Calendar
    ) -> [Date] {
        guard let targetDays = rule.daysOfWeek?.compactMap({ dayNameMap[$0.lowercased()] }),
              !targetDays.isEmpty else {
            return expandDaily(rule: RecurrenceRule(frequency: "daily", interval: 7 * max(rule.interval, 1)), from: start, through: end, calendar: calendar)
        }

        let interval = max(rule.interval, 1)
        var dates: [Date] = []
        var current = start

        while current < end {
            let weekday = calendar.component(.weekday, from: current)
            if targetDays.contains(weekday) {
                dates.append(current)
                if let limit = rule.count, dates.count >= limit { break }
            }

            guard let next = calendar.date(byAdding: .day, value: 1, to: current) else { break }

            if interval > 1 {
                let currentWeek = calendar.component(.weekOfYear, from: current)
                let nextWeek = calendar.component(.weekOfYear, from: next)
                if nextWeek != currentWeek {
                    guard let skipped = calendar.date(byAdding: .weekOfYear, value: interval - 1, to: next) else { break }
                    let skippedStart = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: skipped))!
                    current = skippedStart
                    continue
                }
            }
            current = next
        }
        return dates
    }

    private static func expandWeekdays(
        from start: Date,
        through end: Date,
        calendar: Calendar
    ) -> [Date] {
        var dates: [Date] = []
        var current = start

        while current < end {
            let weekday = calendar.component(.weekday, from: current)
            if (2...6).contains(weekday) {
                dates.append(current)
            }
            guard let next = calendar.date(byAdding: .day, value: 1, to: current) else { break }
            current = next
        }
        return dates
    }

    private static func expandMonthly(
        rule: RecurrenceRule,
        from start: Date,
        through end: Date,
        calendar: Calendar
    ) -> [Date] {
        let targetDay = rule.dayOfMonth ?? calendar.component(.day, from: start)
        let interval = max(rule.interval, 1)
        var dates: [Date] = []

        var components = calendar.dateComponents([.year, .month], from: start)
        components.day = targetDay

        while let candidate = calendar.date(from: components), candidate < end {
            if candidate >= start && calendar.component(.day, from: candidate) == targetDay {
                dates.append(candidate)
                if let limit = rule.count, dates.count >= limit { break }
            }
            guard let next = calendar.date(byAdding: .month, value: interval, to: candidate) else { break }
            components = calendar.dateComponents([.year, .month], from: next)
            components.day = targetDay
        }
        return dates
    }

    private static func expandYearly(
        rule: RecurrenceRule,
        from start: Date,
        through end: Date,
        calendar: Calendar
    ) -> [Date] {
        let interval = max(rule.interval, 1)
        var dates: [Date] = []

        var components = calendar.dateComponents([.year, .month, .day], from: start)

        while let candidate = calendar.date(from: components), candidate < end {
            if candidate >= start {
                dates.append(candidate)
                if let limit = rule.count, dates.count >= limit { break }
            }
            guard let year = components.year else { break }
            components.year = year + interval
        }
        return dates
    }

    // MARK: - Helpers

    private static func parseEndDate(_ string: String?) -> Date? {
        guard let string else { return nil }
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: string)
    }
}
