import Foundation

struct ExerciseLog: Codable, Identifiable {
	let id: String
	let userId: String?
	let exerciseId: String
	let date: String
	let startTime: String
	let endTime: String
	let resistanceType: String
	let sets: [ExerciseSet]
	let notes: String?
	let writtenToHealthKit: Bool?
}

struct CreateExerciseLogRequest: Codable {
	let exerciseId: String
	let date: String
	let startTime: String
	let endTime: String
	let resistanceType: String
	let sets: [ExerciseSet]
	let notes: String?
}
