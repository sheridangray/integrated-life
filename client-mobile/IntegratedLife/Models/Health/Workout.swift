import Foundation

struct WorkoutExercise: Codable, Identifiable {
	let exerciseId: String
	let name: String?
	let order: Int
	let defaultSets: Int?
	let defaultReps: Int?
	let defaultWeight: Double?

	var id: String { exerciseId }
}

struct RecurrenceRule: Codable {
	var frequency: String
	var interval: Int
	var daysOfWeek: [String]?
	var dayOfMonth: Int?
	var endDate: String?
	var count: Int?
}

struct Workout: Codable, Identifiable {
	let id: String
	let name: String
	let difficulty: String
	let isGlobal: Bool
	let userId: String?
	let exercises: [WorkoutExercise]?
	let exerciseCount: Int?
	let schedule: RecurrenceRule?
}

struct CreateWorkoutRequest: Codable {
	let name: String
	let difficulty: String
	let exercises: [WorkoutExerciseInput]
	let schedule: RecurrenceRule?
}

struct WorkoutExerciseInput: Codable {
	let exerciseId: String
	let order: Int
	let defaultSets: Int?
	let defaultReps: Int?
	let defaultWeight: Double?
}
