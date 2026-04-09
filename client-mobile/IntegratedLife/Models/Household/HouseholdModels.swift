import Foundation

// MARK: - Enums

enum MaintenanceFrequency: String, Codable, CaseIterable, Identifiable {
    case monthly, quarterly, biannual, annual
    var id: String { rawValue }

    var displayName: String { rawValue.capitalized }

    var color: String {
        switch self {
        case .monthly: return "green"
        case .quarterly: return "blue"
        case .biannual: return "orange"
        case .annual: return "purple"
        }
    }

    var monthsInterval: Int {
        switch self {
        case .monthly: return 1
        case .quarterly: return 3
        case .biannual: return 6
        case .annual: return 12
        }
    }
}

enum MaintenanceCategory: String, Codable, CaseIterable, Identifiable {
    case hvac, appliances, plumbing, surfaces, safety, cleaning
    var id: String { rawValue }

    var displayName: String { rawValue.uppercased() == "hvac" ? "HVAC" : rawValue.capitalized }

    var icon: String {
        switch self {
        case .hvac: return "fan"
        case .appliances: return "refrigerator"
        case .plumbing: return "drop"
        case .surfaces: return "square.grid.3x3"
        case .safety: return "shield.checkered"
        case .cleaning: return "sparkles"
        }
    }
}

enum DIYVsHire: String, Codable, CaseIterable, Identifiable {
    case diy, hire, optional
    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .diy: return "DIY"
        case .hire: return "Hire Pro"
        case .optional: return "Optional"
        }
    }

    var icon: String {
        switch self {
        case .diy: return "wrench.and.screwdriver"
        case .hire: return "person.badge.shield.checkmark"
        case .optional: return "questionmark.circle"
        }
    }
}

enum PropertyType: String, Codable, CaseIterable, Identifiable {
    case condo, house, apartment
    var id: String { rawValue }
    var displayName: String { rawValue.capitalized }
}

// MARK: - Maintenance Task Template

struct MaintenanceTaskTemplate: Codable, Identifiable, Equatable {
    let id: String
    let title: String
    let description: String
    let frequency: MaintenanceFrequency
    let category: MaintenanceCategory
    let estimatedMinutes: Int
    let diyVsHire: DIYVsHire
    var cost: Double?
    var notes: String?
    var isActive: Bool
}

struct CreateTemplateRequest: Encodable {
    let title: String
    let description: String
    let frequency: MaintenanceFrequency
    let category: MaintenanceCategory
    let estimatedMinutes: Int
    let diyVsHire: DIYVsHire
    var cost: Double?
    var notes: String?
}

struct UpdateTemplateRequest: Encodable {
    var title: String?
    var description: String?
    var frequency: MaintenanceFrequency?
    var category: MaintenanceCategory?
    var estimatedMinutes: Int?
    var diyVsHire: DIYVsHire?
    var cost: Double?
    var notes: String?
    var isActive: Bool?
}

// MARK: - Household Task

struct HouseholdTask: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    var templateId: String?
    let title: String
    let description: String
    let category: MaintenanceCategory
    let dueDate: String
    var completedAt: String?
    var skippedAt: String?
    var skippedReason: String?
    var syncedToTimeTask: Bool
    var timeTaskId: String?
    let createdAt: String
    let updatedAt: String

    var isCompleted: Bool { completedAt != nil }
    var isSkipped: Bool { skippedAt != nil }
    var isDone: Bool { isCompleted || isSkipped }

    var dueDateParsed: Date? {
        Self.dateFormatter.date(from: dueDate)
    }

    var isOverdue: Bool {
        guard let due = dueDateParsed else { return false }
        return due < Calendar.current.startOfDay(for: Date()) && !isDone
    }

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()
}

struct CreateHouseholdTaskRequest: Encodable {
    let title: String
    let description: String
    let category: MaintenanceCategory
    let dueDate: String
    var templateId: String?
}

struct SkipTaskRequest: Encodable {
    let reason: String
}

// MARK: - Cleaner Rotation

struct CleanerRotationEntry: Codable, Identifiable, Equatable {
    var id: Int { index }
    let index: Int
    let area: String
    let details: String
}

struct CleanerRotationState: Codable, Equatable {
    let nextRotationIndex: Int
    let nextRunDate: String
    let rotation: [CleanerRotationEntry]

    var currentEntry: CleanerRotationEntry? {
        rotation.first { $0.index == nextRotationIndex }
    }

    var nextRunDateParsed: Date? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.date(from: nextRunDate)
    }

    var daysUntilNext: Int? {
        guard let next = nextRunDateParsed else { return nil }
        return Calendar.current.dateComponents([.day], from: Calendar.current.startOfDay(for: Date()), to: next).day
    }
}

struct UpdateCleanerRotationRequest: Encodable {
    var nextRotationIndex: Int?
    var nextRunDate: String?
}

// MARK: - Property Profile

struct PropertyProfile: Codable, Equatable {
    let id: String
    let userId: String
    var name: String
    var type: PropertyType
    var hasHOA: Bool
    var hoaCoversExterior: Bool
    var appliances: [String]?
    var systems: [String]?
    let lastUpdated: String
}

struct UpdatePropertyProfileRequest: Encodable {
    var name: String?
    var type: PropertyType?
    var hasHOA: Bool?
    var hoaCoversExterior: Bool?
    var appliances: [String]?
    var systems: [String]?
}

// MARK: - Upcoming Tasks Response

struct UpcomingTasksResponse: Codable {
    let tasks: [HouseholdTask]
    let cleanerRotation: CleanerRotationState?
}
