import Foundation
import HealthKit
import os.log

private let syncLog = Logger(subsystem: Bundle.main.bundleIdentifier ?? "com.integratedlife.app", category: "MonitorSync")

@MainActor
final class MonitorSyncService: ObservableObject {
	static let shared = MonitorSyncService()

	private let healthKitService = HealthKitService.shared
	private let healthService = HealthService.shared

	private static let lastSyncKey = "MonitorSyncService.lastSyncDates"
	private static let lastReportCheckKey = "MonitorSyncService.lastReportCheck"
	private static let batchSize = 500

	@Published var isSyncing = false
	@Published var syncProgress: String?
	@Published var hasNewReport = false

	private init() {}

	func syncIfNeeded() async {
		guard !isSyncing else { return }
		guard healthKitService.isAuthorized else { return }

		isSyncing = true
		syncProgress = "Syncing health data..."

		let syncableTypes = HealthKitDataType.monitorableTypes.filter { !$0.isDerived && $0.isQuantityType }
		let lastSyncDates = loadLastSyncDates()
		let now = Date()
		var totalSynced = 0

		for dataType in syncableTypes {
			guard let quantityTypeId = dataType.quantityTypeId, let unit = dataType.hkUnit else { continue }

			let lastSync = lastSyncDates[dataType.id].flatMap { ISO8601DateFormatter().date(from: $0) }
				?? Calendar.current.date(byAdding: .day, value: -7, to: now)!

			guard let samples = try? await healthKitService.fetchQuantitySamples(
				type: quantityTypeId, unit: unit, start: lastSync, end: now
			), !samples.isEmpty else { continue }

			let formatter = ISO8601DateFormatter()
			let syncSamples = samples.map { sample in
				MonitorSyncSample(
					sampleType: dataType.id,
					date: formatter.string(from: sample.date),
					value: sample.value,
					unit: dataType.unit,
					source: nil
				)
			}

			do {
				for batch in syncSamples.chunked(into: Self.batchSize) {
					let result = try await healthService.syncMonitorData(samples: batch)
					totalSynced += result.synced
				}
				saveLastSyncDate(now, for: dataType.id)
			} catch {
				syncLog.error("Failed to sync \(dataType.id): \(error.localizedDescription)")
			}
		}

		if totalSynced > 0 {
			syncLog.info("Synced \(totalSynced) health samples")
		}

		await checkForNewReports()

		syncProgress = nil
		isSyncing = false
	}

	private func checkForNewReports() async {
		let lastCheck = UserDefaults.standard.string(forKey: Self.lastReportCheckKey)

		do {
			let reports = try await healthService.fetchReports(since: lastCheck)
			if !reports.isEmpty {
				hasNewReport = true
				let report = reports[0]

				let dateRange = formatReportDateRange(start: report.periodStart, end: report.periodEnd)
				try? await NotificationService.shared.schedule(
					identifier: "health-report-\(report.id)",
					category: .healthReport,
					title: "Weekly Health Report Ready",
					body: "Your health report for \(dateRange) is ready to view.",
					dateComponents: Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: Date().addingTimeInterval(1))
				)
			}
		} catch {
			syncLog.error("Failed to check for new reports: \(error.localizedDescription)")
		}

		UserDefaults.standard.set(ISO8601DateFormatter().string(from: Date()), forKey: Self.lastReportCheckKey)
	}

	private func formatReportDateRange(start: String, end: String) -> String {
		let isoFormatter = ISO8601DateFormatter()
		let display = DateFormatter()
		display.dateFormat = "MMM d"

		guard let startDate = isoFormatter.date(from: start),
			  let endDate = isoFormatter.date(from: end) else { return "" }
		return "\(display.string(from: startDate)) – \(display.string(from: endDate))"
	}

	// MARK: - Backfill

	func backfillAllHistory(onProgress: @escaping (String, Double) -> Void) async -> (synced: Int, failed: Int) {
		guard healthKitService.isAuthorized else { return (0, 0) }

		let syncableTypes = HealthKitDataType.monitorableTypes.filter { !$0.isDerived && $0.isQuantityType }
		let formatter = ISO8601DateFormatter()
		let distantPast = Calendar.current.date(byAdding: .year, value: -10, to: Date()) ?? Date()
		let now = Date()

		var totalSynced = 0
		var totalFailed = 0

		for (index, dataType) in syncableTypes.enumerated() {
			let progress = Double(index) / Double(syncableTypes.count)
			onProgress(dataType.name, progress)

			guard let quantityTypeId = dataType.quantityTypeId, let unit = dataType.hkUnit else { continue }

			guard let samples = try? await healthKitService.fetchQuantitySamples(
				type: quantityTypeId, unit: unit, start: distantPast, end: now
			), !samples.isEmpty else { continue }

			let syncSamples = samples.map { sample in
				MonitorSyncSample(
					sampleType: dataType.id,
					date: formatter.string(from: sample.date),
					value: sample.value,
					unit: dataType.unit,
					source: nil
				)
			}

			for batch in syncSamples.chunked(into: Self.batchSize) {
				do {
					let result = try await healthService.syncMonitorData(samples: batch)
					totalSynced += result.synced
				} catch {
					totalFailed += batch.count
					syncLog.error("Backfill failed for \(dataType.id): \(error.localizedDescription)")
				}
			}

			if let earliest = samples.last {
				saveLastSyncDate(earliest.date, for: dataType.id)
			}
		}

		onProgress("Complete", 1.0)
		return (synced: totalSynced, failed: totalFailed)
	}

	// MARK: - Sync date tracking

	private func loadLastSyncDates() -> [String: String] {
		UserDefaults.standard.dictionary(forKey: Self.lastSyncKey) as? [String: String] ?? [:]
	}

	private func saveLastSyncDate(_ date: Date, for sampleType: String) {
		var dates = loadLastSyncDates()
		dates[sampleType] = ISO8601DateFormatter().string(from: date)
		UserDefaults.standard.set(dates, forKey: Self.lastSyncKey)
	}
}

extension Array {
	func chunked(into size: Int) -> [[Element]] {
		stride(from: 0, to: count, by: size).map {
			Array(self[$0..<Swift.min($0 + size, count)])
		}
	}
}
