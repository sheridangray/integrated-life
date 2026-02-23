import SwiftUI

struct HistoryView: View {
	@ObservedObject var healthState: HealthState

	@State private var summary: AIInsight?
	@State private var isLoadingSummary = false
	@State private var isExporting = false

	private let healthService = HealthService.shared

	var body: some View {
		List {
			summarySection
			historyListSection
		}
		.listStyle(.plain)
		.toolbar {
			ToolbarItem(placement: .topBarTrailing) {
				Button {
					isExporting = true
				} label: {
					Image(systemName: "square.and.arrow.up")
				}
			}
		}
		.refreshable {
			await loadData()
		}
		.task {
			await loadData()
		}
		.alert("Export", isPresented: $isExporting) {
			Button("Export CSV") {
				Task { await exportCSV() }
			}
			Button("Cancel", role: .cancel) {}
		} message: {
			Text("Export your exercise history as a CSV file?")
		}
	}

	@ViewBuilder
	private var summarySection: some View {
		if isLoadingSummary {
			Section {
				HStack {
					ProgressView()
						.padding(.trailing, 8)
					Text("Generating summary...")
						.foregroundStyle(.secondary)
				}
			}
		} else if let summaryText = summary?.insight {
			Section("AI Summary") {
				HStack(alignment: .top, spacing: 8) {
					Image(systemName: "sparkles")
						.foregroundStyle(.purple)
					Text(summaryText)
						.font(.subheadline)
				}
				.padding(.vertical, 4)
			}
		}
	}

	private var groupedItems: [HistoryDisplayItem] {
		guard let history = healthState.history else { return [] }

		var workoutExerciseIds = Set<String>()
		for item in history.items where item.type == "workout" {
			if let ids = item.exerciseLogIds {
				workoutExerciseIds.formUnion(ids)
			}
		}

		var result: [HistoryDisplayItem] = []
		for item in history.items {
			if item.type == "workout" {
				let childExercises = history.items.filter { exercise in
					exercise.type == "exercise" &&
					(item.exerciseLogIds ?? []).contains(exercise.id)
				}
				result.append(HistoryDisplayItem(item: item, childExercises: childExercises))
			} else if !workoutExerciseIds.contains(item.id) {
				result.append(HistoryDisplayItem(item: item, childExercises: []))
			}
		}
		return result
	}

	@ViewBuilder
	private var historyListSection: some View {
		if let history = healthState.history {
			Section("Recent Activity") {
				if history.items.isEmpty {
					ContentUnavailableView("No History", systemImage: "clock", description: Text("Log exercises or workouts to see them here."))
				} else {
					ForEach(groupedItems) { displayItem in
						if displayItem.item.type == "workout" {
							WorkoutHistoryRow(
								item: displayItem.item,
								childExercises: displayItem.childExercises
							)
							.swipeActions(edge: .trailing, allowsFullSwipe: true) {
								Button(role: .destructive) {
									Task { await healthState.deleteHistoryItem(type: displayItem.item.type, id: displayItem.item.id) }
								} label: {
									Label("Delete", systemImage: "trash")
								}
							}
						} else {
							NavigationLink(value: displayItem.item) {
								ExerciseHistoryRow(item: displayItem.item)
							}
							.swipeActions(edge: .trailing, allowsFullSwipe: true) {
								Button(role: .destructive) {
									Task { await healthState.deleteHistoryItem(type: displayItem.item.type, id: displayItem.item.id) }
								} label: {
									Label("Delete", systemImage: "trash")
								}
							}
						}
					}

					if history.page < history.totalPages {
						Button("Load More") {
							Task {
								await healthState.loadHistory(page: history.page + 1)
							}
						}
					}
				}
			}
		}
	}

	private func loadData() async {
		async let historyTask: () = healthState.loadHistory()
		async let summaryTask: () = loadSummary()
		_ = await (historyTask, summaryTask)
	}

	private func loadSummary() async {
		isLoadingSummary = true
		summary = try? await healthService.getHistorySummary()
		isLoadingSummary = false
	}

	private func exportCSV() async {}
}

// MARK: - Display Models

private struct HistoryDisplayItem: Identifiable {
	let item: HistoryItem
	let childExercises: [HistoryItem]

	var id: String { "\(item.type)-\(item.id)" }
}

// MARK: - Row Views

private struct ExerciseHistoryRow: View {
	let item: HistoryItem

	var body: some View {
		HStack(spacing: 12) {
			Image(systemName: "figure.strengthtraining.traditional")
				.foregroundStyle(.blue)
				.frame(width: 24)
			VStack(alignment: .leading, spacing: 2) {
				Text(item.name)
					.font(.body)
				Text(DateFormatting.displayDate(item.date))
					.font(.caption)
					.foregroundStyle(.secondary)
			}
		}
	}
}

private struct WorkoutHistoryRow: View {
	let item: HistoryItem
	let childExercises: [HistoryItem]

	@State private var isExpanded = false

	var body: some View {
		DisclosureGroup(isExpanded: $isExpanded) {
			ForEach(childExercises) { exercise in
				NavigationLink(value: exercise) {
					HStack(spacing: 12) {
						Image(systemName: "figure.strengthtraining.traditional")
							.foregroundStyle(.secondary)
							.frame(width: 20)
						Text(exercise.name)
							.font(.subheadline)
					}
					.padding(.leading, 4)
				}
			}

			if childExercises.isEmpty {
				Text("No exercises logged")
					.font(.caption)
					.foregroundStyle(.tertiary)
					.padding(.leading, 4)
			}
		} label: {
			HStack(spacing: 12) {
				Image(systemName: "list.bullet.rectangle")
					.foregroundStyle(.blue)
					.frame(width: 24)
				VStack(alignment: .leading, spacing: 2) {
					Text(item.name)
						.font(.body)
						.fontWeight(.medium)
					HStack(spacing: 6) {
						Text(DateFormatting.displayDate(item.date))
						if !childExercises.isEmpty {
							Text("·")
							Text("\(childExercises.count) exercises")
						}
					}
					.font(.caption)
					.foregroundStyle(.secondary)
				}
			}
		}
	}
}

// MARK: - Hashable

extension HistoryItem: Hashable {
	static func == (lhs: HistoryItem, rhs: HistoryItem) -> Bool {
		lhs.id == rhs.id && lhs.type == rhs.type
	}

	func hash(into hasher: inout Hasher) {
		hasher.combine(id)
		hasher.combine(type)
	}
}
