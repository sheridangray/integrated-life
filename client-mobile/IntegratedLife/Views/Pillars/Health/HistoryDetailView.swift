import SwiftUI

struct HistoryDetailView: View {
	let item: HistoryItem

	@State private var exerciseLog: ExerciseLog?
	@State private var workoutDetail: WorkoutHistoryDetail?
	@State private var isLoading = true

	private let healthService = HealthService.shared

	var body: some View {
		ScrollView {
			if isLoading {
				ProgressView()
					.padding(.top, 40)
			} else if item.type == "workout", let detail = workoutDetail {
				workoutDetailContent(detail)
			} else if let log = exerciseLog {
				exerciseLogDetail(log)
			} else {
				fallbackDetail
			}
		}
		.navigationTitle(item.name)
		.task {
			await loadDetail()
		}
	}

	// MARK: - Workout Detail

	private func workoutDetailContent(_ detail: WorkoutHistoryDetail) -> some View {
		VStack(alignment: .leading, spacing: 16) {
			workoutDateTimeCard(detail)
			workoutExercisesSection(detail.exercises)

			if let insight = detail.workoutInsight, hasInsightContent(insight) {
				workoutInsightsSection(insight)
			}
		}
		.padding()
	}

	private func workoutDateTimeCard(_ detail: WorkoutHistoryDetail) -> some View {
		VStack(spacing: 12) {
			HStack {
				Image(systemName: "calendar")
					.foregroundStyle(.blue)
				Text(DateFormatting.displayDate(detail.date))
					.font(.subheadline)
					.fontWeight(.medium)
				Spacer()
				if detail.completedAll {
					Label("Complete", systemImage: "checkmark.circle.fill")
						.font(.caption)
						.foregroundStyle(.green)
				}
			}

			Divider()

			HStack(spacing: 24) {
				VStack(alignment: .leading, spacing: 2) {
					Text("Start")
						.font(.caption)
						.foregroundStyle(.tertiary)
					Text(DateFormatting.displayTime(detail.startTime))
						.font(.subheadline)
				}
				VStack(alignment: .leading, spacing: 2) {
					Text("End")
						.font(.caption)
						.foregroundStyle(.tertiary)
					Text(DateFormatting.displayTime(detail.endTime))
						.font(.subheadline)
				}
				Spacer()
				VStack(alignment: .trailing, spacing: 2) {
					Text("Exercises")
						.font(.caption)
						.foregroundStyle(.tertiary)
					Text("\(detail.exercises.count)")
						.font(.subheadline)
						.fontWeight(.medium)
				}
			}
		}
		.padding()
		.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
	}

