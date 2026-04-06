import Foundation

struct TimeTaskRecurrenceRule: Codable, Equatable {
	let frequency: String
	let interval: Int
	let daysOfWeek: [Int]?
	let dayOfMonth: Int?
}

struct TimeTask: Codable, Identifiable, Equatable {
	let id: String
	let title: String
	let date: String?
	let startTime: String?
	let durationMinutes: Int
	let color: String
	let icon: String
	let notes: String?
	let source: String
	let routineId: String?
	let calendarEventId: String?
	let completedAt: String?
	let isRecurring: Bool
	let recurrenceRule: TimeTaskRecurrenceRule?
	let createdAt: String
	let updatedAt: String

	var isInboxTask: Bool { date == nil }

	var isAllDay: Bool { !isInboxTask && startTime == nil }

	var isEditable: Bool { source != "calendar" }

	var isCompleted: Bool { completedAt != nil }

	var isRoutineInstance: Bool { source == "routine" }

	var startMinuteOfDay: Int? {
		guard let time = startTime else { return nil }
		let parts = time.split(separator: ":")
		guard parts.count == 2,
			  let h = Int(parts[0]),
			  let m = Int(parts[1]) else { return nil }
		return h * 60 + m
	}

	var endMinuteOfDay: Int? {
		guard let start = startMinuteOfDay else { return nil }
		return start + durationMinutes
	}

	var startTimeFormatted: String? {
		guard let m = startMinuteOfDay else { return nil }
		return Self.formatMinute(m)
	}

	var endTimeFormatted: String? {
		guard let m = endMinuteOfDay else { return nil }
		return Self.formatMinute(m)
	}

	var timeRangeLabel: String? {
		guard let start = startTimeFormatted, let end = endTimeFormatted else { return nil }
		let durLabel = durationMinutes >= 60
			? "\(durationMinutes / 60) hr\(durationMinutes % 60 > 0 ? " \(durationMinutes % 60) min" : "")"
			: "\(durationMinutes) min"
		return "\(start) \u{2013} \(end) (\(durLabel))"
	}

	private static func formatMinute(_ totalMinutes: Int) -> String {
		let h = (totalMinutes / 60) % 24
		let m = totalMinutes % 60
		let suffix = h < 12 ? "AM" : "PM"
		let h12 = h % 12 == 0 ? 12 : h % 12
		return String(format: "%d:%02d %@", h12, m, suffix)
	}
}

struct CalendarSettings: Codable {
	let enabled: Bool
	let hasTokens: Bool
}

struct CreateTimeTaskRequest: Encodable {
	let title: String
	let date: String?
	let startTime: String?
	let durationMinutes: Int
	let color: String
	let icon: String
	let notes: String?
	let isRecurring: Bool
	let recurrenceRule: TimeTaskRecurrenceRule?
}

/// Double-optionals distinguish "don't send" (nil) from "send null" (.some(nil))
struct UpdateTimeTaskRequest: Encodable {
	var title: String?
	var date: String??
	var startTime: String??
	var durationMinutes: Int?
	var color: String?
	var icon: String?
	var notes: String?
	var completedAt: String?

	private enum CodingKeys: String, CodingKey {
		case title, date, startTime, durationMinutes, color, icon, notes, completedAt
	}

	func encode(to encoder: any Encoder) throws {
		var container = encoder.container(keyedBy: CodingKeys.self)
		try container.encodeIfPresent(title, forKey: .title)
		if let dateVal = date { try container.encode(dateVal, forKey: .date) }
		if let startTimeVal = startTime { try container.encode(startTimeVal, forKey: .startTime) }
		try container.encodeIfPresent(durationMinutes, forKey: .durationMinutes)
		try container.encodeIfPresent(color, forKey: .color)
		try container.encodeIfPresent(icon, forKey: .icon)
		try container.encodeIfPresent(notes, forKey: .notes)
		try container.encodeIfPresent(completedAt, forKey: .completedAt)
	}
}
