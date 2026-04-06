import SwiftUI

// MARK: - Date Header

struct StructuredDateHeader: View {
	let date: Date

	private var isToday: Bool {
		Calendar.current.isDateInToday(date)
	}

	var body: some View {
		HStack {
			VStack(alignment: .leading, spacing: 2) {
				if isToday {
					Text("Today")
						.font(.subheadline.weight(.semibold))
						.foregroundStyle(.blue)
				}
				Text(date, format: .dateTime.day().month(.wide).year())
					.font(.title2.weight(.bold))
			}
			Spacer()
		}
		.padding(.horizontal)
		.padding(.top, 8)
		.padding(.bottom, 4)
	}
}

// MARK: - Structured Task Row

struct StructuredTaskRow: View {
	let task: TimeTask
	let isLast: Bool
	let onTap: () -> Void
	var onToggleComplete: (() -> Void)?

	private var taskColor: Color {
		Color(hex: task.color) ?? .blue
	}

	var body: some View {
		Button(action: onTap) {
			HStack(alignment: .top, spacing: 12) {
				iconBubbleWithLine

				VStack(alignment: .leading, spacing: 3) {
					if let timeRange = task.timeRangeLabel {
						Text(timeRange)
							.font(.caption)
							.foregroundStyle(.secondary)
					}

					Text(task.title)
						.font(.body.weight(.medium))
						.foregroundStyle(.primary)
						.lineLimit(2)
						.strikethrough(task.isCompleted)

					badgeRow
				}
				.padding(.vertical, 4)

				Spacer(minLength: 0)

				completionButton
					.padding(.top, 6)
			}
			.padding(.horizontal, 16)
			.opacity(task.isCompleted ? 0.5 : 1.0)
		}
		.buttonStyle(.plain)
	}

	// MARK: - Icon Bubble + Connecting Line

	private var iconBubbleWithLine: some View {
		VStack(spacing: 0) {
			ZStack {
				Circle()
					.fill(taskColor)
					.frame(width: 36, height: 36)
				Image(systemName: task.icon)
					.font(.system(size: 14, weight: .semibold))
					.foregroundStyle(.white)
			}

			if !isLast {
				Rectangle()
					.fill(.quaternary)
					.frame(width: 2)
					.frame(maxHeight: .infinity)
			}
		}
		.frame(width: 36)
	}

	// MARK: - Badge Row

	@ViewBuilder
	private var badgeRow: some View {
		let hasBadges = task.isRoutineInstance || task.source == "calendar"
		if hasBadges {
			HStack(spacing: 6) {
				if task.isRoutineInstance {
					Label("Repeating", systemImage: "arrow.triangle.2.circlepath")
						.font(.caption2)
						.foregroundStyle(.secondary)
				}
				if task.source == "calendar" {
					Label("Calendar", systemImage: "calendar")
						.font(.caption2)
						.foregroundStyle(.secondary)
				}
			}
			.labelStyle(.iconOnly)
		}
	}

	// MARK: - Completion Button

	private var completionButton: some View {
		Group {
			if task.isEditable, let toggle = onToggleComplete {
				Button {
					toggle()
				} label: {
					Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
						.font(.title3)
						.foregroundStyle(task.isCompleted ? taskColor : .secondary.opacity(0.5))
				}
				.buttonStyle(.plain)
			} else {
				Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
					.font(.title3)
					.foregroundStyle(task.isCompleted ? taskColor : .secondary.opacity(0.3))
			}
		}
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
