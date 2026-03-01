import Foundation

struct TimeEntry: Codable, Identifiable {
	let id: String
	let categoryId: Int
	let startTime: String
	let endTime: String?
	let notes: String?
	let createdAt: String

	var isActive: Bool { endTime == nil }

	var startDate: Date? { DateFormatting.parseISO(startTime) }

	var endDate: Date? {
		guard let endTime else { return nil }
		return DateFormatting.parseISO(endTime)
	}

	var category: TimeCategory? { TimeCategory.find(byId: categoryId) }

	func elapsed(now: Date = Date()) -> TimeInterval {
		guard let start = startDate else { return 0 }
		let end = endDate ?? now
		return end.timeIntervalSince(start)
	}
}

struct StartTimeEntryRequest: Encodable {
	let categoryId: Int
	let notes: String?
}
