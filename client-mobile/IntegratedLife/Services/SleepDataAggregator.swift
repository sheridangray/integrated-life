import Foundation
import HealthKit

final class SleepDataAggregator {
    private let healthStore = HKHealthStore()
    private let isoFormatter = ISO8601DateFormatter()

    func aggregateLastNight() async throws -> NightlyMetrics? {
        try await aggregateNight(for: Date())
    }

    /// Aggregate HealthKit sleep data for the night ending on the morning of `wakeDate`.
    func aggregateNight(for wakeDate: Date) async throws -> NightlyMetrics? {
        let calendar = Calendar.current
        let dayStart = calendar.startOfDay(for: wakeDate)

        guard let windowStart = calendar.date(bySettingHour: 20, minute: 0, second: 0, of: calendar.date(byAdding: .day, value: -1, to: dayStart)!),
              let windowEnd = calendar.date(bySettingHour: 12, minute: 0, second: 0, of: dayStart) else {
            return nil
        }

        return try await aggregateWindow(start: windowStart, end: windowEnd)
    }

    /// Returns all dates in HealthKit that have sleep data, going back `maxDays`.
    func availableSleepDates(maxDays: Int = 90) async throws -> [Date] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        guard let rangeStart = calendar.date(byAdding: .day, value: -maxDays, to: today) else { return [] }

        let samples = try await fetchSleepSamples(start: rangeStart, end: Date())
        var dateSet = Set<Date>()
        for sample in samples {
            guard let value = HKCategoryValueSleepAnalysis(rawValue: sample.value) else { continue }
            switch value {
            case .asleepCore, .asleepDeep, .asleepREM, .asleepUnspecified:
                let nightDate = calendar.startOfDay(for: sample.endDate)
                dateSet.insert(nightDate)
            default: break
            }
        }
        return dateSet.sorted()
    }

    // MARK: - Core aggregation for a single sleep window

    private func aggregateWindow(start windowStart: Date, end windowEnd: Date) async throws -> NightlyMetrics? {
        let calendar = Calendar.current

        let sleepSamples = try await fetchSleepSamples(start: windowStart, end: windowEnd)
        guard !sleepSamples.isEmpty else { return nil }

        let (inBedSamples, asleepSamples, stageSamples) = categorizeSamples(sleepSamples)
        guard !asleepSamples.isEmpty else { return nil }

        let sleepStart = asleepSamples.map(\.startDate).min() ?? windowStart
        let sleepEnd = asleepSamples.map(\.endDate).max() ?? windowEnd
        let midpoint = Date(timeIntervalSince1970: (sleepStart.timeIntervalSince1970 + sleepEnd.timeIntervalSince1970) / 2)

        let totalAsleep = asleepSamples.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) / 60 }
        let totalInBed = inBedSamples.isEmpty
            ? sleepEnd.timeIntervalSince(sleepStart) / 60
            : inBedSamples.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) / 60 }

        let deepDuration = durationForStage(stageSamples, stage: .asleepDeep)
        let remDuration = durationForStage(stageSamples, stage: .asleepREM)
        let coreDuration = durationForStage(stageSamples, stage: .asleepCore)
        let wasoDuration = durationForStage(stageSamples, stage: .awake)

        let hasStages = deepDuration != nil || remDuration != nil
        let deviceTier: DeviceTier = hasStages ? .a : .c

        let hrSamples = try await fetchQuantitySamples(
            type: .heartRate,
            unit: HKUnit.count().unitDivided(by: .minute()),
            start: sleepStart,
            end: sleepEnd
        )

        guard !hrSamples.isEmpty else { return nil }

        let minHrSample = hrSamples.min(by: { $0.value < $1.value })!
        let avgHr = hrSamples.reduce(0.0) { $0 + $1.value } / Double(hrSamples.count)

        let hrvSamples = try await fetchQuantitySamples(
            type: .heartRateVariabilitySDNN,
            unit: HKUnit.secondUnit(with: .milli),
            start: sleepStart,
            end: sleepEnd
        )
        let hrvMean: Double? = hrvSamples.isEmpty ? nil : hrvSamples.reduce(0.0) { $0 + $1.value } / Double(hrvSamples.count)

        let rrSamples = try await fetchQuantitySamples(
            type: .respiratoryRate,
            unit: HKUnit.count().unitDivided(by: .minute()),
            start: sleepStart,
            end: sleepEnd
        )
        let respiratoryRateMean: Double? = rrSamples.isEmpty ? nil : rrSamples.reduce(0.0) { $0 + $1.value } / Double(rrSamples.count)

        var temperatureDeviation: Double?
        if #available(iOS 16.0, *) {
            let tempSamples = try await fetchQuantitySamples(
                type: .appleSleepingWristTemperature,
                unit: .degreeCelsius(),
                start: sleepStart,
                end: sleepEnd
            )
            if let latest = tempSamples.first {
                temperatureDeviation = latest.value
            }
        }

        let dateStr = isoFormatter.string(from: calendar.startOfDay(for: sleepStart.addingTimeInterval(4 * 3600)))

        return NightlyMetrics(
            date: dateStr,
            sleepStartTime: isoFormatter.string(from: sleepStart),
            sleepEndTime: isoFormatter.string(from: sleepEnd),
            sleepMidpoint: isoFormatter.string(from: midpoint),
            totalAsleepDuration: totalAsleep,
            totalInBedDuration: totalInBed,
            deepDuration: deepDuration,
            remDuration: remDuration,
            coreDuration: coreDuration,
            wasoDuration: wasoDuration,
            minHrValue: minHrSample.value,
            minHrTimestamp: isoFormatter.string(from: minHrSample.date),
            avgHr: avgHr,
            hrvMean: hrvMean,
            respiratoryRateMean: respiratoryRateMean,
            temperatureDeviation: temperatureDeviation,
            deviceTier: deviceTier
        )
    }

    // MARK: - Private Helpers

    private func fetchSleepSamples(start: Date, end: Date) async throws -> [HKCategorySample] {
        guard let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else { return [] }

        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: sleepType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume(returning: (samples as? [HKCategorySample]) ?? [])
            }
            healthStore.execute(query)
        }
    }

    private func categorizeSamples(_ samples: [HKCategorySample]) -> (
        inBed: [HKCategorySample],
        asleep: [HKCategorySample],
        staged: [HKCategorySample]
    ) {
        var inBed: [HKCategorySample] = []
        var asleep: [HKCategorySample] = []
        var staged: [HKCategorySample] = []

        for sample in samples {
            guard let value = HKCategoryValueSleepAnalysis(rawValue: sample.value) else { continue }
            switch value {
            case .inBed:
                inBed.append(sample)
            case .asleepCore, .asleepDeep, .asleepREM, .asleepUnspecified:
                asleep.append(sample)
                if value != .asleepUnspecified {
                    staged.append(sample)
                }
            case .awake:
                staged.append(sample)
            @unknown default:
                break
            }
        }
        return (inBed, asleep, staged)
    }

    private func durationForStage(_ samples: [HKCategorySample], stage: HKCategoryValueSleepAnalysis) -> Double? {
        let matching = samples.filter { $0.value == stage.rawValue }
        guard !matching.isEmpty else { return nil }
        return matching.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) / 60 }
    }

    private func fetchQuantitySamples(
        type: HKQuantityTypeIdentifier,
        unit: HKUnit,
        start: Date,
        end: Date
    ) async throws -> [(date: Date, value: Double)] {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: type) else { return [] }

        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

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
}
