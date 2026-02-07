import Foundation

enum Config {
	private static let info = Bundle.main.infoDictionary

	static var apiBaseURL: String {
		(info?["API_BASE_URL"] as? String) ?? "http://localhost:3001"
	}

	static var googleClientID: String {
		(info?["GOOGLE_CLIENT_ID"] as? String) ?? ""
	}
}
