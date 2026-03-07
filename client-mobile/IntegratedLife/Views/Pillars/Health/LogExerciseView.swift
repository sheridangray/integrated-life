import SwiftUI

struct LogExerciseView: View {
	let exercise: Exercise
	var workoutId: String?
	var onComplete: ((ExerciseLog) -> Void)?

	@Environment(\.dismiss) private var dismiss
	@FocusState private var focusedField: LogField?

	@State private var date = Date()
	@State private var startTime = Date()
	@State private var endTime: Date?
	@State private var selectedResistanceType: String
	@State private var sets: [ExerciseSet] = [ExerciseSet(setNumber: 1)]
	@State private var notes = ""
	@State private var insight: AIInsight?
	@State private var lastLog: ExerciseLog?
	@State private var isSaving = false
	@State private var isLoadingContext = true
	@State private var postSaveInsight: AIInsight?
	@State private var isLoadingPostSaveInsight = false
	@State private var savedLog: ExerciseLog?

	private let healthService = HealthService.shared
	private let healthKitService = HealthKitService.shared
	private var isInWorkout: Bool { workoutId != nil }

	init(exercise: Exercise, workoutId: String? = nil, onComplete: ((ExerciseLog) -> Void)? = nil) {
		self.exercise = exercise
		self.workoutId = workoutId
		self.onComplete = onComplete
		_selectedResistanceType = State(initialValue: exercise.resistanceType)
	}

