import SwiftUI

struct CreateWorkoutView: View {
	@Environment(\.dismiss) private var dismiss

	var existingWorkout: Workout?

	@State private var name: String
	@State private var difficulty: Difficulty
	@State private var selectedExercises: [WorkoutExerciseInput] = []
	@State private var availableExercises: [Exercise] = []
	@State private var searchText = ""
	@State private var scheduleFrequency: String = "weekly"
	@State private var scheduleInterval: Int = 1
	@State private var hasSchedule = false
	@State private var isSaving = false

	private let healthService = HealthService.shared

	init(existingWorkout: Workout? = nil) {
		self.existingWorkout = existingWorkout
		_name = State(initialValue: existingWorkout?.name ?? "")
		_difficulty = State(initialValue: Difficulty(rawValue: existingWorkout?.difficulty ?? "Intermediate") ?? .intermediate)

		if let exercises = existingWorkout?.exercises {
			_selectedExercises = State(initialValue: exercises.map { ex in
				WorkoutExerciseInput(
					exerciseId: ex.exerciseId,
					order: ex.order,
					defaultSets: ex.defaultSets,
					defaultReps: ex.defaultReps,
					defaultWeight: ex.defaultWeight
				)
			})
		}

		if let schedule = existingWorkout?.schedule {
			_hasSchedule = State(initialValue: true)
			_scheduleFrequency = State(initialValue: schedule.frequency)
			_scheduleInterval = State(initialValue: schedule.interval)
		}
	}

	var body: some View {
		NavigationStack {
			Form {
				Section("Details") {
					TextField("Workout Name", text: $name)
					Picker("Difficulty", selection: $difficulty) {
						ForEach(Difficulty.allCases) { diff in
							Text(diff.rawValue).tag(diff)
						}
					}
				}

				Section("Schedule") {
					Toggle("Recurring", isOn: $hasSchedule)
					if hasSchedule {
						Picker("Frequency", selection: $scheduleFrequency) {
							Text("Daily").tag("daily")
							Text("Weekly").tag("weekly")
							Text("Monthly").tag("monthly")
							Text("Yearly").tag("yearly")
							Text("Weekdays").tag("weekdays")
						}
						Stepper("Every \(scheduleInterval)", value: $scheduleInterval, in: 1...52)
					}
				}

				Section {
					ForEach(selectedExercises.indices, id: \.self) { index in
						HStack {
							Text("\(index + 1).")
								.foregroundStyle(.secondary)
							Text(exerciseName(for: selectedExercises[index].exerciseId))
							Spacer()
						}
					}
					.onDelete { indexSet in
						selectedExercises.remove(atOffsets: indexSet)
						reorderExercises()
					}
					.onMove { from, to in
						selectedExercises.move(fromOffsets: from, toOffset: to)
						reorderExercises()
					}
				} header: {
					Text("Exercises (\(selectedExercises.count))")
				}

				Section("Add Exercises") {
					TextField("Search", text: $searchText)
					ForEach(filteredExercises) { exercise in
						Button {
							addExercise(exercise)
						} label: {
							HStack {
								Text(exercise.name)
								Spacer()
								if selectedExercises.contains(where: { $0.exerciseId == exercise.id }) {
									Image(systemName: "checkmark")
										.foregroundStyle(.green)
								}
							}
						}
						.foregroundStyle(.primary)
					}
				}
			}
			.navigationTitle(existingWorkout != nil ? "Edit Workout" : "Create Workout")
			.navigationBarTitleDisplayMode(.inline)
			.toolbar {
				ToolbarItem(placement: .cancellationAction) {
					Button("Cancel") { dismiss() }
				}
				ToolbarItem(placement: .confirmationAction) {
					Button("Save") {
						Task { await save() }
					}
					.disabled(name.isEmpty || selectedExercises.isEmpty || isSaving)
				}
			}
			.task {
				await loadExercises()
			}
		}
	}

	private var filteredExercises: [Exercise] {
		if searchText.isEmpty {
			return availableExercises
		}
		return availableExercises.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
	}

	private func exerciseName(for id: String) -> String {
		availableExercises.first(where: { $0.id == id })?.name ?? id
	}

	private func addExercise(_ exercise: Exercise) {
		if selectedExercises.contains(where: { $0.exerciseId == exercise.id }) {
			selectedExercises.removeAll(where: { $0.exerciseId == exercise.id })
		} else {
			selectedExercises.append(WorkoutExerciseInput(
				exerciseId: exercise.id,
				order: selectedExercises.count,
				defaultSets: nil,
				defaultReps: nil,
				defaultWeight: nil
			))
		}
		reorderExercises()
	}

	private func reorderExercises() {
		for i in selectedExercises.indices {
			selectedExercises[i] = WorkoutExerciseInput(
				exerciseId: selectedExercises[i].exerciseId,
				order: i,
				defaultSets: selectedExercises[i].defaultSets,
				defaultReps: selectedExercises[i].defaultReps,
				defaultWeight: selectedExercises[i].defaultWeight
			)
		}
	}

	private func loadExercises() async {
		availableExercises = (try? await healthService.fetchExercises()) ?? []
	}

	private func save() async {
		isSaving = true
		let schedule: RecurrenceRule? = hasSchedule ? RecurrenceRule(
			frequency: scheduleFrequency,
			interval: scheduleInterval
		) : nil

		let request = CreateWorkoutRequest(
			name: name,
			difficulty: difficulty.rawValue,
			exercises: selectedExercises,
			schedule: schedule
		)

		do {
			if let existing = existingWorkout {
				_ = try await healthService.updateWorkout(id: existing.id, request: request)
			} else {
				_ = try await healthService.createWorkout(request: request)
			}
			dismiss()
		} catch {
			isSaving = false
		}
	}
}
