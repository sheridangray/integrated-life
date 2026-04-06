import SwiftUI

struct DayTimelineView: View {
	@ObservedObject var timeState: TimeState
	@State private var editingTask: TimeTask?
	@State private var showingTaskEditor = false
	@State private var prefillStartTime: String?

	var body: some View {
		VStack(spacing: 0) {
			StructuredDateHeader(date: timeState.selectedDate)

			TimelineWeekStrip(
				selectedDate: $timeState.selectedDate,
				onSelect: { date in
					Task { await timeState.loadTasks(for: date) }
				}
			)

			Divider()
				.padding(.top, 4)

			if timeState.isLoading && timeState.tasks.isEmpty {
				Spacer()
				ProgressView("Loading schedule...")
				Spacer()
			} else if timeState.timedTasks.isEmpty && timeState.allDayTasks.isEmpty {
				emptyState
			} else {
				ScrollViewReader { proxy in
					ScrollView {
						allDaySection
						taskListSection
					}
					.onAppear { scrollToNearestTask(proxy: proxy) }
				}
			}
		}
		.task {
			await timeState.migrateOverdueTasks()
			await timeState.loadTasks()
		}
		.sheet(isPresented: $showingTaskEditor, onDismiss: clearEditorState) {
			TaskEditorView(
				timeState: timeState,
				editingTask: editingTask,
				prefillStartTime: prefillStartTime
			)
		}
		.overlay(alignment: .bottomTrailing) {
			addButton
		}
	}

	// MARK: - Empty State

	private var emptyState: some View {
		VStack(spacing: 12) {
			Spacer()
			Image(systemName: "calendar.badge.plus")
				.font(.system(size: 40))
				.foregroundStyle(.secondary)
			Text("No tasks scheduled")
				.font(.headline)
				.foregroundStyle(.secondary)
			Text("Tap + to add a task to your day")
				.font(.subheadline)
				.foregroundStyle(.tertiary)
			Spacer()
		}
		.frame(maxWidth: .infinity)
	}

	// MARK: - All-Day Section

	@ViewBuilder
	private var allDaySection: some View {
		if !timeState.allDayTasks.isEmpty {
			VStack(spacing: 6) {
				HStack {
					Text("All Day")
						.font(.caption.weight(.medium))
						.foregroundStyle(.secondary)
					Spacer()
				}
				ForEach(timeState.allDayTasks) { task in
					AllDayTaskRow(
						task: task,
						onTap: {
							editingTask = task
							showingTaskEditor = true
						},
						onToggleComplete: {
							Task { await timeState.toggleCompletion(task: task) }
						},
						onDelete: {
							Task { await timeState.deleteTask(id: task.id) }
						}
					)
				}
			}
			.padding(.horizontal)
			.padding(.vertical, 8)

			Divider()
		}
	}

	// MARK: - Task List

	private var taskListSection: some View {
		LazyVStack(spacing: 0) {
			ForEach(Array(timeState.timedTasks.enumerated()), id: \.element.id) { index, task in
				StructuredTaskRow(
					task: task,
					isLast: index == timeState.timedTasks.count - 1,
					onTap: {
						editingTask = task
						showingTaskEditor = true
					},
					onToggleComplete: {
						Task { await timeState.toggleCompletion(task: task) }
					}
				)
				.id(task.id)
			}
		}
		.padding(.vertical, 8)
		.padding(.bottom, 80)
	}

	// MARK: - FAB

	private var addButton: some View {
		Button {
			editingTask = nil
			prefillStartTime = nil
			showingTaskEditor = true
		} label: {
			Image(systemName: "plus")
				.font(.title2.weight(.semibold))
				.foregroundStyle(.white)
				.frame(width: 56, height: 56)
				.background(Circle().fill(.blue))
				.shadow(radius: 4, y: 2)
		}
		.padding(20)
	}

	// MARK: - Helpers

	private func scrollToNearestTask(proxy: ScrollViewProxy) {
		guard Calendar.current.isDateInToday(timeState.selectedDate) else { return }
		let now = Date()
		let cal = Calendar.current
		let currentMinute = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)

		let nearest = timeState.timedTasks.first { task in
			guard let end = task.endMinuteOfDay else { return false }
			return end > currentMinute
		}
		if let nearest {
			withAnimation {
				proxy.scrollTo(nearest.id, anchor: .center)
			}
		}
	}

	private func clearEditorState() {
		editingTask = nil
		prefillStartTime = nil
	}
}
