import Foundation

final class TimeService {
	private let api = APIClient.shared
	private let auth = AuthService.shared

	static let shared = TimeService()
	private init() {}

	private func token() async throws -> String {
		try await auth.getValidAccessToken()
	}

	// MARK: - Time Entries

	func startEntry(categoryId: Int, notes: String? = nil) async throws -> TimeEntry {
		let request = StartTimeEntryRequest(categoryId: categoryId, notes: notes)
		return try await api.post(path: "/v1/time/entries/start", body: request, token: try await token(), as: TimeEntry.self)
	}

	func stopEntry(id: String) async throws -> TimeEntry {
		struct Empty: Encodable {}
		return try await api.post(path: "/v1/time/entries/\(id)/stop", body: Empty(), token: try await token(), as: TimeEntry.self)
	}

	func fetchActiveEntries() async throws -> [TimeEntry] {
		try await api.get(path: "/v1/time/entries/active", token: try await token(), as: [TimeEntry].self)
	}

	func fetchEntries(from: Date, to: Date) async throws -> [TimeEntry] {
		let formatter = ISO8601DateFormatter()
		let fromStr = formatter.string(from: from)
		let toStr = formatter.string(from: to)
		return try await api.get(
			path: "/v1/time/entries?from=\(fromStr)&to=\(toStr)",
			token: try await token(),
			as: [TimeEntry].self
		)
	}

	func deleteEntry(id: String) async throws {
		try await api.delete(path: "/v1/time/entries/\(id)", token: try await token())
	}

	// MARK: - Time Budget

	func fetchBudget() async throws -> [TimeBudgetItem] {
		let response = try await api.get(path: "/v1/time/budget", token: try await token(), as: TimeBudgetResponse.self)
		return response.budgets
	}

	func saveBudget(_ budgets: [TimeBudgetItem]) async throws -> [TimeBudgetItem] {
		let request = SaveBudgetRequest(budgets: budgets)
		let response = try await api.put(path: "/v1/time/budget", body: request, token: try await token(), as: TimeBudgetResponse.self)
		return response.budgets
	}
}
