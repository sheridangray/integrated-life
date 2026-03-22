import Foundation

/// Shared HealthKit night → server sync and UserDefaults tracking for `SleepState` and background delivery.
enum SleepNightSyncCoordinator {
	/// Same key as legacy `SleepState` so existing installs keep sync state.
	static let syncedDatesUserDefaultsKey = "SleepState.syncedDates"

	static func dateKey(for date: Date) -> String {
		let f = DateFormatter()
		f.dateFormat = "yyyy-MM-dd"
		f.timeZone = Calendar.current.timeZone
		return f.string(from: date)
	}

	static func loadSyncedDateKeys() -> Set<String> {
		let array = UserDefaults.standard.stringArray(forKey: syncedDatesUserDefaultsKey) ?? []
		return Set(array)
	}

	static func saveSyncedDateKeys(_ keys: Set<String>) {
		UserDefaults.standard.set(Array(keys), forKey: syncedDatesUserDefaultsKey)
	}

	/// Sync one wake-date night: aggregate → submit when metrics exist. Matches `SleepState.syncIfNeeded` per-night behavior.
	/// - Returns: score when metrics were submitted; `nil` when there were no metrics or submit was skipped.
	/// - Throws: only when aggregation or submit throws (caller may catch and skip marking synced).
	static func syncSingleNight(
		wakeDate: Date,
		aggregator: SleepDataAggregator,
		sleepService: SleepService
	) async throws -> SleepScoreResponse? {
		guard let metrics = try await aggregator.aggregateNight(for: wakeDate) else {
			return nil
		}
		return try await sleepService.submitNightlyMetrics(metrics)
	}
}
