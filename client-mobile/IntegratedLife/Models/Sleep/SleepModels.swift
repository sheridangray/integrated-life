import Foundation

// MARK: - Device Tier

enum DeviceTier: String, Codable {
    case a = "A"
    case b = "B"
    case c = "C"
}

// MARK: - Action Bucket

enum ActionBucket: String, Codable {
    case pushHard = "push_hard"
    case maintain
    case activeRecovery = "active_recovery"
    case fullRest = "full_rest"

    var displayLabel: String {
        switch self {
        case .pushHard: return "Push Hard"
        case .maintain: return "Maintain"
        case .activeRecovery: return "Active Recovery"
        case .fullRest: return "Full Rest"
        }
    }

    var colorName: String {
        switch self {
        case .pushHard: return "green"
        case .maintain: return "blue"
        case .activeRecovery: return "orange"
        case .fullRest: return "red"
        }
    }
}

// MARK: - Nightly Metrics (POST body)

struct NightlyMetrics: Codable {
    let date: String
    let sleepStartTime: String
    let sleepEndTime: String
    let sleepMidpoint: String
    let totalAsleepDuration: Double
    let totalInBedDuration: Double
    let deepDuration: Double?
    let remDuration: Double?
    let coreDuration: Double?
    let wasoDuration: Double?
    let awakeAfterOnsetMinutes: Double?
    let awakeningCountOver2m: Int?
    let longestAwakeEpisodeMinutes: Double?
    let minHrValue: Double
    let minHrTimestamp: String
    let avgHr: Double
    let hrvMean: Double?
    let respiratoryRateMean: Double?
    let temperatureDeviation: Double?
    let deviceTier: DeviceTier
}

// MARK: - Component Breakdowns

struct SleepBreakdown: Codable {
    let durationAdequacy: Int
    let consistency: Int
    let fragmentation: Int
    let recoveryPhysiology: Int
    let structure: Int?
    let timingAlignment: Int
    let preliminaryScore: Int
    let penaltyTotal: Int
    let penaltyFlags: [String]
}

struct ReadinessBreakdown: Codable {
    let sleepScoreContrib: Int
    let hrvDeviation: Int
    let rhrDeviation: Int
    let recoveryIndex: Int
    let hrvTrendSlope: Int
    let sleepDebt: Int
    let activityLoad: Int
}

// MARK: - Sleep Score Response

// MARK: - Contributor Detail (from server)

struct ContributorSubComponent: Codable {
    let name: String
    let rawValue: Double
    let score: Int
    let baselineMean: Double?
    let baselineStd: Double?
    let zScore: Double?
}

struct ContributorDetailField: Codable {
    let label: String
    let value: String
}

struct ContributorDetail: Codable {
    let key: String
    let score: Int
    let rawValue: Double
    let rawLabel: String
    let baselineMean: Double?
    let baselineStd: Double?
    let zScore: Double?
    let formula: String
    let weight: Double
    let detailFields: [ContributorDetailField]?
    let subComponents: [ContributorSubComponent]?
    let aiAssessment: String?
}

// MARK: - Sleep Score Response

struct SleepScoreResponse: Codable, Identifiable {
    let id: String
    let date: String
    let sleepScore: Int
    let readinessScore: Int
    let sleepBreakdown: SleepBreakdown
    let readinessBreakdown: ReadinessBreakdown
    let interactionFlags: [String]
    let interactionFactor: Double
    let actionBucket: ActionBucket
    let modelVersion: String
    let calibrationPhase: Int
    let deviceTier: DeviceTier
}
