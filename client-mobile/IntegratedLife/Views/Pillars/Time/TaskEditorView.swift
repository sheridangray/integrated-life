import SwiftUI

struct TaskEditorView: View {
	@ObservedObject var timeState: TimeState
	let editingTask: TimeTask?
	let prefillStartTime: String?
	var isInboxContext: Bool = false
	@Environment(\.dismiss) private var dismiss

	@State private var title = ""
	@State private var hasDate = true
	@State private var taskDate: Date = Date()
	@State private var startTime: Date = Calendar.current.date(
		bySettingHour: 9, minute: 0, second: 0, of: Date()
	) ?? Date()
	@State private var isAllDay = false
	@State private var durationMinutes = 30
	@State private var selectedColor = "#FF6B6B"
	@State private var selectedIcon = "circle.fill"
	@State private var notes = ""
	@State private var showDeleteConfirm = false

	private var isEditing: Bool { editingTask != nil }

	var body: some View {
		NavigationStack {
			Form {
				titleSection
				dateSection
				if hasDate {
					timeSection
				}
				durationSection
				appearanceSection
				notesSection
				if isEditing {
					deleteSection
				}
			}
			.navigationTitle(isEditing ? "Edit Task" : "New Task")
			.navigationBarTitleDisplayMode(.inline)
			.toolbar {
				ToolbarItem(placement: .cancellationAction) {
					Button("Cancel") { dismiss() }
				}
				ToolbarItem(placement: .confirmationAction) {
					Button(isEditing ? "Update" : "Create") {
						Task { await save() }
					}
					.disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
				}
			}
			.onAppear(perform: populateFromTask)
			.confirmationDialog(
				editingTask?.isRoutineInstance == true ? "Routine Task" : "Delete Task",
				isPresented: $showDeleteConfirm,
				titleVisibility: .visible
			) {
				if editingTask?.isRoutineInstance == true {
					Button("Skip just today") {
						Task { await skipRoutineAndDismiss() }
					}
					Button("Deactivate routine", role: .destructive) {
						Task { await deactivateRoutineAndDismiss() }
					}
				} else {
					Button("Delete", role: .destructive) {
						Task { await deleteAndDismiss() }
					}
				}
			} message: {
				if editingTask?.isRoutineInstance == true {
					Text("Remove this routine occurrence or deactivate the entire routine?")
				} else {
					Text("This task will be permanently removed.")
				}
			}
		}
	}

	// MARK: - Sections

	private var titleSection: some View {
		Section {
			TextField("Task title", text: $title)
				.font(.title3)
		}
	}

	private var dateSection: some View {
		Section {
			Toggle("Schedule on a date", isOn: $hasDate)

			if hasDate {
				DatePicker(
					"Date",
					selection: $taskDate,
					displayedComponents: .date
				)
			}
		} footer: {
			if !hasDate {
				Text("Unscheduled tasks appear in your Inbox.")
			}
		}
	}

	private var timeSection: some View {
		Section {
			Toggle("All Day", isOn: $isAllDay)

			if !isAllDay {
				DatePicker(
					"Start Time",
					selection: $startTime,
					displayedComponents: .hourAndMinute
				)
			}
		}
	}

	private var durationSection: some View {
		Section("Duration") {
			HStack(spacing: 8) {
				ForEach(DurationPreset.allCases) { preset in
					Button {
						durationMinutes = preset.minutes
					} label: {
						Text(preset.label)
							.font(.subheadline.weight(.medium))
							.padding(.horizontal, 12)
							.padding(.vertical, 8)
							.background(
								durationMinutes == preset.minutes
									? Color.blue
									: Color.secondary.opacity(0.12),
								in: Capsule()
							)
							.foregroundStyle(
								durationMinutes == preset.minutes ? .white : .primary
							)
					}
					.buttonStyle(.plain)
				}
			}

			Stepper(
				"\(durationMinutes / 60)h \(durationMinutes % 60)m",
				value: $durationMinutes,
				in: 5...480,
				step: 5
			)
		}
	}

