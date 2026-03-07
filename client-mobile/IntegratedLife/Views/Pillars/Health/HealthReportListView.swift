import SwiftUI

struct HealthReportListView: View {
	@State private var reports: [HealthReport] = []
	@State private var isLoading = true
	@State private var isGenerating = false
	@State private var error: String?

	private let healthService = HealthService.shared

	var body: some View {
		List {
			Section {
				Button {
					Task { await generateReport() }
				} label: {
					HStack {
						if isGenerating {
							ProgressView()
								.controlSize(.small)
								.padding(.trailing, 4)
						}
						Label(
							isGenerating ? "Generating..." : "Generate Report Now",
							systemImage: "sparkles"
						)
					}
					.frame(maxWidth: .infinity, alignment: .leading)
				}
				.disabled(isGenerating)
			}

			if reports.isEmpty && !isLoading {
				Section {
					ContentUnavailableView(
						"No Reports Yet",
						systemImage: "doc.text.magnifyingglass",
						description: Text("Reports are generated automatically each Sunday, or you can generate one now.")
					)
				}
			}

			ForEach(reports) { report in
				NavigationLink(value: report) {
					reportRow(report)
				}
			}
		}
		.listStyle(.plain)
		.navigationTitle("Health Reports")
		.task {
			await loadReports()
		}
	}

	private func reportRow(_ report: HealthReport) -> some View {
		VStack(alignment: .leading, spacing: 4) {
			HStack(spacing: 6) {
				Image(systemName: report.type == "weekly" ? "calendar" : "sparkles")
					.foregroundStyle(report.type == "weekly" ? .blue : .purple)
					.font(.caption)
				Text(report.type == "weekly" ? "Weekly Report" : "On-Demand Report")
					.font(.subheadline)
					.fontWeight(.medium)
			}

			Text(formatDateRange(start: report.periodStart, end: report.periodEnd))
				.font(.caption)
				.foregroundStyle(.secondary)

			Text("\(report.metrics.count) metrics analyzed")
				.font(.caption2)
				.foregroundStyle(.tertiary)
		}
		.padding(.vertical, 2)
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

	private func loadReports() async {
		isLoading = true
		do {
			reports = try await healthService.fetchReports()
		} catch {
			self.error = error.localizedDescription
		}
		isLoading = false
	}

	private func generateReport() async {
		isGenerating = true
		error = nil
		do {
			let report = try await healthService.generateReport()
			reports.insert(report, at: 0)
		} catch {
			self.error = error.localizedDescription
		}
		isGenerating = false
	}
}