	private func workoutExercisesSection(_ exercises: [WorkoutHistoryExercise]) -> some View {
		VStack(alignment: .leading, spacing: 12) {
			Text("Exercises")
				.font(.headline)

			ForEach(exercises) { exercise in
				VStack(alignment: .leading, spacing: 8) {
					HStack {
						Image(systemName: "figure.strengthtraining.traditional")
							.foregroundStyle(.blue)
						Text(exercise.exerciseName)
							.font(.subheadline)
							.fontWeight(.semibold)
						Spacer()
						Text(exercise.resistanceType)
							.font(.caption)
							.foregroundStyle(.secondary)
					}

					ForEach(exercise.sets, id: \.setNumber) { set in
						HStack {
							Text("Set \(set.setNumber)")
								.fontWeight(.medium)
								.frame(width: 50, alignment: .leading)
							Spacer()
							setMetrics(set)
						}
						.font(.caption)
						.padding(.vertical, 4)
						.padding(.horizontal, 8)
						.background(.quaternary, in: RoundedRectangle(cornerRadius: 6))
					}
				}
				.padding(12)
				.background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 10))
			}
		}
	}

	private func hasInsightContent(_ insight: WorkoutInsightResponse) -> Bool {
		!insight.exerciseInsights.isEmpty || insight.overallInsight != nil
	}

	private func workoutInsightsSection(_ insight: WorkoutInsightResponse) -> some View {
		VStack(alignment: .leading, spacing: 12) {
			Label("AI Insights", systemImage: "sparkles")
				.font(.headline)

			if !insight.exerciseInsights.isEmpty {
				ForEach(insight.exerciseInsights) { item in
					HStack(alignment: .top, spacing: 10) {
						Image(systemName: "figure.strengthtraining.traditional")
							.foregroundStyle(.blue)
							.frame(width: 20)
						VStack(alignment: .leading, spacing: 4) {
							Text(item.exerciseName)
								.font(.subheadline)
								.fontWeight(.semibold)
							Text(item.insight)
								.font(.subheadline)
								.foregroundStyle(.secondary)
						}
					}
					.padding(12)
					.frame(maxWidth: .infinity, alignment: .leading)
					.background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 10))
				}
			}

			if let overall = insight.overallInsight {
				HStack(alignment: .top, spacing: 10) {
					Image(systemName: "sparkles")
						.foregroundStyle(.purple)
					Text(overall)
						.font(.subheadline)
				}
				.padding(12)
				.frame(maxWidth: .infinity, alignment: .leading)
				.background(Color(.purple).opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
			}
		}
	}

	// MARK: - Exercise Detail

	private var fallbackDetail: some View {
		VStack(spacing: 16) {
			Image(systemName: "figure.strengthtraining.traditional")
				.font(.system(size: 40))
				.foregroundStyle(.blue)
			Text(item.name)
				.font(.title2)
				.fontWeight(.semibold)
			Text(DateFormatting.displayDate(item.date))
				.foregroundStyle(.secondary)
		}
		.padding(.top, 40)
	}

	private func exerciseLogDetail(_ log: ExerciseLog) -> some View {
		VStack(alignment: .leading, spacing: 16) {
			dateTimeCard(log)
			resistanceLabel(log)
			setsCard(log)
			notesCard(log)
		}
		.padding()
	}

	private func dateTimeCard(_ log: ExerciseLog) -> some View {
		VStack(spacing: 12) {
			HStack {
				Image(systemName: "calendar")
					.foregroundStyle(.blue)
				Text(DateFormatting.displayDate(log.date))
					.font(.subheadline)
					.fontWeight(.medium)
				Spacer()
			}

			Divider()

			HStack(spacing: 24) {
				VStack(alignment: .leading, spacing: 2) {
					Text("Start")
						.font(.caption)
						.foregroundStyle(.tertiary)
					Text(DateFormatting.displayTime(log.startTime))
						.font(.subheadline)
				}
				VStack(alignment: .leading, spacing: 2) {
					Text("End")
						.font(.caption)
						.foregroundStyle(.tertiary)
					Text(DateFormatting.displayTime(log.endTime))
						.font(.subheadline)
				}
				Spacer()
			}
		}
		.padding()
		.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
	}

	private func resistanceLabel(_ log: ExerciseLog) -> some View {
		Label(log.resistanceType, systemImage: "scalemass")
			.font(.subheadline)
			.foregroundStyle(.secondary)
			.padding(.horizontal, 4)
	}

	private func setsCard(_ log: ExerciseLog) -> some View {
		VStack(alignment: .leading, spacing: 12) {
			Text("Sets")
				.font(.headline)

			ForEach(log.sets, id: \.setNumber) { set in
				HStack {
					Text("Set \(set.setNumber)")
						.fontWeight(.medium)
						.frame(width: 50, alignment: .leading)
					Spacer()
					setMetrics(set)
				}
				.font(.subheadline)
				.padding(.vertical, 10)
				.padding(.horizontal, 12)
				.background(.quaternary, in: RoundedRectangle(cornerRadius: 8))
			}
		}
	}

	@ViewBuilder
	private func setMetrics(_ set: ExerciseSet) -> some View {
		HStack(spacing: 12) {
			if let weight = set.weight {
				Text("\(Int(weight)) lbs")
			}
			if let reps = set.reps {
				Text("\(reps) reps")
					.foregroundStyle(.secondary)
			}
			if let mins = set.minutes {
				Text("\(Int(mins))m")
			}
			if let secs = set.seconds {
				Text("\(Int(secs))s")
			}
			if let miles = set.miles {
				Text(String(format: "%.1f mi", miles))
			}
		}
	}

	@ViewBuilder
	private func notesCard(_ log: ExerciseLog) -> some View {
		if let notes = log.notes, !notes.isEmpty {
			VStack(alignment: .leading, spacing: 8) {
				Text("Notes")
					.font(.headline)
				Text(notes)
					.font(.body)
					.foregroundStyle(.secondary)
					.frame(maxWidth: .infinity, alignment: .leading)
					.padding()
					.background(.quaternary, in: RoundedRectangle(cornerRadius: 8))
			}
		}
	}

	// MARK: - Loading

	private func loadDetail() async {
		isLoading = true
		if item.type == "workout" {
			workoutDetail = try? await healthService.fetchWorkoutHistoryDetail(id: item.id)
		} else {
			exerciseLog = try? await healthService.fetchHistoryDetail(type: item.type, id: item.id)
		}
		isLoading = false
	}
}
