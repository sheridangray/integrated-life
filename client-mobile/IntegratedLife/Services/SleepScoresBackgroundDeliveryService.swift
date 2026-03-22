import Foundation
import HealthKit
import os.log

private let sleepScoresHKLog = Logger(subsystem: Bundle.main.bundleIdentifier ?? "com.integratedlife.app", category: "SleepScoresHK")

enum MorningSleepScoresPreferences {
	static let userDefaultsKey = "morningSleepScoresNotificationEnabled"

	static var isEnabled: Bool {
		get { UserDefaults.standard.bool(forKey: userDefaultsKey) }
		set { UserDefaults.standard.set(newValue, forKey: userDefaultsKey) }
	}
}

/// HealthKit background delivery for sleep analysis → sync night → local notification with scores (best-effort).
final class SleepScoresBackgroundDeliveryService: @unchecked Sendable {
	static let shared = SleepScoresBackgroundDeliveryService()

	private let healthStore = HKHealthStore()
	private let aggregator = SleepDataAggregator()
	private let syncQueue = DispatchQueue(label: "com.integratedlife.sleepscores.hk")
	private var sleepObserverQuery: HKObserverQuery?

	private static let lastNotifiedNightKey = "morningSleepScores.lastNotifiedNightKey"
	private static let notificationIdentifier = "sleep-scores-morning-hk"

	private init() {}

	/// Call when preference, auth, or Health authorization may have changed.
	func syncRegistrationWithUserPreference() {
		if MorningSleepScoresPreferences.isEnabled, AuthService.shared.hasStoredTokens {
			start()
		} else {
			stop()
		}
	}

	/// Tear down observer and background delivery (e.g. sign-out or feature off).
	func stop() {
		stopInternal(clearLastNotified: true)
	}

	#if DEBUG
	/// Debug: run the same pipeline as an HK update without waiting for HealthKit.
	func runPipelineNowForDebug() async {
		await processPipeline()
	}
	#endif

	private func start() {
		// Always tear down first so revoked Health permission or failed guards don't leave a stale observer.
		stopInternal(clearLastNotified: false)

		guard MorningSleepScoresPreferences.isEnabled else { return }
		guard HKHealthStore.isHealthDataAvailable() else { return }
		guard AuthService.shared.hasStoredTokens else { return }
		guard let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else { return }
		guard healthStore.authorizationStatus(for: sleepType) == .sharingAuthorized else {
			sleepScoresHKLog.debug("Sleep analysis not authorized; skip HK background registration")
			return
		}

		healthStore.enableBackgroundDelivery(for: sleepType, frequency: .immediate) { success, error in
			if let error {
				sleepScoresHKLog.error("enableBackgroundDelivery failed: \(error.localizedDescription)")
			} else {
				sleepScoresHKLog.info("enableBackgroundDelivery sleepAnalysis success=\(success)")
			}
		}

		let query = HKObserverQuery(sampleType: sleepType, predicate: nil) { [weak self] _, completionHandler, error in
			if let error {
				sleepScoresHKLog.error("HKObserverQuery error: \(error.localizedDescription)")
				completionHandler()
				return
			}
			guard let self else {
				completionHandler()
				return
			}
			self.handleSleepAnalysisUpdate(completionHandler: completionHandler)
		}

		syncQueue.sync { sleepObserverQuery = query }
		healthStore.execute(query)
		sleepScoresHKLog.info("HKObserverQuery for sleepAnalysis started")
	}

	private func stopInternal(clearLastNotified: Bool) {
		syncQueue.sync {
			if let q = sleepObserverQuery {
				healthStore.stop(q)
				sleepObserverQuery = nil
			}
		}
		if let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) {
			healthStore.disableBackgroundDelivery(for: sleepType) { _, _ in }
		}
		if clearLastNotified {
			UserDefaults.standard.removeObject(forKey: Self.lastNotifiedNightKey)
		}
	}

	private func handleSleepAnalysisUpdate(completionHandler: @escaping () -> Void) {
		Task {
			defer { completionHandler() }
			await processPipeline()
		}
	}

	private func processPipeline() async {
		guard MorningSleepScoresPreferences.isEnabled else { return }
		guard AuthService.shared.hasStoredTokens else { return }
		guard let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis),
		      healthStore.authorizationStatus(for: sleepType) == .sharingAuthorized else { return }

		let wakeDate = Date()
		let nightKey = SleepNightSyncCoordinator.dateKey(for: wakeDate)
		if UserDefaults.standard.string(forKey: Self.lastNotifiedNightKey) == nightKey { return }

		let synced = SleepNightSyncCoordinator.loadSyncedDateKeys()
		let sleepService = SleepService.shared

		do {
			let score: SleepScoreResponse?
			if synced.contains(nightKey) {
				score = try await sleepService.getTodayScores()
			} else {
				score = try await SleepNightSyncCoordinator.syncSingleNight(
					wakeDate: wakeDate,
					aggregator: aggregator,
					sleepService: sleepService
				)
				var s = synced
				s.insert(nightKey)
				SleepNightSyncCoordinator.saveSyncedDateKeys(s)
			}

			guard let score else { return }

			try await NotificationService.shared.scheduleTimeInterval(
				identifier: Self.notificationIdentifier,
				category: .sleepScoresMorning,
				title: "Sleep & Readiness",
				body: "Sleep \(score.sleepScore) · Readiness \(score.readinessScore). Tap for details.",
				userInfo: [NotificationDeepLink.userInfoKey: NotificationDeepLink.pillarsSleep],
				delaySeconds: 1
			)
			UserDefaults.standard.set(nightKey, forKey: Self.lastNotifiedNightKey)
			sleepScoresHKLog.info("Scheduled morning sleep scores notification for night \(nightKey)")
		} catch {
			sleepScoresHKLog.debug("Sleep scores pipeline skipped: \(error.localizedDescription)")
		}
	}
}
