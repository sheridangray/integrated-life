import Foundation

final class TimeService {
	private let api = APIClient.shared
	private let auth = AuthService.shared

	static let shared = TimeService()
	private init() {}

	private func token() async throws -> String {
		try await auth.getValidAccessToken()
	}

	// MARK: - Tasks (day planning)

	func fetchTasks(date: String) async throws -> [TimeTask] {
		try await api.get(
			path: "/v1/time/tasks?date=\(date)",
			token: try await token(),
			as: [TimeTask].self
		)
	}

	func fetchInboxTasks() async throws -> [TimeTask] {
		try await api.get(
			path: "/v1/time/tasks?inbox=true",
			token: try await token(),
			as: [TimeTask].self
		)
	}

	func createTask(_ request: CreateTimeTaskRequest) async throws -> TimeTask {
		try await api.post(
			path: "/v1/time/tasks",
			body: request,
			token: try await token(),
			as: TimeTask.self
		)
	}

	func updateTask(id: String, _ request: UpdateTimeTaskRequest) async throws -> TimeTask {
		try await api.put(
			path: "/v1/time/tasks/\(id)",
			body: request,
			token: try await token(),
			as: TimeTask.self
		)
	}

	func deleteTask(id: String) async throws {
		try await api.delete(path: "/v1/time/tasks/\(id)", token: try await token())
	}

	// MARK: - Routines

	func fetchRoutines() async throws -> [TimeRoutine] {
		try await api.get(
			path: "/v1/time/routines",
			token: try await token(),
			as: [TimeRoutine].self
		)
	}

	func createRoutine(_ request: CreateRoutineRequest) async throws -> TimeRoutine {
		try await api.post(
			path: "/v1/time/routines",
			body: request,
			token: try await token(),
			as: TimeRoutine.self
		)
	}

	func updateRoutine(id: String, _ request: UpdateRoutineRequest) async throws -> TimeRoutine {
		try await api.put(
			path: "/v1/time/routines/\(id)",
			body: request,
			token: try await token(),
			as: TimeRoutine.self
		)
	}

	func deleteRoutine(id: String) async throws {
		try await api.delete(path: "/v1/time/routines/\(id)", token: try await token())
	}

	// MARK: - Calendar settings

	func fetchCalendarSettings() async throws -> CalendarSettings {
		try await api.get(
			path: "/v1/time/calendar/settings",
			token: try await token(),
			as: CalendarSettings.self
		)
	}

	func setCalendarEnabled(_ enabled: Bool) async throws -> CalendarSettings {
		try await api.put(
			path: "/v1/time/calendar/settings",
			body: ["enabled": enabled],
			token: try await token(),
			as: CalendarSettings.self
		)
	}

	// MARK: - Time Entries (legacy)

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

	// MARK: - Time Budget (legacy)

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
