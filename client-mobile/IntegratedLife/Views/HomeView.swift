import SwiftUI

struct HomeView: View {
	@ObservedObject var timeState: TimeState
	@EnvironmentObject private var appNavigation: AppNavigationState

	var body: some View {
		NavigationStack {
			ScrollView {
				VStack(spacing: 16) {
					if timeState.isLoading && timeState.tasks.isEmpty {
						ProgressView("Loading today's plan...")
							.padding(.top, 60)
					} else if timeState.tasks.isEmpty {
						emptyView
					} else {
						todayPlanView
					}
				}
				.padding()
			}
			.navigationTitle("Home")
			.task { await timeState.loadTasks(for: Date()) }
		}
	}

	private var emptyView: some View {
		VStack(spacing: 20) {
			Spacer().frame(height: 60)
			Image(systemName: "calendar.badge.clock")
				.font(.system(size: 48))
				.foregroundStyle(.secondary)
			Text("No tasks planned for today")
				.font(.title3)
				.foregroundStyle(.secondary)
			Text("Open the Time pillar to plan your day.")
				.font(.subheadline)
				.foregroundStyle(.tertiary)
			Button {
				appNavigation.selectedTabIndex = 1
			} label: {
				Label("Plan Your Day", systemImage: "calendar")
			}
			.buttonStyle(PrimaryButtonStyle())
			.padding(.horizontal, 40)
			Spacer()
		}
		.frame(maxWidth: .infinity)
	}

	private var todayPlanView: some View {
		VStack(spacing: 12) {
			HStack {
				Text("Today's Plan")
					.font(.headline)
				Spacer()
				Text("\(timeState.tasks.count) tasks")
					.font(.subheadline)
					.foregroundStyle(.secondary)
			}

			ForEach(timeState.timedTasks) { task in
				HomePlanRow(task: task)
			}

			if !timeState.allDayTasks.isEmpty {
				HStack {
					Text("All Day")
						.font(.caption.weight(.medium))
						.foregroundStyle(.secondary)
					Spacer()
				}
				.padding(.top, 4)

				ForEach(timeState.allDayTasks) { task in
					HomePlanRow(task: task)
				}
			}
		}
	}
}

private struct HomePlanRow: View {
	let task: TimeTask

	private var blockColor: Color {
		Color(hex: task.color) ?? .blue
	}

	var body: some View {
		HStack(spacing: 10) {
			RoundedRectangle(cornerRadius: 3)
				.fill(blockColor)
				.frame(width: 4)

			Image(systemName: task.icon)
				.font(.subheadline)
				.foregroundStyle(blockColor)
				.frame(width: 24)

			VStack(alignment: .leading, spacing: 2) {
				Text(task.title)
					.font(.subheadline.weight(.medium))
					.strikethrough(task.isCompleted)
				if let start = task.startTime {
					Text("\(start) · \(task.durationMinutes)m")
						.font(.caption)
						.foregroundStyle(.secondary)
				} else {
					Text("\(task.durationMinutes)m")
						.font(.caption)
						.foregroundStyle(.secondary)
				}
			}

			Spacer()
		}
		.padding(.vertical, 8)
		.padding(.horizontal, 12)
		.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
	}
}
