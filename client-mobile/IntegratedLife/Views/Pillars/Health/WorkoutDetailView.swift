import SwiftUI

struct WorkoutSummaryData: Identifiable {
	let id = UUID()
	let workoutName: String
	let exerciseLogIds: [String]
	let workoutLogId: String
}

struct WorkoutDetailView: View {
	let workoutId: String
	@Binding var selectedTab: HealthTab
	@ObservedObject var healthState: HealthState

	@Environment(\.dismiss) private var dismiss

	@State private var workout: Workout?
	@State private var isLoading = true
	@State private var showEditSheet = false
	@State private var showExerciseLogSheet = false
	@State private var exerciseToLog: Exercise?
	@State private var isSaving = false
	@State private var workoutSummaryData: WorkoutSummaryData?

	private let healthService = HealthService.shared

	private var session: WorkoutSession? { healthState.activeWorkoutSession }

	var body: some View {
		ScrollView {
			if isLoading {
				ProgressView()
					.padding(.top, 40)
			} else if let workout {
				VStack(alignment: .leading, spacing: 20) {
					headerSection(workout)
					exercisesSection(workout)
					actionsSection(workout)
				}
				.padding()
			}
		}
		.navigationTitle(workout?.name ?? "Workout")
		.task {
			await loadWorkout()
		}
		.onAppear {
			ensureSession()
		}
		.onDisappear {
			if workoutSummaryData == nil {
				clearSessionIfOwned()
			}
		}
		.sheet(isPresented: $showEditSheet) {
			Task { await loadWorkout() }
		} content: {
			if let workout {
				CreateWorkoutView(existingWorkout: workout)
			}
		}
		.sheet(isPresented: $showExerciseLogSheet) {
			if let exerciseToLog {
				LogExerciseView(exercise: exerciseToLog, workoutId: workoutId) { log in
					session?.recordExerciseLog(exerciseId: exerciseToLog.id, logId: log.id)
				}
			}
		}
		.sheet(item: $workoutSummaryData, onDismiss: {
			selectedTab = .history
			dismiss()
		}) { data in
			WorkoutSummaryView(
				workoutName: data.workoutName,
				exerciseLogIds: data.exerciseLogIds,
				workoutLogId: data.workoutLogId
			)
		}
	}

	private func ensureSession() {
		guard let workout else { return }
		if healthState.activeWorkoutSession?.workoutId != workoutId {
			healthState.activeWorkoutSession = WorkoutSession(
				workoutId: workoutId,
				workoutName: workout.name
			)
		}
	}

	private func clearSessionIfOwned() {
		if healthState.activeWorkoutSession?.workoutId == workoutId {
			healthState.activeWorkoutSession = nil
		}
	}

	private func headerSection(_ workout: Workout) -> some View {
		VStack(alignment: .leading, spacing: 8) {
			HStack(spacing: 12) {
				if workout.isGlobal {
					Label("Global", systemImage: "globe")
				}
			}
			.font(.subheadline)
			.foregroundStyle(.secondary)

			if let schedule = workout.schedule {
				Label("Scheduled: \(schedule.frequency) (every \(schedule.interval))", systemImage: "calendar")
					.font(.subheadline)
					.foregroundStyle(.secondary)
			}
		}
	}

	private func exercisesSection(_ workout: Workout) -> some View {
		VStack(alignment: .leading, spacing: 16) {
			Text("Exercises")
				.font(.headline)

			if let exercises = workout.exercises {
				VStack(spacing: 10) {
					ForEach(Array(exercises.sorted(by: { $0.order < $1.order }).enumerated()), id: \.element.id) { index, exercise in
						let isLogged = session?.loggedExerciseIds.contains(exercise.exerciseId) ?? false
						HStack(spacing: 14) {
							Text("\(index + 1)")
								.font(.subheadline)
								.fontWeight(.bold)
								.foregroundStyle(.white)
								.frame(width: 28, height: 28)
								.background(isLogged ? .green : .blue, in: Circle())

							NavigationLink(value: HealthNavDestination.exerciseDetail(exercise.exerciseId)) {
								VStack(alignment: .leading, spacing: 3) {
									Text(exercise.name ?? exercise.exerciseId)
										.font(.body)
										.fontWeight(.medium)
										.foregroundStyle(.primary)
									if let sets = exercise.defaultSets, let reps = exercise.defaultReps {
										Text("\(sets) sets x \(reps) reps")
											.font(.caption)
											.foregroundStyle(.secondary)
									}
								}
							}

							Spacer()

							if isLogged {
								Image(systemName: "checkmark.circle.fill")
									.foregroundStyle(.green)
							}

							Button("Start") {
								Task { await startExercise(exercise) }
							}
							.buttonStyle(.bordered)
							.controlSize(.small)
						}
						.padding(.horizontal, 14)
						.padding(.vertical, 12)
						.background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 10))
					}
				}
			}
		}
	}

	private func actionsSection(_ workout: Workout) -> some View {
		VStack(spacing: 12) {
			Button {
				Task { await finishWorkout() }
			} label: {
				Label("Finish Workout", systemImage: "checkmark.circle.fill")
			}
			.buttonStyle(SuccessButtonStyle())
			.disabled(session?.exerciseLogIds.isEmpty != false || isSaving)

			if !workout.isGlobal {
				Button {
					showEditSheet = true
				} label: {
					Label("Edit Workout", systemImage: "pencil")
				}
				.buttonStyle(SecondaryButtonStyle())
			}
		}
	}

	private func startExercise(_ workoutExercise: WorkoutExercise) async {
		session?.startTime = session?.startTime ?? Date()
		do {
			exerciseToLog = try await healthService.fetchExercise(id: workoutExercise.exerciseId)
			showExerciseLogSheet = true
		} catch {}
	}

	private func loadWorkout() async {
		isLoading = true
		do {
			workout = try await healthService.fetchWorkout(id: workoutId)
			ensureSession()
		} catch {}
		isLoading = false
	}

	private func finishWorkout() async {
		guard let session else { return }
		isSaving = true
		let start = session.startTime ?? Date()
		let end = Date()
		let formatter = ISO8601DateFormatter()

		let request = CreateWorkoutLogRequest(
			workoutId: workoutId,
			date: formatter.string(from: start),
			startTime: formatter.string(from: start),
			endTime: formatter.string(from: end),
			exerciseLogIds: session.exerciseLogIds,
			completedAll: session.loggedExerciseIds.count == (workout?.exercises?.count ?? 0)
		)

		do {
			let log = try await healthService.logWorkout(request: request)
			try? await HealthKitService.shared.saveWorkout(start: start, end: end)
			workoutSummaryData = WorkoutSummaryData(
				workoutName: workout?.name ?? "Workout",
				exerciseLogIds: session.exerciseLogIds,
				workoutLogId: log.id
			)
		} catch {}
		isSaving = false
	}
}
