import SwiftUI

struct RoutineEditorView: View {
	@ObservedObject var timeState: TimeState
	let editingRoutine: TimeRoutine?
	@Environment(\.dismiss) private var dismiss

	@State private var title = ""
	@State private var hasTime = false
	@State private var defaultTime: Date = Calendar.current.date(
		bySettingHour: 7, minute: 0, second: 0, of: Date()
	) ?? Date()
	@State private var defaultDuration = 30
	@State private var selectedColor = "#4DABF7"
	@State private var selectedIcon = "arrow.triangle.2.circlepath"
	@State private var notes = ""
	@State private var frequency = "daily"
	@State private var interval = 1
	@State private var selectedDays: Set<Int> = []

	private var isEditing: Bool { editingRoutine != nil }

	var body: some View {
		NavigationStack {
			Form {
				titleSection
				scheduleSection
				timeSection
				durationSection
				appearanceSection
			}
			.navigationTitle(isEditing ? "Edit Routine" : "New Routine")
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
			.onAppear(perform: populateFromRoutine)
		}
	}

	private var titleSection: some View {
		Section {
			TextField("Routine title", text: $title)
				.font(.title3)
		}
	}

	private var scheduleSection: some View {
		Section("Recurrence") {
			Picker("Frequency", selection: $frequency) {
				Text("Daily").tag("daily")
				Text("Weekly").tag("weekly")
				Text("Monthly").tag("monthly")
				Text("Yearly").tag("yearly")
			}

			Stepper("Every \(interval) \(frequencyUnit)", value: $interval, in: 1...30)

			if frequency == "weekly" {
				dayOfWeekPicker
			}
		}
	}

	private var dayOfWeekPicker: some View {
		let dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
		return HStack(spacing: 6) {
			ForEach(0..<7, id: \.self) { day in
				Button {
					if selectedDays.contains(day) {
						selectedDays.remove(day)
					} else {
						selectedDays.insert(day)
					}
				} label: {
					Text(dayNames[day])
						.font(.caption.weight(.medium))
						.frame(width: 36, height: 36)
						.background(
							selectedDays.contains(day)
								? Color.blue
								: Color.secondary.opacity(0.12),
							in: Circle()
						)
						.foregroundStyle(selectedDays.contains(day) ? .white : .primary)
				}
				.buttonStyle(.plain)
			}
		}
	}

	private var frequencyUnit: String {
		switch frequency {
		case "daily": return interval == 1 ? "day" : "days"
		case "weekly": return interval == 1 ? "week" : "weeks"
		case "monthly": return interval == 1 ? "month" : "months"
		case "yearly": return interval == 1 ? "year" : "years"
		default: return ""
		}
	}

	private var timeSection: some View {
		Section {
			Toggle("Default Time", isOn: $hasTime)
			if hasTime {
				DatePicker(
					"Time",
					selection: $defaultTime,
					displayedComponents: .hourAndMinute
				)
			}
		}
	}

	private var durationSection: some View {
		Section("Duration") {
			Stepper(
				"\(defaultDuration / 60)h \(defaultDuration % 60)m",
				value: $defaultDuration,
				in: 5...480,
				step: 5
			)
		}
	}

	private var appearanceSection: some View {
		Section("Appearance") {
			TaskColorPickerRow(selectedColor: $selectedColor)
			TaskIconPickerRow(selectedIcon: $selectedIcon, tintColor: selectedColor)
		}
	}

	private func populateFromRoutine() {
		guard let r = editingRoutine else { return }
		title = r.title
		defaultDuration = r.defaultDuration
		selectedColor = r.color
		selectedIcon = r.icon
		notes = r.notes ?? ""
		frequency = r.recurrenceRule.frequency
		interval = r.recurrenceRule.interval
		selectedDays = Set(r.recurrenceRule.daysOfWeek ?? [])

		if let t = r.defaultTime {
			hasTime = true
			let parts = t.split(separator: ":")
			if let h = Int(parts[0]), let m = Int(parts[1]) {
				defaultTime = Calendar.current.date(
					bySettingHour: h, minute: m, second: 0, of: Date()
				) ?? Date()
			}
		}
	}

	private func save() async {
		let cal = Calendar.current
		let h = cal.component(.hour, from: defaultTime)
		let m = cal.component(.minute, from: defaultTime)
		let timeString = hasTime ? String(format: "%02d:%02d", h, m) : nil

		let rule = TimeTaskRecurrenceRule(
			frequency: frequency,
			interval: interval,
			daysOfWeek: frequency == "weekly" && !selectedDays.isEmpty ? Array(selectedDays).sorted() : nil,
			dayOfMonth: nil
		)

		if let r = editingRoutine {
			let request = UpdateRoutineRequest(
				title: title.trimmingCharacters(in: .whitespaces),
				defaultTime: timeString,
				defaultDuration: defaultDuration,
				color: selectedColor,
				icon: selectedIcon,
				notes: notes.isEmpty ? nil : notes,
				recurrenceRule: rule
			)
			await timeState.updateRoutine(id: r.id, request: request)
		} else {
			await timeState.createRoutine(
				title: title.trimmingCharacters(in: .whitespaces),
				defaultTime: timeString,
				defaultDuration: defaultDuration,
				color: selectedColor,
				icon: selectedIcon,
				notes: notes.isEmpty ? nil : notes,
				recurrenceRule: rule
			)
		}
		dismiss()
	}
}
