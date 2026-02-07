import Foundation

final class APIClient {
	static let shared = APIClient()

	private let baseURL: String
	private let session: URLSession

	init(baseURL: String = Config.apiBaseURL) {
		self.baseURL = baseURL
		self.session = URLSession.shared
	}

	func get<T: Decodable>(path: String, token: String? = nil, as type: T.Type) async throws -> T {
		try await request(method: "GET", path: path, body: nil as Data?, token: token, as: type)
	}

	func post<T: Decodable, B: Encodable>(path: String, body: B, token: String? = nil, as type: T.Type) async throws -> T {
		let data = try JSONEncoder().encode(body)
		return try await request(method: "POST", path: path, body: data, token: token, as: type)
	}

	private func request<T: Decodable>(
		method: String,
		path: String,
		body: Data?,
		token: String?,
		as type: T.Type
	) async throws -> T {
		guard let url = URL(string: baseURL + path) else {
			throw APIError.invalidURL
		}

		var request = URLRequest(url: url)
		request.httpMethod = method
		request.setValue("application/json", forHTTPHeaderField: "Content-Type")
		request.setValue("application/json", forHTTPHeaderField: "Accept")

		if let token {
			request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
		}

		request.httpBody = body

		let (data, response) = try await session.data(for: request)

		guard let httpResponse = response as? HTTPURLResponse else {
			throw APIError.invalidResponse
		}

		if httpResponse.statusCode == 401 {
			throw AuthError.notAuthenticated
		}

		guard (200 ..< 300).contains(httpResponse.statusCode) else {
			if let errorBody = try? JSONDecoder().decode(APIErrorBody.self, from: data) {
				throw APIError.serverError(errorBody.error.message)
			}
			throw APIError.serverError(HTTPURLResponse.localizedString(forStatusCode: httpResponse.statusCode))
		}

		return try JSONDecoder().decode(T.self, from: data)
	}
}

struct APIErrorBody: Decodable {
	let error: ErrorDetail
}

struct ErrorDetail: Decodable {
	let message: String
}

enum APIError: Error {
	case invalidURL
	case invalidResponse
	case serverError(String)
}
