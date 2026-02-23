import Foundation

struct WorkoutLog: Codable, Identifiable {
	let id: String
	let userId: String?
	let workoutId: String
	let date: String
	let startTime: String
	let endTime: String
	let exerciseLogIds: [String]
	let completedAll: Bool
}

struct CreateWorkoutLogRequest: Codable {
	let workoutId: String
	let date: String
	let startTime: String
	let endTime: String
	let exerciseLogIds: [String]
	let completedAll: Bool
}
