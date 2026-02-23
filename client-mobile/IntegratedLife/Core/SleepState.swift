import Foundation

@MainActor
final class SleepState: ObservableObject {
    private let sleepService = SleepService.shared
    private let aggregator = SleepDataAggregator()

    @Published var todayScore: SleepScoreResponse?
    @Published var history: [SleepScoreResponse] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var isSyncing = false

    func loadTodayScores() async {
        isLoading = true
        error = nil
        do {
            todayScore = try await sleepService.getTodayScores()
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func loadHistory(days: Int = 14) async {
        isLoading = true
        error = nil
        do {
            history = try await sleepService.getScoreHistory(days: days)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func syncIfNeeded() async {
        guard !isSyncing else { return }
        isSyncing = true
        error = nil

        do {
            let existing = try await sleepService.getTodayScores()
            if existing != nil {
                todayScore = existing
                isSyncing = false
                return
            }

            if let metrics = try await aggregator.aggregateLastNight() {
                todayScore = try await sleepService.submitNightlyMetrics(metrics)
            }
        } catch {
            self.error = error.localizedDescription
        }

        isSyncing = false
    }
}
