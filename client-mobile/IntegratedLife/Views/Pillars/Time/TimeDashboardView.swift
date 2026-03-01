import SwiftUI

enum DashboardPeriod: String, CaseIterable, Identifiable {
	case today = "Today"
	case week = "This Week"
	case month = "This Month"

	var id: String { rawValue }

	var dateRange: (from: Date, to: Date) {
		let cal = Calendar.current
		let now = Date()
		switch self {
		case .today:
			let start = cal.startOfDay(for: now)
			return (start, now)
		case .week:
			let start = cal.dateComponents([.calendar, .yearForWeekOfYear, .weekOfYear], from: now).date ?? now
			return (start, now)
		case .month:
			let comps = cal.dateComponents([.year, .month], from: now)
			let start = cal.date(from: comps) ?? now
			return (start, now)
		}
	}

	var budgetPeriod: BudgetPeriod {
		switch self {
		case .today: return .daily
		case .week: return .weekly
		case .month: return .monthly
		}
	}
}

struct TimeDashboardView: View {
	@ObservedObject var timeState: TimeState
	@State private var period: DashboardPeriod = .today

	var body: some View {
		ScrollView {
			VStack(spacing: 16) {
				periodPicker
				summaryCard
				bucketBreakdown
			}
			.padding()
		}
		.task { await loadData() }
		.onChange(of: period) { _ in Task { await loadData() } }
	}

	private func loadData() async {
		let range = period.dateRange
		await timeState.loadEntries(from: range.from, to: range.to)
		await timeState.loadBudget()
	}

	private var periodPicker: some View {
		Picker("Period", selection: $period) {
			ForEach(DashboardPeriod.allCases) { p in
				Text(p.rawValue).tag(p)
			}
		}
		.pickerStyle(.segmented)
	}

	private var summaryCard: some View {
		let totalMinutes = totalTrackedMinutes
		let budgetMinutes = period.budgetPeriod.totalMinutes
		let trackedHours = totalMinutes / 60.0
		let untrackedMinutes = Double(budgetMinutes) - totalMinutes
		let untrackedHours = max(untrackedMinutes, 0) / 60.0

		return HStack(spacing: 24) {
			VStack(spacing: 4) {
				Text(String(format: "%.1fh", trackedHours))
					.font(.title2.weight(.bold))
				Text("Tracked")
					.font(.caption)
					.foregroundStyle(.secondary)
			}
			VStack(spacing: 4) {
				Text(String(format: "%.1fh", untrackedHours))
					.font(.title2.weight(.bold))
					.foregroundStyle(.secondary)
				Text("Untracked")
					.font(.caption)
					.foregroundStyle(.secondary)
			}
		}
		.frame(maxWidth: .infinity)
		.padding()
		.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
	}

	private var bucketBreakdown: some View {
		let grouped = groupedByBucket
		let budgetMap = budgetByCategory

		return VStack(spacing: 12) {
			ForEach(MetaBucket.allCases, id: \.self) { bucket in
				let categories = TimeCategory.all.filter { $0.metaBucket == bucket }
				let actualMinutes = categories.reduce(0.0) { sum, cat in
					sum + (grouped[cat.id] ?? 0)
				}
				let budgetMinutes = categories.reduce(0.0) { sum, cat in
					sum + (budgetMap[cat.id] ?? 0)
				}

				BucketRow(
					bucket: bucket,
					actualMinutes: actualMinutes,
					budgetMinutes: budgetMinutes,
					categories: categories,
					categoryActual: grouped,
					categoryBudget: budgetMap
				)
			}
		}
	}

	private var totalTrackedMinutes: Double {
		timeState.entries.reduce(0.0) { sum, entry in
			sum + entry.elapsed() / 60.0
		}
	}

	private var groupedByBucket: [Int: Double] {
		var result: [Int: Double] = [:]
		for entry in timeState.entries {
			result[entry.categoryId, default: 0] += entry.elapsed() / 60.0
		}
		return result
	}

	private var budgetByCategory: [Int: Double] {
		let targetPeriod = period.budgetPeriod.rawValue
		var result: [Int: Double] = [:]
		for b in timeState.budget {
			if b.period == targetPeriod {
				result[b.categoryId] = b.allocatedMinutes
			}
		}
		return result
	}
}

private struct BucketRow: View {
	let bucket: MetaBucket
	let actualMinutes: Double
	let budgetMinutes: Double
	let categories: [TimeCategory]
	let categoryActual: [Int: Double]
	let categoryBudget: [Int: Double]
	@State private var isExpanded = false

	var body: some View {
		VStack(spacing: 0) {
			Button { withAnimation { isExpanded.toggle() } } label: {
				HStack {
					Circle()
						.fill(bucket.color)
						.frame(width: 10, height: 10)
					Text(bucket.rawValue)
						.font(.subheadline.weight(.medium))
					Spacer()
					Text(formatMinutes(actualMinutes))
						.font(.subheadline.monospacedDigit())
					if budgetMinutes > 0 {
						Text("/ \(formatMinutes(budgetMinutes))")
							.font(.caption)
							.foregroundStyle(.secondary)
					}
					Image(systemName: "chevron.right")
						.font(.caption2)
						.foregroundStyle(.tertiary)
						.rotationEffect(.degrees(isExpanded ? 90 : 0))
				}
				.padding(.vertical, 10)
				.padding(.horizontal, 12)
			}
			.buttonStyle(.plain)

			if budgetMinutes > 0 {
				ProgressView(value: min(actualMinutes / budgetMinutes, 1.0))
					.tint(bucket.color)
					.padding(.horizontal, 12)
					.padding(.bottom, 8)
			}

			if isExpanded {
				VStack(spacing: 6) {
					ForEach(categories) { cat in
						let actual = categoryActual[cat.id] ?? 0
						let budget = categoryBudget[cat.id] ?? 0
						HStack {
							Text(cat.name)
								.font(.caption)
								.foregroundStyle(.secondary)
							Spacer()
							Text(formatMinutes(actual))
								.font(.caption.monospacedDigit())
							if budget > 0 {
								Text("/ \(formatMinutes(budget))")
									.font(.caption2)
									.foregroundStyle(.tertiary)
							}
						}
						.padding(.horizontal, 24)
					}
				}
				.padding(.bottom, 10)
			}
		}
		.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
	}

	private func formatMinutes(_ minutes: Double) -> String {
		let h = Int(minutes) / 60
		let m = Int(minutes) % 60
		if h > 0 {
			return "\(h)h \(m)m"
		}
		return "\(m)m"
	}
}
