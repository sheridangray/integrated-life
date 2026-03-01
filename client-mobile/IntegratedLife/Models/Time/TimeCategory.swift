import SwiftUI

enum MetaBucket: String, CaseIterable, Codable {
	case vitality = "Vitality"
	case productivity = "Productivity"
	case obligations = "Obligations"
	case connection = "Connection"
	case enrichment = "Enrichment"
	case logistics = "Logistics"

	var color: Color {
		switch self {
		case .vitality: return .purple
		case .productivity: return .blue
		case .obligations: return .orange
		case .connection: return .pink
		case .enrichment: return .green
		case .logistics: return .gray
		}
	}

	var icon: String {
		switch self {
		case .vitality: return "heart.fill"
		case .productivity: return "briefcase.fill"
		case .obligations: return "checklist"
		case .connection: return "person.2.fill"
		case .enrichment: return "sparkles"
		case .logistics: return "car.fill"
		}
	}
}

struct TimeCategory: Identifiable {
	let id: Int
	let name: String
	let metaBucket: MetaBucket
	let description: String

	static let all: [TimeCategory] = [
		TimeCategory(id: 1, name: "Sleep & Self-Care", metaBucket: .vitality, description: "Sleeping, grooming, showering, hygiene, and medical self-care."),
		TimeCategory(id: 2, name: "Eating & Drinking", metaBucket: .vitality, description: "Meals, snacks, coffee breaks, and functional dining."),
		TimeCategory(id: 3, name: "Paid Work", metaBucket: .productivity, description: "Main job, side hustles, work meetings, and work-related travel."),
		TimeCategory(id: 4, name: "Education", metaBucket: .productivity, description: "Attending classes, homework, research, and self-taught skill building."),
		TimeCategory(id: 5, name: "Home Maintenance", metaBucket: .obligations, description: "Cleaning, laundry, home repairs, gardening, and pet care."),
		TimeCategory(id: 6, name: "Family Care", metaBucket: .obligations, description: "Physical care for children, helping with homework, and elder care in-home."),
		TimeCategory(id: 7, name: "Community Care", metaBucket: .obligations, description: "Helping neighbors, friends, or relatives living in other households."),
		TimeCategory(id: 8, name: "Errands & Shopping", metaBucket: .obligations, description: "Grocery shopping, errands, banking, and professional appointments."),
		TimeCategory(id: 9, name: "Socializing", metaBucket: .connection, description: "Face-to-face time with friends, phone calls, and attending social events."),
		TimeCategory(id: 10, name: "Fitness & Hobbies", metaBucket: .enrichment, description: "Gym, sports, reading for pleasure, gaming, and active hobbies."),
		TimeCategory(id: 11, name: "Spirit & Civic", metaBucket: .enrichment, description: "Meditation, religious services, prayer, and voting/civic engagement."),
		TimeCategory(id: 12, name: "Volunteering", metaBucket: .connection, description: "Unpaid work for organizations, food banks, or community service."),
		TimeCategory(id: 13, name: "Commuting", metaBucket: .logistics, description: "Driving, public transit time, and travel for errands/work."),
		TimeCategory(id: 14, name: "Digital Leisure", metaBucket: .enrichment, description: "Browsing the web, non-social app usage, and entertainment screen time."),
		TimeCategory(id: 15, name: "Buffer / Misc", metaBucket: .logistics, description: "Uncategorized gaps, transition time, and miscellaneous tasks.")
	]

	static func find(byId id: Int) -> TimeCategory? {
		all.first { $0.id == id }
	}

	static func grouped() -> [(bucket: MetaBucket, categories: [TimeCategory])] {
		MetaBucket.allCases.compactMap { bucket in
			let cats = all.filter { $0.metaBucket == bucket }
			return cats.isEmpty ? nil : (bucket: bucket, categories: cats)
		}
	}
}
