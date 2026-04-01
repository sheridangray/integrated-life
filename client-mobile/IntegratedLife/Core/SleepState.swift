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

    /// Loads today + history together for the Pillars overview (single loading cycle, parallel fetches).
    func loadForOverview() async {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            async let today = sleepService.getTodayScores()
            async let hist = sleepService.getScoreHistory(days: 14)
            let (t, h) = try await (today, hist)
            todayScore = t
            history = h
        } catch {
            self.error = error.localizedDescription
        }
    }

    /// Syncs all unsynced HealthKit nights to the server, then loads today's score.
    func syncIfNeeded() async {
        guard !isSyncing else { return }
        isSyncing = true
        error = nil

        do {
            let availableDates = try await aggregator.availableSleepDates(maxDays: 90)
            var syncedSet = SleepNightSyncCoordinator.loadSyncedDateKeys()
            let unsyncedDates = availableDates.filter { !syncedSet.contains(SleepNightSyncCoordinator.dateKey(for: $0)) }

            if !unsyncedDates.isEmpty {
                syncProgress = "Syncing 0/\(unsyncedDates.count) nights..."
                var newlySynced: [String] = []

                for (index, date) in unsyncedDates.enumerated() {
                    syncProgress = "Syncing \(index + 1)/\(unsyncedDates.count) nights..."
                    let key = SleepNightSyncCoordinator.dateKey(for: date)
                    do {
                        if let score = try await SleepNightSyncCoordinator.syncSingleNight(
                            wakeDate: date,
                            aggregator: aggregator,
                            sleepService: sleepService
                        ) {
                            if key == SleepNightSyncCoordinator.dateKey(for: Date()) {
                                todayScore = score
                            }
                        }
                        newlySynced.append(key)
                    } catch {
                        print("[SleepSync] Failed to sync \(key): \(error.localizedDescription)")
                    }
                }

                syncedSet.formUnion(newlySynced)
                SleepNightSyncCoordinator.saveSyncedDateKeys(syncedSet)
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
}
