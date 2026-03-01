import SwiftUI

struct TimeBudgetView: View {
	@ObservedObject var timeState: TimeState
	@State private var period: BudgetPeriod = .daily
	@State private var allocations: [Int: Double] = [:]
	@State private var hasChanges = false

	var body: some View {
		VStack(spacing: 0) {
			periodPicker
			remainingHeader
			categoryList
			if hasChanges {
				saveButton
			}
		}
		.task { await loadBudget() }
		.onChange(of: period) { _ in rebuildAllocations() }
	}

	private var periodPicker: some View {
		Picker("Period", selection: $period) {
			ForEach(BudgetPeriod.allCases) { p in
				Text(p.label).tag(p)
			}
		}
		.pickerStyle(.segmented)
		.padding()
	}

	private var remainingHeader: some View {
		let totalBudget = period.totalMinutes
		let allocated = allocations.values.reduce(0, +)
		let remaining = Double(totalBudget) - allocated

		return VStack(spacing: 4) {
			Text(formatMinutes(remaining))
				.font(.title.weight(.bold))
				.foregroundStyle(remaining < 0 ? .red : remaining == 0 ? .green : .primary)
			Text("remaining of \(formatMinutes(Double(totalBudget)))")
				.font(.caption)
				.foregroundStyle(.secondary)
		}
		.frame(maxWidth: .infinity)
		.padding(.vertical, 12)
		.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
		.padding(.horizontal)
	}

	private var categoryList: some View {
		List {
			ForEach(TimeCategory.grouped(), id: \.bucket) { group in
				Section {
					ForEach(group.categories) { category in
						BudgetCategoryRow(
							category: category,
							minutes: Binding(
								get: { allocations[category.id] ?? 0 },
								set: { newVal in
									allocations[category.id] = newVal
									hasChanges = true
								}
							),
							stepMinutes: stepForPeriod
						)
					}
				} header: {
					HStack(spacing: 6) {
						Circle().fill(group.bucket.color).frame(width: 8, height: 8)
						Text(group.bucket.rawValue)
					}
				}
			}
		}
		.listStyle(.insetGrouped)
	}

	private var saveButton: some View {
		Button("Save Budget") {
			Task { await saveBudget() }
		}
		.buttonStyle(PrimaryButtonStyle())
		.padding()
	}

	private var stepForPeriod: Double {
		switch period {
		case .daily: return 15
		case .weekly: return 30
		case .monthly: return 60
		}
	}

	private func loadBudget() async {
		await timeState.loadBudget()
		rebuildAllocations()
	}

	private func rebuildAllocations() {
		var result: [Int: Double] = [:]
		for b in timeState.budget {
			guard let bp = b.budgetPeriod else { continue }
			let normalized = b.allocatedMinutes * period.multiplierFromDaily / bp.multiplierFromDaily
			result[b.categoryId, default: 0] += normalized
		}
		for cat in TimeCategory.all {
			if result[cat.id] == nil { result[cat.id] = 0 }
		}
		allocations = result
		hasChanges = false
	}

	private func saveBudget() async {
		let items = allocations.compactMap { (catId, minutes) -> TimeBudgetItem? in
			guard minutes > 0 else { return nil }
			return TimeBudgetItem(categoryId: catId, period: period.rawValue, allocatedMinutes: minutes)
		}
		await timeState.saveBudget(items)
		hasChanges = false
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

private struct BudgetCategoryRow: View {
	let category: TimeCategory
	@Binding var minutes: Double
	let stepMinutes: Double

	var body: some View {
		HStack {
			Text(category.name)
				.font(.subheadline)
			Spacer()
			HStack(spacing: 8) {
				Button {
					minutes = max(0, minutes - stepMinutes)
				} label: {
					Image(systemName: "minus.circle")
						.foregroundStyle(minutes > 0 ? .blue : .gray)
				}
				.buttonStyle(.plain)
				.disabled(minutes <= 0)

				Text(formatMinutes(minutes))
					.font(.subheadline.monospacedDigit())
					.frame(minWidth: 50, alignment: .center)

				Button {
					minutes += stepMinutes
				} label: {
					Image(systemName: "plus.circle")
						.foregroundStyle(.blue)
				}
				.buttonStyle(.plain)
			}
		}
		.padding(.vertical, 2)
	}

	private func formatMinutes(_ val: Double) -> String {
		let h = Int(val) / 60
		let m = Int(val) % 60
		if h > 0 {
			return "\(h)h \(m)m"
		}
		return "\(m)m"
	}
}
