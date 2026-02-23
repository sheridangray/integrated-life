import Foundation

struct HistoryItem: Codable, Identifiable {
	let type: String
	let id: String
	let name: String
	let date: String
	let startTime: String
	let endTime: String
	let exerciseLogIds: [String]?
}

struct PaginatedHistory: Codable {
	let items: [HistoryItem]
	let total: Int
	let page: Int
	let limit: Int
	let totalPages: Int
}
