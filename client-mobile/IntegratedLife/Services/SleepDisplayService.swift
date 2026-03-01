import Foundation
import HealthKit

final class SleepDisplayService {
    private let healthStore = HKHealthStore()

    func fetchSleepForDay(date: Date) async throws -> SleepNightDisplay? {
        let calendar = Calendar.current
        guard let windowStart = calendar.date(bySettingHour: 20, minute: 0, second: 0, of: calendar.date(byAdding: .day, value: -1, to: date)!),
              let windowEnd = calendar.date(bySettingHour: 12, minute: 0, second: 0, of: date) else {
            return nil
        }
        return try await buildNightDisplay(from: windowStart, to: windowEnd, referenceDate: date)
    }

    func fetchSleepForWeek(ending: Date) async throws -> [SleepNightDisplay] {
        var nights: [SleepNightDisplay] = []
        let calendar = Calendar.current
        for i in 0 ..< 7 {
            guard let wakeDate = calendar.date(byAdding: .day, value: -i, to: ending) else { continue }
            if let night = try await fetchSleepForDay(date: wakeDate) {
                nights.append(night)
            }
        }
        return nights.sorted { $0.sleepStart < $1.sleepStart }
    }

    func fetchSleepForMonth(ending: Date) async throws -> [SleepNightDisplay] {
        var nights: [SleepNightDisplay] = []
        let calendar = Calendar.current
        for i in 0 ..< 30 {
            guard let wakeDate = calendar.date(byAdding: .day, value: -i, to: ending) else { continue }
            if let night = try await fetchSleepForDay(date: wakeDate) {
                nights.append(night)
            }
        }
        return nights.sorted { $0.sleepStart < $1.sleepStart }
    }

    func fetchSleepForSixMonths(ending: Date) async throws -> [SleepNightDisplay] {
        var nights: [SleepNightDisplay] = []
        let calendar = Calendar.current
        for i in 0 ..< 180 {
            guard let wakeDate = calendar.date(byAdding: .day, value: -i, to: ending) else { continue }
            if let night = try await fetchSleepForDay(date: wakeDate) {
                nights.append(night)
            }
        }
        return nights.sorted { $0.sleepStart < $1.sleepStart }
    }

    // MARK: - Private

    private func buildNightDisplay(from windowStart: Date, to windowEnd: Date, referenceDate: Date) async throws -> SleepNightDisplay? {
        let sleepSamples = try await fetchSleepSamples(start: windowStart, end: windowEnd)
        let (_, asleepSamples, stageSamples) = categorizeSamples(sleepSamples)
        guard !asleepSamples.isEmpty else { return nil }

        let sleepStart = asleepSamples.map(\.startDate).min() ?? windowStart
        let sleepEnd = asleepSamples.map(\.endDate).max() ?? windowEnd
        let totalAsleep = asleepSamples.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) / 60 }

        let awake = durationForStage(stageSamples, stage: .awake) ?? 0
        let rem = durationForStage(stageSamples, stage: .asleepREM) ?? 0
        let core = durationForStage(stageSamples, stage: .asleepCore) ?? 0
        let deep = durationForStage(stageSamples, stage: .asleepDeep) ?? 0

        let unspecified = durationForStage(stageSamples, stage: .asleepUnspecified) ?? 0
        let coreWithUnspecified = core + unspecified

        let stageDurations = SleepStageDurations(
            awake: awake,
            rem: rem,
            core: coreWithUnspecified,
            deep: deep
        )

        let stageSegments = buildStageSegments(from: stageSamples)

        return SleepNightDisplay(
            date: referenceDate,
            sleepStart: sleepStart,
            sleepEnd: sleepEnd,
            totalAsleepMinutes: totalAsleep,
            stageDurations: stageDurations,
            stageSegments: stageSegments
        )
    }

    private func buildStageSegments(from samples: [HKCategorySample]) -> [SleepStageSegment] {
        samples.compactMap { sample -> SleepStageSegment? in
            guard let value = HKCategoryValueSleepAnalysis(rawValue: sample.value) else { return nil }
            let stage: SleepStage?
            switch value {
            case .awake: stage = .awake
            case .asleepREM: stage = .rem
            case .asleepCore: stage = .core
            case .asleepDeep: stage = .deep
            case .asleepUnspecified: stage = .core
            default: stage = nil
            }
            guard let s = stage else { return nil }
            return SleepStageSegment(start: sample.startDate, end: sample.endDate, stage: s)
        }
    }

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
                staged.append(sample)
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
}
