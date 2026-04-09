import Foundation

final class HouseholdService {
    private let api = APIClient.shared
    private let auth = AuthService.shared

    static let shared = HouseholdService()
    private init() {}

    private func token() async throws -> String {
        try await auth.getValidAccessToken()
    }

    // MARK: - Tasks

    func fetchTasks(category: MaintenanceCategory? = nil, completed: Bool? = nil, page: Int = 1) async throws -> PaginatedResponse<HouseholdTask> {
        var query = "?page=\(page)&limit=20"
        if let category { query += "&category=\(category.rawValue)" }
        if let completed { query += "&completed=\(completed)" }
        return try await api.get(
            path: "/v1/household/tasks\(query)",
            token: try await token(),
            as: PaginatedResponse<HouseholdTask>.self
        )
    }

    func createTask(_ request: CreateHouseholdTaskRequest) async throws -> HouseholdTask {
        try await api.post(
            path: "/v1/household/tasks",
            body: request,
            token: try await token(),
            as: HouseholdTask.self
        )
    }

    func fetchUpcomingTasks() async throws -> UpcomingTasksResponse {
        try await api.get(
            path: "/v1/household/tasks/upcoming",
            token: try await token(),
            as: UpcomingTasksResponse.self
        )
    }

    func completeTask(id: String) async throws -> HouseholdTask {
        struct Empty: Encodable {}
        return try await api.post(
            path: "/v1/household/tasks/\(id)/complete",
            body: Empty(),
            token: try await token(),
            as: HouseholdTask.self
        )
    }

    func skipTask(id: String, reason: String) async throws -> HouseholdTask {
        try await api.post(
            path: "/v1/household/tasks/\(id)/skip",
            body: SkipTaskRequest(reason: reason),
            token: try await token(),
            as: HouseholdTask.self
        )
    }

    // MARK: - Templates

    func fetchTemplates() async throws -> [MaintenanceTaskTemplate] {
        try await api.get(
            path: "/v1/household/templates",
            token: try await token(),
            as: [MaintenanceTaskTemplate].self
        )
    }

    func createTemplate(_ request: CreateTemplateRequest) async throws -> MaintenanceTaskTemplate {
        try await api.post(
            path: "/v1/household/templates",
            body: request,
            token: try await token(),
            as: MaintenanceTaskTemplate.self
        )
    }

    func updateTemplate(id: String, _ request: UpdateTemplateRequest) async throws -> MaintenanceTaskTemplate {
        try await api.put(
            path: "/v1/household/templates/\(id)",
            body: request,
            token: try await token(),
            as: MaintenanceTaskTemplate.self
        )
    }

    func deleteTemplate(id: String) async throws {
        try await api.delete(path: "/v1/household/templates/\(id)", token: try await token())
    }

    // MARK: - Cleaner Rotation

    func fetchCleanerRotation() async throws -> CleanerRotationState {
        try await api.get(
            path: "/v1/household/cleaner-rotation",
            token: try await token(),
            as: CleanerRotationState.self
        )
    }

    func updateCleanerRotation(_ request: UpdateCleanerRotationRequest) async throws -> CleanerRotationState {
        try await api.put(
            path: "/v1/household/cleaner-rotation",
            body: request,
            token: try await token(),
            as: CleanerRotationState.self
        )
    }

    // MARK: - Property Profile

    func fetchPropertyProfile() async throws -> PropertyProfile {
        try await api.get(
            path: "/v1/household/property",
            token: try await token(),
            as: PropertyProfile.self
        )
    }

    func updatePropertyProfile(_ request: UpdatePropertyProfileRequest) async throws -> PropertyProfile {
        try await api.put(
            path: "/v1/household/property",
            body: request,
            token: try await token(),
            as: PropertyProfile.self
        )
    }
}
