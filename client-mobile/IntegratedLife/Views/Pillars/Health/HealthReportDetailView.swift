import SwiftUI

struct HealthReportDetailView: View {
	let report: HealthReport

	var body: some View {
		ScrollView {
			VStack(alignment: .leading, spacing: 16) {
				headerSection
				Divider()
				reportContent
			}
			.padding()
		}
		.navigationTitle(report.type == "weekly" ? "Weekly Report" : "Health Report")
		.navigationBarTitleDisplayMode(.inline)
	}

	private var headerSection: some View {
		VStack(alignment: .leading, spacing: 8) {
			HStack(spacing: 8) {
				Image(systemName: report.type == "weekly" ? "calendar" : "sparkles")
					.foregroundStyle(report.type == "weekly" ? .blue : .purple)
				Text(report.type == "weekly" ? "Weekly Health Report" : "On-Demand Health Report")
					.font(.headline)
			}

			Text(formatDateRange(start: report.periodStart, end: report.periodEnd))
				.font(.subheadline)
				.foregroundStyle(.secondary)

			Text("\(report.metrics.count) metrics analyzed")
				.font(.caption)
				.foregroundStyle(.tertiary)
		}
	}

	private var reportContent: some View {
		Text(LocalizedStringKey(report.report))
			.font(.subheadline)
			.lineSpacing(4)
	}

	private func formatDateRange(start: String, end: String) -> String {
		let formatter = ISO8601DateFormatter()
		let display = DateFormatter()
		display.dateStyle = .medium
		display.timeStyle = .none

		guard let startDate = formatter.date(from: start),
			  let endDate = formatter.date(from: end) else {
			return "\(start) — \(end)"
		}
		return "\(display.string(from: startDate)) — \(display.string(from: endDate))"
	}
}
