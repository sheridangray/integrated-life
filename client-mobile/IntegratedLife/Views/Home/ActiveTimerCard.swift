import SwiftUI

struct ActiveTimerCard: View {
	let entry: TimeEntry
	let onStop: () -> Void

	var body: some View {
		HStack(spacing: 12) {
			bucketBadge
			VStack(alignment: .leading, spacing: 2) {
				Text(entry.category?.name ?? "Unknown")
					.font(.body.weight(.medium))
				Text(entry.category?.metaBucket.rawValue ?? "")
					.font(.caption)
					.foregroundStyle(.secondary)
			}
			Spacer()
			elapsedLabel
			Button(action: onStop) {
				Image(systemName: "stop.circle.fill")
					.font(.title2)
					.foregroundStyle(.red)
			}
			.buttonStyle(.plain)
		}
		.padding()
		.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
	}

	private var bucketBadge: some View {
		let color = entry.category?.metaBucket.color ?? .gray
		return Circle()
			.fill(color)
			.frame(width: 10, height: 10)
	}

	private var elapsedLabel: some View {
		TimelineView(.periodic(from: .now, by: 1)) { context in
			let elapsed = entry.elapsed(now: context.date)
			Text(Self.formatElapsed(elapsed))
				.font(.body.monospacedDigit().weight(.medium))
				.foregroundStyle(.secondary)
		}
	}

	static func formatElapsed(_ interval: TimeInterval) -> String {
		let total = Int(max(interval, 0))
		let h = total / 3600
		let m = (total % 3600) / 60
		let s = total % 60
		if h > 0 {
			return String(format: "%d:%02d:%02d", h, m, s)
		}
		return String(format: "%02d:%02d", m, s)
	}
}
