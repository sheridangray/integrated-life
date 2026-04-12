import SwiftUI

struct RoutineManagerView: View {
	@ObservedObject var timeState: TimeState
	@State private var showEditor = false
	@State private var editingRoutine: TimeRoutine?
	@Environment(\.dismiss) private var dismiss

	var body: some View {
		NavigationStack {
			Group {
				if timeState.routines.isEmpty {
					emptyState
				} else {
					routineList
				}
			}
			.navigationTitle("Routines")
			.navigationBarTitleDisplayMode(.inline)
			.toolbar {
				ToolbarItem(placement: .cancellationAction) {
					Button("Done") { dismiss() }
				}
				ToolbarItem(placement: .primaryAction) {
					Button {
						editingRoutine = nil
						showEditor = true
					} label: {
						Image(systemName: "plus")
					}
				}
			}
			.task { await timeState.loadRoutines() }
			.sheet(isPresented: $showEditor, onDismiss: { editingRoutine = nil }) {
				RoutineEditorView(timeState: timeState, editingRoutine: editingRoutine)
			}
		}
	}

	private var emptyState: some View {
		VStack(spacing: 16) {
			Image(systemName: "arrow.triangle.2.circlepath")
				.font(.system(size: 40))
				.foregroundStyle(.secondary)
			Text("No routines yet")
				.font(.title3)
				.foregroundStyle(.secondary)
			Text("Routines auto-populate your daily timeline.")
				.font(.subheadline)
				.foregroundStyle(.tertiary)
				.multilineTextAlignment(.center)
			Button {
				editingRoutine = nil
				showEditor = true
			} label: {
				Text("Create Routine")
					.appActionLabelStyle()
			}
			.buttonStyle(.borderedProminent)
		}
		.padding()
	}

	private var routineList: some View {
		List {
			ForEach(timeState.routines) { routine in
				RoutineRow(routine: routine) {
					editingRoutine = routine
					showEditor = true
				} onToggle: {
					Task { await timeState.toggleRoutineActive(routine: routine) }
				}
			}
			.onDelete { indexSet in
				for idx in indexSet {
					let routine = timeState.routines[idx]
					Task { await timeState.deleteRoutine(id: routine.id) }
				}
			}
		}
		.listStyle(.insetGrouped)
	}
}

private struct RoutineRow: View {
	let routine: TimeRoutine
	let onTap: () -> Void
	let onToggle: () -> Void

	private var blockColor: Color {
		Color(hex: routine.color) ?? .blue
	}

	var body: some View {
		Button(action: onTap) {
			HStack(spacing: 12) {
				Image(systemName: routine.icon)
					.font(.title3)
					.foregroundStyle(blockColor)
					.frame(width: 32)

				VStack(alignment: .leading, spacing: 2) {
					Text(routine.title)
						.font(.body.weight(.medium))
						.foregroundStyle(routine.isActive ? .primary : .secondary)
					Text(routine.frequencyLabel)
						.font(.caption)
						.foregroundStyle(.secondary)
					if let time = routine.defaultTime {
						Text("\(time) · \(routine.defaultDuration)m")
							.font(.caption2)
							.foregroundStyle(.tertiary)
					}
				}

				Spacer()

				Toggle("", isOn: .constant(routine.isActive))
					.labelsHidden()
					.onTapGesture { onToggle() }
			}
		}
		.buttonStyle(.plain)
	}
}
