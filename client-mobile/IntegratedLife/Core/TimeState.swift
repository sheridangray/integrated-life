import Foundation

@MainActor
final class TimeState: ObservableObject {
	private let timeService = TimeService.shared

	@Published var activeEntries: [TimeEntry] = []
	@Published var entries: [TimeEntry] = []
	@Published var budget: [TimeBudgetItem] = []
	@Published var isLoading = false
	@Published var error: String?

	// MARK: - Active Entries

	func loadActiveEntries() async {
		do {
			activeEntries = try await timeService.fetchActiveEntries()
		} catch {
			self.error = error.localizedDescription
		}
	}

	func startActivity(categoryId: Int, notes: String? = nil) async {
		do {
			let entry = try await timeService.startEntry(categoryId: categoryId, notes: notes)
			activeEntries.insert(entry, at: 0)
		} catch {
			self.error = error.localizedDescription
		}
	}

	func stopActivity(id: String) async {
		do {
			let stopped = try await timeService.stopEntry(id: id)
			activeEntries.removeAll { $0.id == id }
			if let idx = entries.firstIndex(where: { $0.id == id }) {
				entries[idx] = stopped
			}
		} catch {
			self.error = error.localizedDescription
		}
	}

	func deleteEntry(id: String) async {
		do {
			try await timeService.deleteEntry(id: id)
			activeEntries.removeAll { $0.id == id }
			entries.removeAll { $0.id == id }
		} catch {
			self.error = error.localizedDescription
		}
	}

	// MARK: - Dashboard Entries

	func loadEntries(from: Date, to: Date) async {
		isLoading = true
		error = nil
		do {
			entries = try await timeService.fetchEntries(from: from, to: to)
		} catch {
			self.error = error.localizedDescription
		}
		isLoading = false
	}

	// MARK: - Budget

	func loadBudget() async {
		isLoading = true
		error = nil
		do {
			budget = try await timeService.fetchBudget()
		} catch {
			self.error = error.localizedDescription
		}
		isLoading = false
	}

	func saveBudget(_ budgets: [TimeBudgetItem]) async {
		do {
			budget = try await timeService.saveBudget(budgets)
		} catch {
			self.error = error.localizedDescription
		}
	}
}
