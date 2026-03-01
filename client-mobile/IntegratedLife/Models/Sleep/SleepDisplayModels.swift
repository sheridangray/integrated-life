import Foundation

enum SleepStage: String, CaseIterable {
    case awake
    case rem
    case core
    case deep

    var displayName: String {
        switch self {
        case .awake: return "Awake"
        case .rem: return "REM"
        case .core: return "Core"
        case .deep: return "Deep"
        }
    }
}

struct SleepStageDurations {
    let awake: Double
    let rem: Double
    let core: Double
    let deep: Double

    var totalAsleep: Double { rem + core + deep }

    var totalWithAwake: Double { awake + rem + core + deep }
}

struct SleepStageSegment: Identifiable {
    let id = UUID()
    let start: Date
    let end: Date
    let stage: SleepStage
}

struct SleepNightDisplay: Identifiable {
    let id = UUID()
    let date: Date
    let sleepStart: Date
    let sleepEnd: Date
    let totalAsleepMinutes: Double
    let stageDurations: SleepStageDurations
    let stageSegments: [SleepStageSegment]
}

enum SleepPeriod: String, CaseIterable, Identifiable {
    case day = "D"
    case week = "W"
    case month = "M"
    case sixMonths = "6M"

    var id: String { rawValue }
}
