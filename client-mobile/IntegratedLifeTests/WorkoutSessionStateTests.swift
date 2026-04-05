import XCTest
@testable import IntegratedLife

@MainActor
final class WorkoutSessionStateTests: XCTestCase {

	func testEnsureActiveWorkoutSession_createsSession_whenNone() {
		let state = HealthState()
		XCTAssertNil(state.activeWorkoutSession)

		state.ensureActiveWorkoutSession(workoutId: "w1", workoutName: "Push Day")

		XCTAssertEqual(state.activeWorkoutSession?.workoutId, "w1")
		XCTAssertEqual(state.activeWorkoutSession?.workoutName, "Push Day")
	}

	func testEnsureActiveWorkoutSession_preservesSession_whenSameWorkout_resuming() {
		let state = HealthState()
		state.ensureActiveWorkoutSession(workoutId: "w1", workoutName: "Push Day")
		state.activeWorkoutSession?.recordExerciseLog(exerciseId: "ex1", logId: "log1")

		state.ensureActiveWorkoutSession(workoutId: "w1", workoutName: "Push Day")

		XCTAssertEqual(state.activeWorkoutSession?.exerciseLogIds, ["log1"])
		XCTAssertEqual(state.activeWorkoutSession?.loggedExerciseIds, ["ex1"])
	}

	func testEnsureActiveWorkoutSession_replacesSession_whenDifferentWorkout() {
		let state = HealthState()
		state.ensureActiveWorkoutSession(workoutId: "w1", workoutName: "A")
		state.activeWorkoutSession?.recordExerciseLog(exerciseId: "ex1", logId: "log1")

		state.ensureActiveWorkoutSession(workoutId: "w2", workoutName: "B")

		XCTAssertEqual(state.activeWorkoutSession?.workoutId, "w2")
		XCTAssertTrue(state.activeWorkoutSession?.exerciseLogIds.isEmpty ?? false)
	}

	func testEndActiveWorkoutSessionIfOwned_clearsWhenWorkoutIdMatches() {
		let state = HealthState()
		state.ensureActiveWorkoutSession(workoutId: "w1", workoutName: "A")

		state.endActiveWorkoutSessionIfOwned(workoutId: "w1")

		XCTAssertNil(state.activeWorkoutSession)
	}

	func testEndActiveWorkoutSessionIfOwned_noOpWhenWorkoutIdDiffers() {
		let state = HealthState()
		state.ensureActiveWorkoutSession(workoutId: "w1", workoutName: "A")

		state.endActiveWorkoutSessionIfOwned(workoutId: "other")

		XCTAssertEqual(state.activeWorkoutSession?.workoutId, "w1")
	}

	func testWorkoutSession_recordExerciseLog_appendsAndTracksExercise() {
		let session = WorkoutSession(workoutId: "w", workoutName: "Test")
		session.recordExerciseLog(exerciseId: "e1", logId: "l1")
		session.recordExerciseLog(exerciseId: "e2", logId: "l2")

		XCTAssertEqual(session.exerciseLogIds, ["l1", "l2"])
		XCTAssertEqual(session.loggedExerciseIds, ["e1", "e2"])
	}
}
