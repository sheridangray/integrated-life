import SwiftUI

struct HistoryDetailView: View {
	let item: HistoryItem

	@State private var exerciseLog: ExerciseLog?
	@State private var isLoading = true

	private let healthService = HealthService.shared

	var body: some View {
		ScrollView {
			if isLoading {
				ProgressView()
					.padding(.top, 40)
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

	private func loadDetail() async {
		isLoading = true
		exerciseLog = try? await healthService.fetchHistoryDetail(type: item.type, id: item.id)
		isLoading = false
	}
}
