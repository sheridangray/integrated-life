import Foundation

@MainActor
final class WorkoutSession: ObservableObject {
	let workoutId: String
	let workoutName: String

	@Published var exerciseLogIds: [String] = []
	@Published var loggedExerciseIds: Set<String> = []
	@Published var startTime: Date?

	init(workoutId: String, workoutName: String) {
		self.workoutId = workoutId
		self.workoutName = workoutName
	}

	var isStarted: Bool { startTime != nil }

	func recordExerciseLog(exerciseId: String, logId: String) {
		if startTime == nil { startTime = Date() }
		exerciseLogIds.append(logId)
		loggedExerciseIds.insert(exerciseId)
	}
}
