import Foundation
import Security

enum KeychainError: Error {
	case duplicateItem
	case itemNotFound
	case unexpectedStatus(OSStatus)
}

final class KeychainService {
	static let shared = KeychainService()

	private let serviceName = "com.integratedlife.app"

	private init() {}

	func set(_ value: Data, forKey key: String) throws {
		let query: [String: Any] = [
			kSecClass as String: kSecClassGenericPassword,
			kSecAttrService as String: serviceName,
			kSecAttrAccount as String: key
		]

		SecItemDelete(query as CFDictionary)

		var newQuery = query
		newQuery[kSecValueData as String] = value

		let status = SecItemAdd(newQuery as CFDictionary, nil)

		guard status == errSecSuccess else {
			throw KeychainError.unexpectedStatus(status)
		}
	}

	func set(_ value: String, forKey key: String) throws {
		guard let data = value.data(using: .utf8) else { return }
		try set(data, forKey: key)
	}

	func getData(forKey key: String) throws -> Data? {
		let query: [String: Any] = [
			kSecClass as String: kSecClassGenericPassword,
			kSecAttrService as String: serviceName,
			kSecAttrAccount as String: key,
			kSecReturnData as String: true,
			kSecMatchLimit as String: kSecMatchLimitOne
		]

		var result: AnyObject?
		let status = SecItemCopyMatching(query as CFDictionary, &result)

		if status == errSecItemNotFound {
			return nil
		}

		guard status == errSecSuccess else {
			throw KeychainError.unexpectedStatus(status)
		}

		return result as? Data
	}

	func getString(forKey key: String) throws -> String? {
		guard let data = try getData(forKey: key) else { return nil }
		return String(data: data, encoding: .utf8)
	}

	func delete(forKey key: String) throws {
		let query: [String: Any] = [
			kSecClass as String: kSecClassGenericPassword,
			kSecAttrService as String: serviceName,
			kSecAttrAccount as String: key
		]

		let status = SecItemDelete(query as CFDictionary)

		if status != errSecSuccess && status != errSecItemNotFound {
			throw KeychainError.unexpectedStatus(status)
		}
	}
}
