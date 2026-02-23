import SwiftUI

struct ExerciseListView: View {
	@ObservedObject var healthState: HealthState

	@State private var searchText = ""
	@State private var selectedBodyPart: BodyPart?
	@State private var selectedMuscle: MuscleGroup?
	@State private var showFavoritesOnly = false

	var body: some View {
		List {
			if healthState.isLoading && healthState.exercises.isEmpty {
				ProgressView()
					.frame(maxWidth: .infinity)
					.listRowSeparator(.hidden)
			} else if healthState.exercises.isEmpty {
				ContentUnavailableView("No Exercises", systemImage: "figure.run", description: Text("No exercises match your filters."))
			} else {
				ForEach(healthState.exercises) { exercise in
					NavigationLink(value: HealthNavDestination.exerciseDetail(exercise.id)) {
						ExerciseRowView(exercise: exercise)
					}
				}
			}
		}
		.listStyle(.plain)
		.searchable(text: $searchText, prompt: "Search exercises")
		.toolbar {
			ToolbarItem(placement: .topBarTrailing) {
				Menu {
					Toggle("Favorites Only", isOn: $showFavoritesOnly)

					Menu("Body Part") {
						Button("All") { selectedBodyPart = nil }
						ForEach(BodyPart.allCases) { part in
							Button(part.rawValue) { selectedBodyPart = part }
						}
					}

					Menu("Muscle") {
						Button("All") { selectedMuscle = nil }
						ForEach(MuscleGroup.allCases) { muscle in
							Button(muscle.rawValue) { selectedMuscle = muscle }
						}
					}
				} label: {
					Image(systemName: "line.3.horizontal.decrease.circle")
				}
			}
		}
		.refreshable {
			await loadExercises()
		}
		.task {
			await loadExercises()
		}
		.onChange(of: searchText) {
			Task { await loadExercises() }
		}
		.onChange(of: selectedBodyPart) {
			Task { await loadExercises() }
		}
		.onChange(of: selectedMuscle) {
			Task { await loadExercises() }
		}
		.onChange(of: showFavoritesOnly) {
			Task { await loadExercises() }
		}
	}

	private func loadExercises() async {
		await healthState.loadExercises(
			bodyPart: selectedBodyPart?.rawValue,
			muscle: selectedMuscle?.rawValue,
			search: searchText.isEmpty ? nil : searchText,
			favoritesOnly: showFavoritesOnly
		)
	}
}

private struct ExerciseRowView: View {
	let exercise: Exercise

	var body: some View {
		VStack(alignment: .leading, spacing: 4) {
			HStack {
				Text(exercise.name)
					.font(.headline)
				if exercise.isFavorite == true {
					Image(systemName: "heart.fill")
						.foregroundStyle(.red)
						.font(.caption)
				}
			}
			HStack(spacing: 8) {
				Text(exercise.resistanceType)
					.font(.caption)
					.foregroundStyle(.secondary)
				Text(exercise.bodyParts.joined(separator: ", "))
					.font(.caption)
					.foregroundStyle(.secondary)
			}
		}
		.padding(.vertical, 2)
	}
}
