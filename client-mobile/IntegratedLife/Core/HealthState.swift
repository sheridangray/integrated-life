import Foundation

@MainActor
final class HealthState: ObservableObject {
	private let healthService = HealthService.shared

	@Published var exercises: [Exercise] = []
	@Published var workouts: [Workout] = []
	@Published var history: PaginatedHistory?
	@Published var isLoading = false
	@Published var error: String?

	// MARK: - Exercises

	func loadExercises(bodyPart: String? = nil, muscle: String? = nil, search: String? = nil, favoritesOnly: Bool = false) async {
		isLoading = true
		error = nil
		do {
			exercises = try await healthService.fetchExercises(bodyPart: bodyPart, muscle: muscle, search: search, favoritesOnly: favoritesOnly)
		} catch {
			self.error = error.localizedDescription
		}
		isLoading = false
	}

	func toggleFavorite(exerciseId: String) async {
		do {
			let result = try await healthService.toggleFavorite(exerciseId: exerciseId)
			if let index = exercises.firstIndex(where: { $0.id == exerciseId }) {
				exercises[index].isFavorite = result.isFavorite
			}
		} catch {
			self.error = error.localizedDescription
		}
	}

	// MARK: - Workouts

	func loadWorkouts(visibility: String? = nil) async {
		isLoading = true
		error = nil
		do {
			workouts = try await healthService.fetchWorkouts(visibility: visibility)
		} catch {
			self.error = error.localizedDescription
		}
		isLoading = false
	}

	func deleteWorkout(id: String) async {
		do {
			try await healthService.deleteWorkout(id: id)
			workouts.removeAll { $0.id == id }
			await WorkoutNotificationScheduler.shared.rescheduleAll()
		} catch {
			self.error = error.localizedDescription
		}
	}

	// MARK: - History

	func loadHistory(page: Int = 1) async {
		isLoading = true
		error = nil
		do {
			history = try await healthService.fetchHistory(page: page)
		} catch {
			self.error = error.localizedDescription
		}
		isLoading = false
	}

	func deleteHistoryItem(type: String, id: String) async {
		do {
			try await healthService.deleteHistoryItem(type: type, id: id)
			history?.items.removeAll { $0.id == id && $0.type == type }
		} catch {
			self.error = error.localizedDescription
		}
	}
}
