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
