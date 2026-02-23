import Foundation

final class SleepService {
    private let api = APIClient.shared
    private let auth = AuthService.shared

    static let shared = SleepService()
    private init() {}

    private func token() async throws -> String {
        try await auth.getValidAccessToken()
    }

    func submitNightlyMetrics(_ metrics: NightlyMetrics) async throws -> SleepScoreResponse {
        try await api.post(
            path: "/v1/sleep/nightly",
            body: metrics,
            token: try await token(),
            as: SleepScoreResponse.self
        )
    }

    func getTodayScores() async throws -> SleepScoreResponse? {
        try await api.get(
            path: "/v1/sleep/today",
            token: try await token(),
            as: SleepScoreResponse?.self
        )
    }

    func getScoreHistory(days: Int = 14) async throws -> [SleepScoreResponse] {
        try await api.get(
            path: "/v1/sleep/history?days=\(days)",
            token: try await token(),
            as: [SleepScoreResponse].self
        )
    }
}
