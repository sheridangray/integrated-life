import Foundation

final class HealthService {
	private let api = APIClient.shared
	private let auth = AuthService.shared

	static let shared = HealthService()
	private init() {}

	private func token() async throws -> String {
		try await auth.getValidAccessToken()
	}

	// MARK: - Exercises

	func fetchExercises(
		bodyPart: String? = nil,
		muscle: String? = nil,
		search: String? = nil,
		favoritesOnly: Bool = false
	) async throws -> [Exercise] {
		var queryItems: [String] = []
		if let bodyPart { queryItems.append("bodyPart=\(bodyPart)") }
		if let muscle { queryItems.append("muscle=\(muscle)") }
		if let search { queryItems.append("search=\(search)") }
		if favoritesOnly { queryItems.append("favoritesOnly=true") }
		let query = queryItems.isEmpty ? "" : "?\(queryItems.joined(separator: "&"))"

		return try await api.get(path: "/v1/exercises\(query)", token: try await token(), as: [Exercise].self)
	}

	func fetchExercise(id: String) async throws -> Exercise {
		try await api.get(path: "/v1/exercises/\(id)", token: try await token(), as: Exercise.self)
	}

	func toggleFavorite(exerciseId: String) async throws -> FavoriteResponse {
		struct Empty: Encodable {}
		return try await api.post(path: "/v1/exercises/\(exerciseId)/favorite", body: Empty(), token: try await token(), as: FavoriteResponse.self)
	}

	func getLastLog(exerciseId: String) async throws -> ExerciseLog? {
		do {
			return try await api.get(path: "/v1/exercises/\(exerciseId)/last-log", token: try await token(), as: ExerciseLog.self)
		} catch APIError.serverError {
			return nil
		}
	}

	func getExerciseHistory(exerciseId: String) async throws -> [ExerciseLog] {
		try await api.get(path: "/v1/exercises/\(exerciseId)/history", token: try await token(), as: [ExerciseLog].self)
	}

	// MARK: - Exercise Logging

	func logExercise(exerciseId: String, request: CreateExerciseLogRequest) async throws -> ExerciseLog {
		try await api.post(path: "/v1/exercises/\(exerciseId)/log", body: request, token: try await token(), as: ExerciseLog.self)
	}

	// MARK: - Workouts

	func fetchWorkouts(visibility: String? = nil) async throws -> [Workout] {
		var queryItems: [String] = []
		if let visibility { queryItems.append("visibility=\(visibility)") }
		let query = queryItems.isEmpty ? "" : "?\(queryItems.joined(separator: "&"))"

		return try await api.get(path: "/v1/workouts\(query)", token: try await token(), as: [Workout].self)
	}

	func fetchWorkout(id: String) async throws -> Workout {
		try await api.get(path: "/v1/workouts/\(id)", token: try await token(), as: Workout.self)
	}

	func createWorkout(request: CreateWorkoutRequest) async throws -> Workout {
		try await api.post(path: "/v1/workouts", body: request, token: try await token(), as: Workout.self)
	}

	func updateWorkout(id: String, request: CreateWorkoutRequest) async throws -> Workout {
		try await api.put(path: "/v1/workouts/\(id)", body: request, token: try await token(), as: Workout.self)
	}

	func deleteWorkout(id: String) async throws {
		try await api.delete(path: "/v1/workouts/\(id)", token: try await token())
	}

	// MARK: - Workout Logging

	func logWorkout(request: CreateWorkoutLogRequest) async throws -> WorkoutLog {
		try await api.post(path: "/v1/workouts/\(request.workoutId)/log", body: request, token: try await token(), as: WorkoutLog.self)
	}

	// MARK: - History

	func fetchHistory(page: Int = 1, limit: Int = 20, type: String? = nil) async throws -> PaginatedHistory {
		var queryItems = ["page=\(page)", "limit=\(limit)"]
		if let type { queryItems.append("type=\(type)") }
		let query = "?\(queryItems.joined(separator: "&"))"

		return try await api.get(path: "/v1/history\(query)", token: try await token(), as: PaginatedHistory.self)
	}

	func deleteHistoryItem(type: String, id: String) async throws {
		try await api.delete(path: "/v1/history/\(type)/\(id)", token: try await token())
	}

	func fetchHistoryDetail(type: String, id: String) async throws -> ExerciseLog {
		try await api.get(path: "/v1/history/\(type)/\(id)", token: try await token(), as: ExerciseLog.self)
	}

	// MARK: - AI Insights

	func getExerciseInsight(exerciseId: String) async throws -> AIInsight {
		try await api.get(path: "/v1/health/insights/exercise/\(exerciseId)", token: try await token(), as: AIInsight.self)
	}

	func getHistorySummary() async throws -> AIInsight {
		try await api.get(path: "/v1/health/insights/summary", token: try await token(), as: AIInsight.self)
	}

	func getMonitorInsight(sampleType: String, data: [MonitorDataPoint]) async throws -> AIInsight {
		let request = MonitorInsightRequest(data: data)
		return try await api.post(path: "/v1/health/insights/monitor/\(sampleType)", body: request, token: try await token(), as: AIInsight.self)
	}

	func getMonitorAnalysis(sampleType: String, data: [MonitorDataPoint], timeRange: String) async throws -> AIInsight {
		let request = MonitorAnalysisRequest(data: data, timeRange: timeRange)
		return try await api.post(path: "/v1/health/insights/monitor/\(sampleType)/analyze", body: request, token: try await token(), as: AIInsight.self)
	}

	func getWorkoutInsight(exerciseLogIds: [String]) async throws -> WorkoutInsightResponse {
		let request = WorkoutInsightRequest(exerciseLogIds: exerciseLogIds)
		return try await api.post(path: "/v1/health/insights/workout", body: request, token: try await token(), as: WorkoutInsightResponse.self)
	}
}

struct FavoriteResponse: Codable {
	let isFavorite: Bool
}

struct MonitorDataPoint: Codable {
	let date: String
	let value: Double
}

struct MonitorInsightRequest: Codable {
	let data: [MonitorDataPoint]
}

struct MonitorAnalysisRequest: Codable {
	let data: [MonitorDataPoint]
	let timeRange: String
}

struct WorkoutInsightRequest: Codable {
	let exerciseLogIds: [String]
}
