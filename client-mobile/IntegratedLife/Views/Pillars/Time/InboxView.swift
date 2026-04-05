import SwiftUI

struct InboxView: View {
	@ObservedObject var timeState: TimeState
	@State private var editingTask: TimeTask?
	@State private var showingTaskEditor = false

	var body: some View {
		VStack(spacing: 0) {
			if timeState.isLoading && timeState.inboxTasks.isEmpty {
				Spacer()
				ProgressView("Loading inbox...")
				Spacer()
			} else if timeState.inboxTasks.isEmpty {
				emptyState
			} else {
				taskList
			}
		}
		.task { await timeState.loadInboxTasks() }
		.sheet(isPresented: $showingTaskEditor, onDismiss: { editingTask = nil }) {
			TaskEditorView(
				timeState: timeState,
				editingTask: editingTask,
				prefillStartTime: nil,
				isInboxContext: true
			)
		}
		.overlay(alignment: .bottomTrailing) { addButton }
	}

	private var emptyState: some View {
		VStack(spacing: 12) {
			Spacer()
			Image(systemName: "tray")
				.font(.system(size: 48))
				.foregroundStyle(.secondary)
			Text("No unscheduled tasks")
				.font(.headline)
				.foregroundStyle(.secondary)
			Text("Tasks without a date or time appear here.")
				.font(.subheadline)
				.foregroundStyle(.tertiary)
				.multilineTextAlignment(.center)
			Spacer()
		}
		.padding()
	}

	private var taskList: some View {
		List {
			ForEach(timeState.inboxTasks) { task in
				InboxTaskRow(
					task: task,
					onTap: {
						editingTask = task
						showingTaskEditor = true
					},
					onToggleComplete: {
						Task { await timeState.toggleCompletion(task: task) }
					}
				)
			}
			.onDelete { offsets in
				let ids = offsets.map { timeState.inboxTasks[$0].id }
				for id in ids {
					Task { await timeState.deleteTask(id: id) }
				}
			}
		}
		.listStyle(.plain)
	}

	private var addButton: some View {
		Button {
			editingTask = nil
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
}

// MARK: - Inbox Task Row

private struct InboxTaskRow: View {
	let task: TimeTask
	let onTap: () -> Void
	let onToggleComplete: () -> Void

	private var blockColor: Color {
		Color(hex: task.color) ?? .blue
	}

	var body: some View {
		Button(action: onTap) {
			HStack(spacing: 10) {
				Image(systemName: task.icon)
					.font(.subheadline)
					.foregroundStyle(blockColor)
					.frame(width: 24)

				VStack(alignment: .leading, spacing: 2) {
					Text(task.title)
						.font(.body)
						.foregroundStyle(.primary)
						.lineLimit(1)
						.strikethrough(task.isCompleted)

					Text("\(task.durationMinutes)m")
						.font(.caption)
						.foregroundStyle(.secondary)
				}

				Spacer()

				Button { onToggleComplete() } label: {
					Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
						.font(.title3)
						.foregroundStyle(task.isCompleted ? blockColor : .secondary)
				}
				.buttonStyle(.plain)
			}
			.padding(.vertical, 4)
		}
		.buttonStyle(.plain)
		.opacity(task.isCompleted ? 0.6 : 1.0)
	}
}
