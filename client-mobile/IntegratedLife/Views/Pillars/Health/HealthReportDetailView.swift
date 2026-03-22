import SwiftUI

struct HealthReportDetailView: View {
	let report: HealthReport

	var body: some View {
		ScrollView {
			VStack(alignment: .leading, spacing: 16) {
				headerSection
				Divider()
				MarkdownBodyView(markdown: report.report)
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

// MARK: - Markdown Renderer

private struct MarkdownBodyView: View {
	let markdown: String

	private var blocks: [MarkdownBlock] {
		parseMarkdown(markdown)
	}

	var body: some View {
		VStack(alignment: .leading, spacing: 12) {
			ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
				blockView(for: block)
			}
		}
	}

	@ViewBuilder
	private func blockView(for block: MarkdownBlock) -> some View {
		switch block {
		case .heading(let text, let level):
			Text(inlineMarkdown(text))
				.font(level == 2 ? .title3 : .headline)
				.fontWeight(.semibold)
				.padding(.top, level == 2 ? 8 : 4)

		case .bullet(let text):
			HStack(alignment: .firstTextBaseline, spacing: 8) {
				Text("•")
					.font(.subheadline)
					.foregroundStyle(.secondary)
				Text(inlineMarkdown(text))
					.font(.subheadline)
					.lineSpacing(3)
			}

		case .numberedItem(let number, let text):
			HStack(alignment: .firstTextBaseline, spacing: 8) {
				Text("\(number).")
					.font(.subheadline)
					.foregroundStyle(.secondary)
					.frame(minWidth: 18, alignment: .trailing)
				Text(inlineMarkdown(text))
					.font(.subheadline)
					.lineSpacing(3)
			}

		case .paragraph(let text):
			Text(inlineMarkdown(text))
				.font(.subheadline)
				.lineSpacing(3)
		}
	}

	private func inlineMarkdown(_ text: String) -> AttributedString {
		(try? AttributedString(markdown: text, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace))) ?? AttributedString(text)
	}
}

private enum MarkdownBlock {
	case heading(String, Int)
	case bullet(String)
	case numberedItem(Int, String)
	case paragraph(String)
}

private func parseMarkdown(_ markdown: String) -> [MarkdownBlock] {
	var blocks: [MarkdownBlock] = []
	var paragraphLines: [String] = []

	let flushParagraph = {
		let text = paragraphLines.joined(separator: " ").trimmingCharacters(in: .whitespaces)
		if !text.isEmpty {
			blocks.append(.paragraph(text))
		}
		paragraphLines.removeAll()
	}

	for line in markdown.components(separatedBy: "\n") {
		let trimmed = line.trimmingCharacters(in: .whitespaces)

		if trimmed.isEmpty {
			flushParagraph()
			continue
		}

		if trimmed.hasPrefix("### ") {
			flushParagraph()
			blocks.append(.heading(String(trimmed.dropFirst(4)), 3))
		} else if trimmed.hasPrefix("## ") {
			flushParagraph()
			blocks.append(.heading(String(trimmed.dropFirst(3)), 2))
		} else if trimmed.hasPrefix("# ") {
			flushParagraph()
			blocks.append(.heading(String(trimmed.dropFirst(2)), 2))
		} else if trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") {
			flushParagraph()
			blocks.append(.bullet(String(trimmed.dropFirst(2))))
		} else if let match = trimmed.range(of: #"^(\d+)\.\s+"#, options: .regularExpression) {
			flushParagraph()
			let numStr = trimmed[trimmed.startIndex..<trimmed.index(before: match.upperBound)]
				.trimmingCharacters(in: .punctuationCharacters)
			let content = String(trimmed[match.upperBound...])
			blocks.append(.numberedItem(Int(numStr) ?? 1, content))
		} else {
			paragraphLines.append(trimmed)
		}
	}

	flushParagraph()
	return blocks
}
