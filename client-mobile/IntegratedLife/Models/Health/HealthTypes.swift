import Foundation

enum BodyPart: String, Codable, CaseIterable, Identifiable {
	case arms = "Arms"
	case back = "Back"
	case chest = "Chest"
	case core = "Core"
	case lowerBody = "Lower Body"
	case shoulders = "Shoulders"

	var id: String { rawValue }
}

enum MuscleGroup: String, Codable, CaseIterable, Identifiable {
	case abdominals = "Abdominals"
	case abductors = "Abductors"
	case adductors = "Adductors"
	case biceps = "Biceps"
	case brachioradialis = "Brachioradialis"
	case calves = "Calves"
	case deltoids = "Deltoids"
	case glutes = "Glutes"
	case hamstrings = "Hamstrings"
	case hipFlexors = "Hip Flexors"
	case latissimusDorsi = "Latissimus Dorsi"
	case obliques = "Obliques"
	case pectoralis = "Pectoralis"
	case quadriceps = "Quadriceps"
	case rotatorCuff = "Rotator Cuff"
	case serratus = "Serratus"
	case tibialisAnterior = "Tibialis Anterior"
	case trapezius = "Trapezius"
	case triceps = "Triceps"
	case wristFlexors = "Wrist Flexors"

	var id: String { rawValue }
}

enum ResistanceType: String, Codable, CaseIterable, Identifiable {
	case weightsFree = "Weights (Free)"
	case weightsMachine = "Weights (Machine)"
	case cables = "Cables"
	case bodyweight = "Bodyweight"
	case resistanceBands = "Resistance Bands"
	case cardioMachine = "Cardio / Machine"
	case weightedBodyweight = "Weighted Bodyweight"

	var id: String { rawValue }
}

enum MeasurementType: String, Codable, CaseIterable, Identifiable {
	case strength = "Strength"
	case timeBased = "Time-Based"
	case distanceBased = "Distance-Based"
	case repOnly = "Rep-Only"

	var id: String { rawValue }

	var commonUIFields: [String] {
		switch self {
		case .strength: return ["weight", "reps"]
		case .timeBased: return ["minutes", "seconds"]
		case .distanceBased: return ["miles", "kilometers", "meters"]
		case .repOnly: return ["reps", "sets"]
		}
	}
}

enum WorkoutVisibility: String, Codable, CaseIterable {
	case global = "Global"
	case user = "User"
}

struct AIInsight: Codable {
	let insight: String?
	let generatedAt: String?
}

struct WorkoutInsightResponse: Codable {
	let exerciseInsights: [ExerciseInsightItem]
	let overallInsight: String?
	let generatedAt: String?
}

struct ExerciseInsightItem: Codable, Identifiable {
	let exerciseId: String
	let exerciseName: String
	let insight: String

	var id: String { exerciseId }
}

struct WorkoutHistoryDetail: Codable {
	let type: String
	let id: String
	let workoutName: String
	let date: String
	let startTime: String
	let endTime: String
	let completedAll: Bool
	let exercises: [WorkoutHistoryExercise]
	let workoutInsight: WorkoutInsightResponse?
}

struct WorkoutHistoryExercise: Codable, Identifiable {
	let id: String
	let exerciseName: String
	let date: String
	let resistanceType: String
	let sets: [ExerciseSet]
	let notes: String?
}