	var body: some View {
		NavigationStack {
			Form {
				if savedLog != nil {
					postSaveSection
				} else {
					insightSection
					lastSessionSection
					setsSection
					notesSection
					dateTimeSection
					resistanceSection
				}
			}
			.navigationTitle(savedLog != nil ? "Logged!" : "Log \(exercise.name)")
			.navigationBarTitleDisplayMode(.inline)
			.toolbar {
				if savedLog != nil {
					ToolbarItem(placement: .confirmationAction) {
						Button("Done") { dismiss() }
					}
				} else {
					ToolbarItem(placement: .cancellationAction) {
						Button("Cancel") { dismiss() }
					}
					ToolbarItem(placement: .confirmationAction) {
						Button("Finish") {
							Task { await saveLog() }
						}
						.disabled(isSaving)
					}
				}
			}
			.task {
				await loadContext()
			}
			.onAppear {
				DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
					focusedField = .weight(0)
				}
			}
		}
	}

	private var dateTimeSection: some View {
		Section("Date & Time") {
			DatePicker("Date", selection: $date, displayedComponents: .date)
			DatePicker("Start Time", selection: $startTime, displayedComponents: .hourAndMinute)

			if endTime != nil {
				HStack {
					DatePicker("End Time", selection: Binding(
						get: { endTime ?? Date() },
						set: { endTime = $0 }
					), displayedComponents: .hourAndMinute)
					Button {
						endTime = nil
					} label: {
						Image(systemName: "xmark.circle.fill")
							.foregroundStyle(.tertiary)
					}
					.buttonStyle(.plain)
				}
			} else {
				HStack {
					Text("End Time")
					Spacer()
					Text("Recorded on finish")
						.foregroundStyle(.tertiary)
				}
				.contentShape(Rectangle())
				.onTapGesture { endTime = Date() }
			}
		}
	}

	@ViewBuilder
	private var insightSection: some View {
		if let insightText = insight?.insight {
			Section("AI Insight") {
				HStack(alignment: .top, spacing: 8) {
					Image(systemName: "sparkles")
						.foregroundStyle(.purple)
					Text(insightText)
						.font(.subheadline)
				}
				.padding(.vertical, 4)
			}
		}
	}

	@ViewBuilder
	private var postSaveSection: some View {
		Section {
			HStack(spacing: 8) {
				Image(systemName: "checkmark.circle.fill")
					.foregroundStyle(.green)
				Text("\(exercise.name) logged successfully")
					.font(.headline)
			}
			.padding(.vertical, 4)
		}

		if isLoadingPostSaveInsight {
			Section("AI Feedback") {
				HStack(spacing: 8) {
					ProgressView()
						.controlSize(.small)
					Text("Generating feedback...")
						.font(.subheadline)
						.foregroundStyle(.secondary)
				}
				.padding(.vertical, 4)
			}
		} else if let insightText = postSaveInsight?.insight {
			Section("AI Feedback") {
				HStack(alignment: .top, spacing: 8) {
					Image(systemName: "sparkles")
						.foregroundStyle(.purple)
					Text(insightText)
						.font(.subheadline)
				}
				.padding(.vertical, 4)
			}
		}
	}

	@ViewBuilder
	private var lastSessionSection: some View {
		if let lastLog, !isLoadingContext {
			Section("Last Session") {
				VStack(alignment: .leading, spacing: 4) {
					Text(DateFormatting.displayDate(lastLog.date))
						.font(.caption)
						.foregroundStyle(.secondary)
					Text(lastLog.sets.map { set in
						formatSetSummary(set)
					}.joined(separator: "  ·  "))
						.font(.subheadline)
				}
				.padding(.vertical, 2)
			}
		}
	}

	private func formatSetSummary(_ set: ExerciseSet) -> String {
		let measurementType = MeasurementType(rawValue: exercise.measurementType)
		switch measurementType {
		case .timeBased:
			let min = set.minutes.map { String(format: "%.0f", $0) } ?? "0"
			let sec = set.seconds.map { String(format: "%.0f", $0) } ?? "0"
			return "\(min)m \(sec)s"
		case .distanceBased:
			let miles = set.miles.map { String(format: "%.1f", $0) } ?? "0"
			return "\(miles) mi"
		case .repOnly:
			return "\(set.reps ?? 0) reps"
		default:
			let w = set.weight.map { $0 == floor($0) ? String(format: "%.0f", $0) : "\($0)" } ?? "0"
			return "\(w) x \(set.reps ?? 0)"
		}
	}

	private var resistanceSection: some View {
		Section("Resistance Type") {
			Picker("Type", selection: $selectedResistanceType) {
				ForEach(ResistanceType.allCases) { type in
					Text(type.rawValue).tag(type.rawValue)
				}
			}
		}
	}

	private var setsSection: some View {
		Section {
			ForEach(Array(sets.enumerated()), id: \.element.setNumber) { index, _ in
				setRow(index: index)
			}

			Button {
				let newIndex = sets.count
				let previous = sets.last
				let newSet = ExerciseSet(
					setNumber: newIndex + 1,
					weight: previous?.weight,
					reps: previous?.reps,
					minutes: previous?.minutes,
					seconds: previous?.seconds,
					miles: previous?.miles
				)
				sets.append(newSet)
				DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
					focusedField = .weight(newIndex)
				}
			} label: {
				Label("Add Set", systemImage: "plus")
			}
		} header: {
			Text("Sets")
		}
	}

	private func setRow(index: Int) -> some View {
		let measurementType = MeasurementType(rawValue: exercise.measurementType)
		return VStack(alignment: .leading, spacing: 4) {
			HStack(spacing: 12) {
				Text("Set \(index + 1)")
					.font(.caption2)
					.fontWeight(.medium)
					.foregroundStyle(.secondary)
					.frame(width: 36, alignment: .leading)

				if measurementType == .strength || measurementType == nil {
					let isWeightedBodyweight = exercise.resistanceType == ResistanceType.weightedBodyweight.rawValue
					signedNumberField(
						isWeightedBodyweight ? "+/-" : "Weight",
						value: $sets[index].weight,
						allowNegative: isWeightedBodyweight
					)
					.focused($focusedField, equals: .weight(index))
					intField("Reps", value: $sets[index].reps)
						.focused($focusedField, equals: .reps(index))
				}

				if measurementType == .timeBased {
					numberField("Minutes", value: $sets[index].minutes)
						.focused($focusedField, equals: .weight(index))
					numberField("Seconds", value: $sets[index].seconds)
				}

				if measurementType == .distanceBased {
					numberField("Miles", value: $sets[index].miles)
						.focused($focusedField, equals: .weight(index))
				}

				if measurementType == .repOnly {
					intField("Reps", value: $sets[index].reps)
						.focused($focusedField, equals: .reps(index))
				}

				if sets.count >= 2 {
					Button {
						sets.remove(at: index)
						renumberSets()
					} label: {
						Image(systemName: "minus.circle.fill")
							.font(.caption)
							.foregroundStyle(.red)
					}
					.buttonStyle(.plain)
				}
			}
			if exercise.resistanceType == ResistanceType.weightedBodyweight.rawValue {
				Text("Negative = assistance, Positive = added weight")
					.font(.caption2)
					.foregroundStyle(.secondary)
					.padding(.leading, 48)
			}
		}
		.padding(.vertical, 2)
	}

	private func signedNumberField(_ label: String, value: Binding<Double?>, allowNegative: Bool) -> some View {
		let text = Binding<String>(
			get: {
				guard let v = value.wrappedValue else { return "" }
				return v == floor(v) ? String(format: "%.0f", v) : "\(v)"
			},
			set: { value.wrappedValue = Double($0) }
		)
		return VStack(alignment: .leading, spacing: 1) {
			Text(label)
				.font(.caption2)
				.foregroundStyle(.secondary)
			TextField(label, text: text)
				.font(.body)
				.padding(8)
				.background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 8))
				.keyboardType(allowNegative ? .numbersAndPunctuation : .decimalPad)
		}
	}

	private func numberField(_ label: String, value: Binding<Double?>) -> some View {
		let text = Binding<String>(
			get: {
				guard let v = value.wrappedValue else { return "" }
				return v == floor(v) ? String(format: "%.0f", v) : "\(v)"
			},
			set: { value.wrappedValue = Double($0) }
		)
		return VStack(alignment: .leading, spacing: 1) {
			Text(label)
				.font(.caption2)
				.foregroundStyle(.secondary)
			TextField(label, text: text)
				.font(.body)
				.padding(8)
				.background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 8))
				.keyboardType(.decimalPad)
		}
	}

	private func intField(_ label: String, value: Binding<Int?>) -> some View {
		let text = Binding<String>(
			get: {
				guard let v = value.wrappedValue else { return "" }
				return "\(v)"
			},
			set: { value.wrappedValue = Int($0) }
		)
		return VStack(alignment: .leading, spacing: 1) {
			Text(label)
				.font(.caption2)
				.foregroundStyle(.secondary)
			TextField(label, text: text)
				.font(.body)
				.padding(8)
				.background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 8))
				.keyboardType(.numberPad)
		}
	}

	private var notesSection: some View {
		Section("Notes") {
			TextEditor(text: $notes)
				.frame(minHeight: 60)
		}
	}

	private func loadContext() async {
		isLoadingContext = true
		async let logTask: () = loadLastLog()
		async let insightTask: () = loadInsight()
		_ = await (logTask, insightTask)
		isLoadingContext = false
	}

	private func loadLastLog() async {
		lastLog = try? await healthService.getLastLog(exerciseId: exercise.id)
		if let lastLog, let firstSet = lastLog.sets.first {
			sets = [ExerciseSet(
				setNumber: 1,
				weight: firstSet.weight,
				reps: firstSet.reps,
				minutes: firstSet.minutes,
				seconds: firstSet.seconds,
				miles: firstSet.miles
			)]
			selectedResistanceType = lastLog.resistanceType
		}
	}

	private func loadInsight() async {
		insight = try? await healthService.getExerciseInsight(exerciseId: exercise.id)
	}

	private func renumberSets() {
		for i in sets.indices {
			sets[i].setNumber = i + 1
		}
	}

	private func saveLog() async {
		isSaving = true
		let formatter = ISO8601DateFormatter()
		let resolvedEndTime = endTime ?? Date()

		let request = CreateExerciseLogRequest(
			exerciseId: exercise.id,
			date: formatter.string(from: date),
			startTime: formatter.string(from: startTime),
			endTime: formatter.string(from: resolvedEndTime),
			resistanceType: selectedResistanceType,
			sets: sets,
			notes: notes.isEmpty ? nil : notes
		)

		do {
			let log = try await healthService.logExercise(exerciseId: exercise.id, request: request)
			try? await healthKitService.saveWorkout(start: startTime, end: resolvedEndTime)
			onComplete?(log)

			if isInWorkout {
				dismiss()
			} else {
				savedLog = log
				await loadPostSaveInsight()
			}
		} catch {
			isSaving = false
		}
	}

	private func loadPostSaveInsight() async {
		isLoadingPostSaveInsight = true
		postSaveInsight = try? await healthService.getExerciseInsight(exerciseId: exercise.id)
		isLoadingPostSaveInsight = false
	}
}

private enum LogField: Hashable {
	case weight(Int)
	case reps(Int)
}
