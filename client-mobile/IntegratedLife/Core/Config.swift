import Foundation

enum Config {
	private static let info = Bundle.main.infoDictionary

	/// Production server URL. Used when running on a physical device (localhost is unreachable from device).
	private static let productionBaseURL = "https://integrated-life.onrender.com"

	static var apiBaseURL: String {
		#if targetEnvironment(simulator)
		return (info?["API_BASE_URL"] as? String) ?? "http://localhost:3001"
		#else
		// Physical device: always use production server (localhost is unreachable from device)
		return productionBaseURL
		#endif
	}

	static var googleClientID: String {
		(info?["GOOGLE_CLIENT_ID"] as? String) ?? ""
	}

	/// Web client ID used as serverClientID so GIDSignIn returns a serverAuthCode.
	static var googleServerClientID: String {
		(info?["GOOGLE_SERVER_CLIENT_ID"] as? String) ?? ""
	}
}
