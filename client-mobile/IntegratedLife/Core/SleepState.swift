import Foundation

@MainActor
final class SleepState: ObservableObject {
    private let sleepService = SleepService.shared
    private let aggregator = SleepDataAggregator()

    private static let syncedDatesKey = "SleepState.syncedDates"

    @Published var todayScore: SleepScoreResponse?
    @Published var history: [SleepScoreResponse] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var isSyncing = false
    @Published var syncProgress: String?

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

    /// Syncs all unsynced HealthKit nights to the server, then loads today's score.
    func syncIfNeeded() async {
        guard !isSyncing else { return }
        isSyncing = true
        error = nil

        do {
            let availableDates = try await aggregator.availableSleepDates(maxDays: 90)
            let syncedSet = loadSyncedDates()
            let unsyncedDates = availableDates.filter { !syncedSet.contains(dateKey($0)) }

            if !unsyncedDates.isEmpty {
                syncProgress = "Syncing 0/\(unsyncedDates.count) nights..."
                var newlySynced: [String] = []

                for (index, date) in unsyncedDates.enumerated() {
                    syncProgress = "Syncing \(index + 1)/\(unsyncedDates.count) nights..."
                    do {
                        if let metrics = try await aggregator.aggregateNight(for: date) {
                            let score = try await sleepService.submitNightlyMetrics(metrics)
                            if dateKey(date) == dateKey(Date()) {
                                todayScore = score
                            }
                        }
                        newlySynced.append(dateKey(date))
                    } catch {
                        print("[SleepSync] Failed to sync \(dateKey(date)): \(error.localizedDescription)")
                    }
                }

                saveSyncedDates(syncedSet.union(newlySynced))
                syncProgress = nil
            }

            if todayScore == nil {
                todayScore = try await sleepService.getTodayScores()
            }
        } catch {
            self.error = error.localizedDescription
        }

        syncProgress = nil
        isSyncing = false
    }

    // MARK: - Synced dates tracking

    private func dateKey(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = Calendar.current.timeZone
        return f.string(from: date)
    }

    private func loadSyncedDates() -> Set<String> {
        let array = UserDefaults.standard.stringArray(forKey: Self.syncedDatesKey) ?? []
        return Set(array)
    }

    private func saveSyncedDates(_ dates: Set<String>) {
        UserDefaults.standard.set(Array(dates), forKey: Self.syncedDatesKey)
    }
}