	private var appearanceSection: some View {
		Section("Color & Icon") {
			TaskColorPickerRow(selectedColor: $selectedColor)
			TaskIconPickerRow(selectedIcon: $selectedIcon, tintColor: selectedColor)
		}
	}

	private var notesSection: some View {
		Section("Notes") {
			TextField("Optional notes...", text: $notes, axis: .vertical)
				.lineLimit(3...6)
		}
	}

	private var deleteSection: some View {
		Section {
			Button("Delete Task", role: .destructive) {
				showDeleteConfirm = true
			}
		}
	}

	// MARK: - Actions

	private func populateFromTask() {
		if isInboxContext && editingTask == nil {
			hasDate = false
		}

		guard let task = editingTask else {
			if let prefill = prefillStartTime {
				let parts = prefill.split(separator: ":")
				if let h = Int(parts[0]), let m = Int(parts[1]) {
					startTime = Calendar.current.date(
						bySettingHour: h, minute: m, second: 0, of: Date()
					) ?? Date()
				}
			}
			taskDate = timeState.selectedDate
			return
		}

		title = task.title
		isAllDay = task.isAllDay
		durationMinutes = task.durationMinutes
		selectedColor = task.color
		selectedIcon = task.icon
		notes = task.notes ?? ""

		if let dateStr = task.date {
			hasDate = true
			let formatter = DateFormatter()
			formatter.dateFormat = "yyyy-MM-dd"
			formatter.locale = Locale(identifier: "en_US_POSIX")
			taskDate = formatter.date(from: dateStr) ?? timeState.selectedDate
		} else {
			hasDate = false
		}

		if let st = task.startTime {
			let parts = st.split(separator: ":")
			if let h = Int(parts[0]), let m = Int(parts[1]) {
				startTime = Calendar.current.date(
					bySettingHour: h, minute: m, second: 0, of: Date()
				) ?? Date()
			}
		}
	}

	private static let dateFormatter: DateFormatter = {
		let f = DateFormatter()
		f.dateFormat = "yyyy-MM-dd"
		f.locale = Locale(identifier: "en_US_POSIX")
		return f
	}()

	private func save() async {
		let cal = Calendar.current
		let h = cal.component(.hour, from: startTime)
		let m = cal.component(.minute, from: startTime)
		let timeString: String? = (hasDate && !isAllDay) ? String(format: "%02d:%02d", h, m) : nil
		let dateString: String? = hasDate ? Self.dateFormatter.string(from: taskDate) : nil

		if let task = editingTask {
			let request = UpdateTimeTaskRequest(
				title: title.trimmingCharacters(in: .whitespaces),
				date: .some(dateString),
				startTime: .some(timeString),
				durationMinutes: durationMinutes,
				color: selectedColor,
				icon: selectedIcon,
				notes: notes.isEmpty ? nil : notes
			)
			await timeState.updateTask(id: task.id, request: request)
		} else {
			await timeState.createTask(
				title: title.trimmingCharacters(in: .whitespaces),
				date: dateString,
				startTime: timeString,
				durationMinutes: durationMinutes,
				color: selectedColor,
				icon: selectedIcon,
				notes: notes.isEmpty ? nil : notes
			)
		}
		dismiss()
	}

	private func deleteAndDismiss() async {
		guard let task = editingTask else { return }
		await timeState.deleteTask(id: task.id)
		dismiss()
	}

	private func skipRoutineAndDismiss() async {
		guard let task = editingTask else { return }
		await timeState.skipRoutineToday(task: task)
		dismiss()
	}

	private func deactivateRoutineAndDismiss() async {
		guard let task = editingTask, let routineId = task.routineId else { return }
		let request = UpdateRoutineRequest(isActive: false)
		await timeState.updateRoutine(id: routineId, request: request)
		await timeState.deleteTask(id: task.id)
		dismiss()
	}
}
