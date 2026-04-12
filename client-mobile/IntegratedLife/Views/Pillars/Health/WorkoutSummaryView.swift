import SwiftUI

struct WorkoutSummaryView: View {
	let workoutName: String
	let exerciseLogIds: [String]
	let workoutLogId: String

	@Environment(\.dismiss) private var dismiss

	@State private var workoutInsight: WorkoutInsightResponse?
	@State private var isLoading = true
	@State private var error: String?

	private let healthService = HealthService.shared

	var body: some View {
		NavigationStack {
			ScrollView {
				VStack(alignment: .leading, spacing: 20) {
					completionHeader

				if isLoading {
					loadingSection
				} else if let error {
					errorSection(error)
				} else if let workoutInsight, hasInsightContent(workoutInsight) {
					insightsContent(workoutInsight)
				} else {
					unavailableSection
				}
				}
				.padding()
			}
			.navigationTitle("Workout Complete")
			.navigationBarTitleDisplayMode(.inline)
			.toolbar {
				ToolbarItem(placement: .confirmationAction) {
					Button("Done") { dismiss() }
				}
			}
			.task {
				await loadInsight()
			}
		}
	}

	private var completionHeader: some View {
		VStack(spacing: 8) {
			Image(systemName: "checkmark.circle.fill")
				.font(.system(size: 48))
				.foregroundStyle(.green)
			Text(workoutName)
				.font(.title2)
				.fontWeight(.bold)
			Text("\(exerciseLogIds.count) exercise\(exerciseLogIds.count == 1 ? "" : "s") completed")
				.font(.subheadline)
				.foregroundStyle(.secondary)
		}
		.frame(maxWidth: .infinity)
		.padding(.vertical, 8)
	}

	private var loadingSection: some View {
		VStack(spacing: 12) {
			ProgressView()
			Text("Generating workout insights...")
				.font(.subheadline)
				.foregroundStyle(.secondary)
		}
		.frame(maxWidth: .infinity)
		.padding(.vertical, 20)
	}

	private func errorSection(_ message: String) -> some View {
		VStack(spacing: 12) {
			Image(systemName: "exclamationmark.triangle")
				.font(.title2)
				.foregroundStyle(.orange)
			Text("Couldn't generate insights")
				.font(.subheadline)
				.foregroundStyle(.secondary)
			Button {
				Task { await loadInsight() }
			} label: {
				Text("Retry")
					.appActionLabelStyle()
			}
			.buttonStyle(.bordered)
		}
		.frame(maxWidth: .infinity)
		.padding(.vertical, 20)
	}

	private var unavailableSection: some View {
		VStack(spacing: 8) {
			Text("AI insights aren't available right now")
				.font(.subheadline)
				.foregroundStyle(.secondary)
			Button {
				Task { await loadInsight() }
			} label: {
				Text("Retry")
					.appActionLabelStyle()
			}
			.buttonStyle(.bordered)
		}
		.frame(maxWidth: .infinity)
		.padding(.vertical, 20)
	}

	private func hasInsightContent(_ insight: WorkoutInsightResponse) -> Bool {
		!insight.exerciseInsights.isEmpty || insight.overallInsight != nil
	}

	private func insightsContent(_ insight: WorkoutInsightResponse) -> some View {
		VStack(alignment: .leading, spacing: 16) {
			if !insight.exerciseInsights.isEmpty {
				exerciseInsightsSection(insight.exerciseInsights)
			}

			if let overall = insight.overallInsight {
				overallSection(overall)
			}
		}
	}

	private func exerciseInsightsSection(_ insights: [ExerciseInsightItem]) -> some View {
		VStack(alignment: .leading, spacing: 12) {
			Text("Exercise Breakdown")
				.font(.headline)

			ForEach(insights) { item in
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
	}

	private func overallSection(_ overall: String) -> some View {
		VStack(alignment: .leading, spacing: 8) {
			Text("Overall Assessment")
				.font(.headline)

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

	private func loadInsight() async {
		isLoading = true
		error = nil
		do {
			workoutInsight = try await healthService.getWorkoutInsight(
				exerciseLogIds: exerciseLogIds,
				workoutLogId: workoutLogId
			)
		} catch {
			self.error = error.localizedDescription
		}
		isLoading = false
	}
}
