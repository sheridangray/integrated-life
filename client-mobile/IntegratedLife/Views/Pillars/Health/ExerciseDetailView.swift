import SwiftUI

struct ExerciseDetailView: View {
	let exerciseId: String
	@ObservedObject var healthState: HealthState

	@Environment(\.dismiss) private var dismiss

	@State private var exercise: Exercise?
	@State private var isLoading = true
	@State private var showLogSheet = false
	@State private var savedHistoryItem: HistoryItem?
	@State private var showHistoryDetail = false
	/// After logging from a workout, pop this detail so the user returns to the workout (not the exercise screen).
	@State private var dismissDetailAfterWorkoutLog = false

	private let healthService = HealthService.shared

	private var workoutSession: WorkoutSession? { healthState.activeWorkoutSession }
	private var isInWorkout: Bool { workoutSession != nil }

	var body: some View {
		ScrollView {
			if isLoading {
				ProgressView()
					.padding(.top, 40)
			} else if let exercise {
				VStack(alignment: .leading, spacing: 0) {
					videoSection(exercise)

					VStack(alignment: .leading, spacing: 20) {
						headerSection(exercise)
						stepsSection(exercise)
						actionsSection(exercise)
					}
					.padding()
				}
			}
		}
		.navigationTitle(exercise?.name ?? "Exercise")
		.task {
			await loadExercise()
		}
		.sheet(isPresented: $showLogSheet, onDismiss: {
			if dismissDetailAfterWorkoutLog {
				dismissDetailAfterWorkoutLog = false
				dismiss()
			} else if !isInWorkout, savedHistoryItem != nil {
				showHistoryDetail = true
			}
		}) {
			if let exercise {
				LogExerciseView(
					exercise: exercise,
					workoutId: workoutSession?.workoutId
				) { log in
					if let session = workoutSession {
						session.recordExerciseLog(exerciseId: exerciseId, logId: log.id)
						dismissDetailAfterWorkoutLog = true
					} else {
						savedHistoryItem = HistoryItem(
							type: "exercise",
							id: log.id,
							name: exercise.name,
							date: log.date,
							startTime: log.startTime,
							endTime: log.endTime,
							exerciseLogIds: nil
						)
					}
				}
			}
		}
		.navigationDestination(isPresented: $showHistoryDetail) {
			if let item = savedHistoryItem {
				HistoryDetailView(item: item)
			}
		}
	}

	private func headerSection(_ exercise: Exercise) -> some View {
		VStack(alignment: .leading, spacing: 8) {
			if let category = exercise.category {
				Text(category.uppercased())
					.font(.caption)
					.fontWeight(.semibold)
					.foregroundStyle(.secondary)
			}

			HStack(spacing: 12) {
				Label(exercise.resistanceType, systemImage: "scalemass")
				Label(exercise.measurementType, systemImage: "ruler")
			}
			.font(.subheadline)
			.foregroundStyle(.secondary)

			FlowLayout(spacing: 6) {
				ForEach(exercise.muscles, id: \.self) { muscle in
					Text(muscle)
						.font(.caption)
						.padding(.horizontal, 8)
						.padding(.vertical, 4)
						.background(.quaternary, in: Capsule())
				}
			}

			if isInWorkout {
				Label("Part of active workout", systemImage: "figure.run")
					.font(.caption)
					.foregroundStyle(.blue)
					.padding(.top, 4)
			}
		}
	}

	private func stepsSection(_ exercise: Exercise) -> some View {
		VStack(alignment: .leading, spacing: 8) {
			Text("Steps")
				.font(.headline)
			ForEach(Array(exercise.steps.enumerated()), id: \.offset) { index, step in
				HStack(alignment: .top, spacing: 12) {
					Text("\(index + 1)")
						.font(.caption)
						.fontWeight(.bold)
						.foregroundStyle(.white)
						.frame(width: 24, height: 24)
						.background(.blue, in: Circle())
					Text(step)
						.font(.body)
				}
			}
		}
	}

	@ViewBuilder
	private func videoSection(_ exercise: Exercise) -> some View {
		if let videoUrl = exercise.videoUrl, let url = URL(string: videoUrl),
		   let thumbnailUrl = YouTubeHelper.thumbnailURL(from: videoUrl) {
			Link(destination: url) {
				AsyncImage(url: thumbnailUrl) { image in
					image
						.resizable()
						.aspectRatio(16 / 9, contentMode: .fill)
				} placeholder: {
					Rectangle()
						.fill(Color(.systemGray5))
						.aspectRatio(16 / 9, contentMode: .fill)
						.overlay { ProgressView() }
				}
			}
		}
	}

	private func actionsSection(_ exercise: Exercise) -> some View {
		VStack(spacing: 12) {
			Button {
				showLogSheet = true
			} label: {
				Label(
					isInWorkout ? "Log Exercise (Workout)" : "Log Exercise",
					systemImage: "plus.circle"
				)
			}
			.buttonStyle(PrimaryButtonStyle())

			Button {
				Task {
					await healthState.toggleFavorite(exerciseId: exerciseId)
					self.exercise?.isFavorite = !(self.exercise?.isFavorite ?? false)
				}
			} label: {
				Label(
					exercise.isFavorite == true ? "Unfavorite" : "Favorite",
					systemImage: exercise.isFavorite == true ? "heart.fill" : "heart"
				)
			}
			.buttonStyle(SecondaryButtonStyle())
		}
	}

	private func loadExercise() async {
		isLoading = true
		do {
			exercise = try await healthService.fetchExercise(id: exerciseId)
		} catch {
			healthState.error = error.localizedDescription
		}
		isLoading = false
	}
}

struct FlowLayout: Layout {
	var spacing: CGFloat = 8

	func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
		let result = computeLayout(proposal: proposal, subviews: subviews)
		return result.size
	}

	func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
		let result = computeLayout(proposal: proposal, subviews: subviews)
		for (index, position) in result.positions.enumerated() {
			subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
		}
	}

	private func computeLayout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
		let maxWidth = proposal.width ?? .infinity
		var positions: [CGPoint] = []
		var x: CGFloat = 0
		var y: CGFloat = 0
		var rowHeight: CGFloat = 0

		for subview in subviews {
			let size = subview.sizeThatFits(.unspecified)
			if x + size.width > maxWidth && x > 0 {
				x = 0
				y += rowHeight + spacing
				rowHeight = 0
			}
			positions.append(CGPoint(x: x, y: y))
			rowHeight = max(rowHeight, size.height)
			x += size.width + spacing
		}

		return (CGSize(width: maxWidth, height: y + rowHeight), positions)
	}
}
