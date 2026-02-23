import Foundation

struct Exercise: Codable, Identifiable {
	let id: String
	let name: String
	let slug: String
	let muscles: [String]
	let bodyParts: [String]
	let resistanceType: String
	let measurementType: String
	let steps: [String]
	let videoUrl: String?
	let category: String?
	let isGlobal: Bool
	var isFavorite: Bool?
}

struct ExerciseSet: Codable {
	var setNumber: Int
	var weight: Double?
	var reps: Int?
	var minutes: Double?
	var seconds: Double?
	var miles: Double?
	var kilometers: Double?
	var meters: Double?
}
