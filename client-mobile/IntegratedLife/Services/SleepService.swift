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

    private func percentEncodeQuery(_ s: String) -> String {
        var allowed = CharacterSet.urlQueryAllowed
        allowed.remove(charactersIn: "&=?+")
        return s.addingPercentEncoding(withAllowedCharacters: allowed) ?? s
    }

    func getContributorDetail(date: String, key: String) async throws -> ContributorDetail {
        let q = "date=\(percentEncodeQuery(date))&key=\(percentEncodeQuery(key))"
        return try await api.get(
            path: "/v1/sleep/contributor-detail?\(q)",
            token: try await token(),
            as: ContributorDetail.self
        )
    }

    func getContributorDetailAssessment(date: String, key: String) async throws -> ContributorDetailAssessmentResponse {
        let q = "date=\(percentEncodeQuery(date))&key=\(percentEncodeQuery(key))"
        return try await api.get(
            path: "/v1/sleep/contributor-detail/assessment?\(q)",
            token: try await token(),
            as: ContributorDetailAssessmentResponse.self
        )
    }
}
