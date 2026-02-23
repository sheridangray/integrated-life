import Foundation
import HealthKit

@MainActor
final class HealthKitService: ObservableObject {
	static let shared = HealthKitService()

	private let healthStore = HKHealthStore()

	@Published var isAuthorized = false

	private let readTypes: Set<HKObjectType> = HealthKitDataType.allReadTypes

	private let writeTypes: Set<HKSampleType> = {
		var types = Set<HKSampleType>()
		types.insert(HKObjectType.workoutType())
		#if DEBUG
		let excludedQuantityTypes: Set<HKQuantityTypeIdentifier> = [
			.walkingAsymmetryPercentage, .walkingDoubleSupportPercentage,
			.walkingHeartRateAverage, .walkingSpeed, .stairAscentSpeed,
			.appleExerciseTime, .appleStandTime,
			.appleSleepingWristTemperature, .atrialFibrillationBurden,
			.heartRateRecoveryOneMinute,
			.runningPower, .runningGroundContactTime,
			.runningVerticalOscillation, .runningStrideLength,
			.cyclingSpeed, .cyclingPower,
			.restingHeartRate,
		]
		let excludedCategoryTypes: Set<HKCategoryTypeIdentifier> = [
			.irregularHeartRhythmEvent,
		]
		for dataType in HealthKitDataType.catalog {
			if let qid = dataType.quantityTypeId, !excludedQuantityTypes.contains(qid),
			   let qt = HKQuantityType.quantityType(forIdentifier: qid) {
				types.insert(qt)
			}
			if let cid = dataType.categoryTypeId, !excludedCategoryTypes.contains(cid),
			   let ct = HKCategoryType.categoryType(forIdentifier: cid) {
				types.insert(ct)
			}
		}
		#endif
		return types
	}()

	private init() {
		checkAuthorization()
	}

	var isHealthDataAvailable: Bool {
		HKHealthStore.isHealthDataAvailable()
	}

	func checkAuthorization() {
		guard isHealthDataAvailable else {
			isAuthorized = false
			return
		}
		let status = healthStore.authorizationStatus(for: HKObjectType.workoutType())
		isAuthorized = status == .sharingAuthorized
	}

	func requestAuthorization() async throws {
		guard isHealthDataAvailable else { return }
		try await healthStore.requestAuthorization(toShare: writeTypes, read: readTypes)
		checkAuthorization()
	}

	func authorizationStatus(for type: HKObjectType) -> HKAuthorizationStatus {
		healthStore.authorizationStatus(for: type)
	}

	// MARK: - Read Quantity Samples

	func fetchQuantitySamples(
		type: HKQuantityTypeIdentifier,
		unit: HKUnit,
		start: Date,
		end: Date = Date()
	) async throws -> [(date: Date, value: Double)] {
		guard let quantityType = HKQuantityType.quantityType(forIdentifier: type) else { return [] }

		let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
		let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

		return try await withCheckedThrowingContinuation { continuation in
			let query = HKSampleQuery(
				sampleType: quantityType,
				predicate: predicate,
				limit: HKObjectQueryNoLimit,
				sortDescriptors: [sortDescriptor]
			) { _, samples, error in
				if let error {
					continuation.resume(throwing: error)
					return
				}
				let results = (samples as? [HKQuantitySample])?.map { sample in
					(date: sample.startDate, value: sample.quantity.doubleValue(for: unit))
				} ?? []
				continuation.resume(returning: results)
			}
			healthStore.execute(query)
		}
	}

	// MARK: - Read Category Samples

	func fetchCategorySamples(
		type: HKCategoryTypeIdentifier,
		start: Date,
		end: Date = Date()
	) async throws -> [(date: Date, value: Int)] {
		guard let categoryType = HKCategoryType.categoryType(forIdentifier: type) else { return [] }

		let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
		let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

		return try await withCheckedThrowingContinuation { continuation in
			let query = HKSampleQuery(
				sampleType: categoryType,
				predicate: predicate,
				limit: HKObjectQueryNoLimit,
				sortDescriptors: [sortDescriptor]
			) { _, samples, error in
				if let error {
					continuation.resume(throwing: error)
					return
				}
				let results = (samples as? [HKCategorySample])?.map { sample in
					(date: sample.startDate, value: sample.value)
				} ?? []
				continuation.resume(returning: results)
			}
			healthStore.execute(query)
		}
	}

	// MARK: - Read Workouts

	func fetchWorkouts(start: Date, end: Date = Date()) async throws -> [HKWorkout] {
		let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
		let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

		return try await withCheckedThrowingContinuation { continuation in
			let query = HKSampleQuery(
				sampleType: HKObjectType.workoutType(),
				predicate: predicate,
				limit: HKObjectQueryNoLimit,
				sortDescriptors: [sortDescriptor]
			) { _, samples, error in
				if let error {
					continuation.resume(throwing: error)
					return
				}
				continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
			}
			healthStore.execute(query)
		}
	}

