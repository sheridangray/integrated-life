import Foundation

struct TimeRoutine: Codable, Identifiable, Equatable {
	let id: String
	let title: String
	let defaultTime: String?
	let defaultDuration: Int
	let color: String
	let icon: String
	let notes: String?
	let recurrenceRule: TimeTaskRecurrenceRule
	let isActive: Bool
	let skippedDates: [String]
	let createdAt: String
	let updatedAt: String

	var frequencyLabel: String {
		let freq = recurrenceRule.frequency.lowercased()
		let interval = recurrenceRule.interval
		if interval == 1 {
			switch freq {
			case "daily": return "Every day"
			case "weekly": return daysOfWeekLabel ?? "Every week"
			case "monthly": return "Every month"
			case "yearly": return "Every year"
			default: return freq.capitalized
			}
		}
		switch freq {
		case "daily": return "Every \(interval) days"
		case "weekly": return "Every \(interval) weeks"
		case "monthly": return "Every \(interval) months"
		case "yearly": return "Every \(interval) years"
		default: return freq.capitalized
		}
	}

	private var daysOfWeekLabel: String? {
		guard let days = recurrenceRule.daysOfWeek, !days.isEmpty else { return nil }
		let names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
		let labels = days.compactMap { $0 < names.count ? names[$0] : nil }
		return labels.joined(separator: ", ")
	}
}

struct CreateRoutineRequest: Encodable {
	let title: String
	let defaultTime: String?
	let defaultDuration: Int
	let color: String
	let icon: String
	let notes: String?
	let recurrenceRule: TimeTaskRecurrenceRule
}

struct UpdateRoutineRequest: Encodable {
	var title: String?
	var defaultTime: String?
	var defaultDuration: Int?
	var color: String?
	var icon: String?
	var notes: String?
	var recurrenceRule: TimeTaskRecurrenceRule?
	var isActive: Bool?
}
