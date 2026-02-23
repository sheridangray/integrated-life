import SwiftUI

struct WorkoutListView: View {
	@ObservedObject var healthState: HealthState

	@State private var selectedDifficulty: Difficulty?
	@State private var selectedVisibility: WorkoutVisibility?
	@State private var showCreateSheet = false

	var body: some View {
		List {
			if healthState.isLoading && healthState.workouts.isEmpty {
				ProgressView()
					.frame(maxWidth: .infinity)
					.listRowSeparator(.hidden)
			} else if healthState.workouts.isEmpty {
				ContentUnavailableView("No Workouts", systemImage: "list.bullet.rectangle", description: Text("No workouts match your filters."))
			} else {
				ForEach(healthState.workouts) { workout in
					NavigationLink(value: HealthNavDestination.workoutDetail(workout.id)) {
						WorkoutRowView(workout: workout)
					}
				}
			}
		}
		.listStyle(.plain)
		.toolbar {
			ToolbarItem(placement: .topBarTrailing) {
				HStack(spacing: 12) {
					Menu {
						Menu("Difficulty") {
							Button("All") { selectedDifficulty = nil }
							ForEach(Difficulty.allCases) { diff in
								Button(diff.rawValue) { selectedDifficulty = diff }
							}
						}
						Menu("Visibility") {
							Button("All") { selectedVisibility = nil }
							Button("Global") { selectedVisibility = .global }
							Button("My Workouts") { selectedVisibility = .user }
						}
					} label: {
						Image(systemName: "line.3.horizontal.decrease.circle")
					}

					Button {
						showCreateSheet = true
					} label: {
						Image(systemName: "plus")
					}
				}
			}
		}
		.sheet(isPresented: $showCreateSheet) {
			Task { await loadWorkouts() }
		} content: {
			CreateWorkoutView()
		}
		.refreshable {
			await loadWorkouts()
		}
		.task {
			await loadWorkouts()
		}
		.onChange(of: selectedDifficulty) {
			Task { await loadWorkouts() }
		}
		.onChange(of: selectedVisibility) {
			Task { await loadWorkouts() }
		}
	}

	private func loadWorkouts() async {
		await healthState.loadWorkouts(
			difficulty: selectedDifficulty?.rawValue,
			visibility: selectedVisibility?.rawValue
		)
	}
}

private struct WorkoutRowView: View {
	let workout: Workout

	var body: some View {
		VStack(alignment: .leading, spacing: 4) {
			Text(workout.name)
				.font(.headline)
			HStack(spacing: 6) {
				if workout.isGlobal {
					Text("Global")
						.font(.caption2)
						.padding(.horizontal, 6)
						.padding(.vertical, 2)
						.background(.blue.opacity(0.15), in: Capsule())
				}
				Text("\(workout.exerciseCount ?? workout.exercises?.count ?? 0) exercises")
					.font(.caption)
					.foregroundStyle(.secondary)
			}
		}
		.padding(.vertical, 2)
	}
}
