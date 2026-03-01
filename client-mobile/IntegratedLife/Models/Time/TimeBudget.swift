import Foundation

enum BudgetPeriod: String, CaseIterable, Codable, Identifiable {
	var id: String { rawValue }

	case daily
	case weekly
	case monthly

	var label: String {
		switch self {
		case .daily: return "Daily"
		case .weekly: return "Weekly"
		case .monthly: return "Monthly"
		}
	}

	var totalMinutes: Int {
		switch self {
		case .daily: return 1440
		case .weekly: return 10080
		case .monthly: return 43800
		}
	}

	var multiplierFromDaily: Double {
		switch self {
		case .daily: return 1
		case .weekly: return 7
		case .monthly: return 30.4167
		}
	}
}

struct TimeBudgetItem: Codable, Identifiable {
	let categoryId: Int
	let period: String
	let allocatedMinutes: Double

	var id: String { "\(categoryId)-\(period)" }

	var budgetPeriod: BudgetPeriod? {
		BudgetPeriod(rawValue: period)
	}
}

struct TimeBudgetResponse: Codable {
	let budgets: [TimeBudgetItem]
}

struct SaveBudgetRequest: Encodable {
	let budgets: [TimeBudgetItem]
}
