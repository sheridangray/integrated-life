import SwiftUI

// MARK: - Constants

enum TimelineLayout {
	static let hourHeight: CGFloat = 60
	static let startHour = 6
	static let endHour = 23
	static let totalHours: Int = endHour - startHour
	static let gutterWidth: CGFloat = 52
	static let blockHorizontalPadding: CGFloat = 4

	static func yOffset(forMinute minute: Int) -> CGFloat {
		let minutesSinceStart = CGFloat(minute - startHour * 60)
		return minutesSinceStart * (hourHeight / 60.0)
	}

	static func blockHeight(durationMinutes: Int) -> CGFloat {
		max(CGFloat(durationMinutes) * (hourHeight / 60.0), 28)
	}
}

// MARK: - Date Header

struct TimelineDateHeader: View {
	let date: Date
	let onPrevious: () -> Void
	let onNext: () -> Void
	let onToday: () -> Void

	private var isToday: Bool {
		Calendar.current.isDateInToday(date)
	}

	var body: some View {
		HStack {
			Button(action: onPrevious) {
				Image(systemName: "chevron.left")
					.font(.body.weight(.medium))
			}

			Spacer()

			VStack(spacing: 2) {
				if isToday {
					Text("Today")
						.font(.caption.weight(.semibold))
						.foregroundStyle(.blue)
				} else {
					Text(date, format: .dateTime.weekday(.wide))
						.font(.caption)
						.foregroundStyle(.secondary)
				}
				Text(date, format: .dateTime.month(.wide).day().year())
					.font(.headline)
			}
			.onTapGesture(perform: onToday)

			Spacer()

			Button(action: onNext) {
				Image(systemName: "chevron.right")
					.font(.body.weight(.medium))
			}
		}
		.padding(.horizontal)
		.padding(.vertical, 8)
	}
}

// MARK: - Hour Marker Grid

struct HourMarkerGrid: View {
	var body: some View {
		VStack(spacing: 0) {
			ForEach(TimelineLayout.startHour..<TimelineLayout.endHour, id: \.self) { hour in
				HStack(alignment: .top, spacing: 0) {
					Text(Self.hourLabel(hour))
						.font(.caption2)
						.foregroundStyle(.tertiary)
						.frame(width: TimelineLayout.gutterWidth, alignment: .trailing)
						.padding(.trailing, 6)
						.offset(y: -6)

					VStack(spacing: 0) {
						Divider()
						Spacer()
					}
				}
				.frame(height: TimelineLayout.hourHeight)
			}
		}
	}

	private static func hourLabel(_ hour: Int) -> String {
		let h = hour % 12 == 0 ? 12 : hour % 12
		let suffix = hour < 12 ? "AM" : "PM"
		return "\(h) \(suffix)"
	}
}

// MARK: - Task Block

struct TimelineTaskBlock: View {
	let task: TimeTask
	let onTap: () -> Void
	var onToggleComplete: (() -> Void)?

	private var blockColor: Color {
		Color(hex: task.color) ?? .blue
	}

	var body: some View {
		Button(action: onTap) {
			HStack(spacing: 8) {
				Image(systemName: task.icon)
					.font(.caption)
					.foregroundStyle(.white.opacity(0.9))

				VStack(alignment: .leading, spacing: 2) {
					Text(task.title)
						.font(.caption.weight(.semibold))
						.foregroundStyle(.white)
						.lineLimit(1)
						.strikethrough(task.isCompleted)

					if let start = task.startTime {
						Text("\(start) · \(task.durationMinutes)m")
							.font(.caption2)
							.foregroundStyle(.white.opacity(0.75))
					}
				}

				Spacer(minLength: 0)

				if task.isRoutineInstance {
					Image(systemName: "arrow.triangle.2.circlepath")
						.font(.caption2)
						.foregroundStyle(.white.opacity(0.6))
				}

				if task.source == "calendar" {
					Image(systemName: "calendar")
						.font(.caption2)
						.foregroundStyle(.white.opacity(0.6))
				}

				if task.isEditable, let toggle = onToggleComplete {
					Button {
						toggle()
					} label: {
						Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
							.font(.body)
							.foregroundStyle(.white.opacity(0.8))
					}
					.buttonStyle(.plain)
				}
			}
			.padding(.horizontal, 10)
			.padding(.vertical, 6)
			.frame(maxWidth: .infinity, alignment: .leading)
			.background(
				RoundedRectangle(cornerRadius: 8)
					.fill(task.source == "calendar" ? blockColor.opacity(0.5) : blockColor)
			)
			.opacity(task.isCompleted ? 0.6 : 1.0)
		}
		.buttonStyle(.plain)
	}
}

// MARK: - All-Day Task Row

struct AllDayTaskRow: View {
	let task: TimeTask
	let onTap: () -> Void
	var onToggleComplete: (() -> Void)?
	var onDelete: (() -> Void)?

	private var blockColor: Color {
		Color(hex: task.color) ?? .blue
	}

	var body: some View {
		Button(action: onTap) {
			HStack(spacing: 8) {
				Image(systemName: task.icon)
					.font(.subheadline)
					.foregroundStyle(blockColor)

				Text(task.title)
					.font(.subheadline)
					.foregroundStyle(.primary)
					.lineLimit(1)
					.strikethrough(task.isCompleted)

				Spacer()

				Text("\(task.durationMinutes)m")
					.font(.caption)
					.foregroundStyle(.secondary)

				if task.isEditable, let toggle = onToggleComplete {
					Button {
						toggle()
					} label: {
						Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
							.font(.body)
							.foregroundStyle(task.isCompleted ? blockColor : .secondary)
					}
					.buttonStyle(.plain)
				}
			}
			.padding(.horizontal, 12)
			.padding(.vertical, 8)
			.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
		}
		.buttonStyle(.plain)
		.swipeActions(edge: .trailing, allowsFullSwipe: true) {
			if let del = onDelete, task.isEditable {
				Button(role: .destructive) { del() } label: {
					Label("Delete", systemImage: "trash")
				}
			}
		}
	}
}

// MARK: - Color Extension

extension Color {
	init?(hex: String) {
		var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines)
		if cleaned.hasPrefix("#") { cleaned.removeFirst() }
		guard cleaned.count == 6 else { return nil }
		var rgb: UInt64 = 0
		guard Scanner(string: cleaned).scanHexInt64(&rgb) else { return nil }
		self.init(
			red: Double((rgb >> 16) & 0xFF) / 255,
			green: Double((rgb >> 8) & 0xFF) / 255,
			blue: Double(rgb & 0xFF) / 255
		)
	}
}
