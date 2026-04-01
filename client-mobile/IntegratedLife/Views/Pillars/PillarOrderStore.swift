import Foundation

/// Persists pillar card order in UserDefaults (`pillars.order` key).
enum PillarOrderStore {
	private static let key = "pillars.order"

	/// Loads saved order; merges with `Pillar.allCases` so new pillars appear and unknown ids are dropped.
	static func loadOrder() -> [Pillar] {
		guard let raw = UserDefaults.standard.array(forKey: key) as? [String] else {
			return Array(Pillar.allCases)
		}
		var seen = Set<String>()
		var ordered: [Pillar] = []
		for s in raw {
			guard !seen.contains(s), let p = Pillar.allCases.first(where: { $0.rawValue == s }) else { continue }
			seen.insert(s)
			ordered.append(p)
		}
		for p in Pillar.allCases where !seen.contains(p.rawValue) {
			ordered.append(p)
		}
		return ordered
	}

	static func saveOrder(_ pillars: [Pillar]) {
		UserDefaults.standard.set(pillars.map(\.rawValue), forKey: key)
	}
}