	// MARK: - Write Workout

	func saveWorkout(
		activityType: HKWorkoutActivityType = .traditionalStrengthTraining,
		start: Date,
		end: Date
	) async throws {
		let config = HKWorkoutConfiguration()
		config.activityType = activityType

		let builder = HKWorkoutBuilder(healthStore: healthStore, configuration: config, device: .local())
		try await builder.beginCollection(at: start)
		try await builder.endCollection(at: end)
		try await builder.finishWorkout()
	}

	// MARK: - Debug Backfill

	#if DEBUG
	func backfillSampleData(days: Int = 90, onProgress: @escaping (Double, String) -> Void) async -> (saved: Int, failed: Int, firstError: String?) {
		let calendar = Calendar.current
		let now = Date()
		var totalSaved = 0
		var totalFailed = 0
		var firstError: String?

		let configs = BackfillConfig.all
		let totalSteps = configs.count

		for (index, config) in configs.enumerated() {
			let progress = Double(index) / Double(totalSteps)
			onProgress(progress, config.label)

			for dayOffset in 0..<days {
				guard let dayStart = calendar.date(byAdding: .day, value: -dayOffset, to:
					calendar.startOfDay(for: now)) else { continue }

				for sampleIndex in 0..<config.samplesPerDay {
					let hourSpread = config.hourEnd - config.hourStart
					let hourOffset = config.samplesPerDay > 1
						? config.hourStart + (hourSpread * sampleIndex / max(config.samplesPerDay - 1, 1))
						: config.hourStart + hourSpread / 2
					let minuteOffset = Int.random(in: 0...59)

					guard let sampleDate = calendar.date(bySettingHour: hourOffset, minute: minuteOffset, second: 0, of: dayStart) else { continue }
					guard sampleDate <= now else { continue }

					let jitter = 1.0 + Double.random(in: -0.08...0.08)
					let baseValue = Double.random(in: config.valueRange)
					let value = baseValue * jitter

					if let qid = config.quantityTypeId,
					   let quantityType = HKQuantityType.quantityType(forIdentifier: qid) {
						let quantity = HKQuantity(unit: config.unit, doubleValue: value)
						let sampleEnd = sampleDate.addingTimeInterval(1)
						let sample = HKQuantitySample(type: quantityType, quantity: quantity, start: sampleDate, end: sampleEnd)
						do {
							try await healthStore.save(sample)
							totalSaved += 1
						} catch {
							totalFailed += 1
							if firstError == nil {
								firstError = "[\(config.label)] \(error.localizedDescription)"
							}
							print("[Backfill] Failed \(config.label): \(error.localizedDescription)")
						}
					}
				}
			}
		}

		onProgress(0.9, "Sleep sessions")
		for dayOffset in 0..<days {
			guard let bedtime = calendar.date(byAdding: .day, value: -(dayOffset + 1), to:
				calendar.startOfDay(for: now)),
				  let sleepStart = calendar.date(bySettingHour: 22, minute: Int.random(in: 0...59), second: 0, of: bedtime),
				  let sleepEnd = calendar.date(byAdding: .hour, value: Int.random(in: 6...9), to: sleepStart),
				  sleepEnd <= now,
				  let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)
			else { continue }

			let sample = HKCategorySample(type: sleepType, value: HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue, start: sleepStart, end: sleepEnd)
			do {
				try await healthStore.save(sample)
				totalSaved += 1
			} catch {
				totalFailed += 1
				if firstError == nil { firstError = "[Sleep] \(error.localizedDescription)" }
				print("[Backfill] Failed Sleep: \(error.localizedDescription)")
			}
		}

		onProgress(0.95, "Mindful sessions")
		for dayOffset in stride(from: 0, to: days, by: 2) {
			guard let day = calendar.date(byAdding: .day, value: -dayOffset, to: calendar.startOfDay(for: now)),
				  let sessionStart = calendar.date(bySettingHour: 7, minute: Int.random(in: 0...30), second: 0, of: day),
				  let sessionEnd = calendar.date(byAdding: .minute, value: Int.random(in: 5...20), to: sessionStart),
				  sessionEnd <= now,
				  let mindfulType = HKCategoryType.categoryType(forIdentifier: .mindfulSession)
			else { continue }

			let sample = HKCategorySample(type: mindfulType, value: 0, start: sessionStart, end: sessionEnd)
			do {
				try await healthStore.save(sample)
				totalSaved += 1
			} catch {
				totalFailed += 1
				if firstError == nil { firstError = "[Mindful] \(error.localizedDescription)" }
				print("[Backfill] Failed Mindful: \(error.localizedDescription)")
			}
		}

		onProgress(1.0, "Complete")
		return (saved: totalSaved, failed: totalFailed, firstError: firstError)
	}
	#endif
}
