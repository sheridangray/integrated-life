import Foundation
import HealthKit

// MARK: - Categories

enum HealthKitCategory: String, CaseIterable, Identifiable {
	case cardiovascular = "Cardiovascular"
	case activityMovement = "Activity & Movement"
	case sleepRecovery = "Sleep & Recovery"
	case stressMindfulness = "Stress & Mindfulness"
	case environmentSafety = "Environment & Safety"

	var id: String { rawValue }

	var icon: String {
		switch self {
		case .cardiovascular: return "heart.fill"
		case .activityMovement: return "figure.run"
		case .sleepRecovery: return "bed.double.fill"
		case .stressMindfulness: return "brain.head.profile"
		case .environmentSafety: return "ear.fill"
		}
	}
}

// MARK: - Data Type

struct HealthKitDataType: Identifiable, Hashable {
	let id: String
	let name: String
	let icon: String
	let unit: String
	let category: HealthKitCategory
	let quantityTypeId: HKQuantityTypeIdentifier?
	let categoryTypeId: HKCategoryTypeIdentifier?
	let hkUnit: HKUnit?

	var hkObjectType: HKObjectType? {
		if let qid = quantityTypeId {
			return HKQuantityType.quantityType(forIdentifier: qid)
		}
		if let cid = categoryTypeId {
			return HKCategoryType.categoryType(forIdentifier: cid)
		}
		return nil
	}

	var isQuantityType: Bool { quantityTypeId != nil }
	var isCategoryType: Bool { categoryTypeId != nil }

	static func == (lhs: HealthKitDataType, rhs: HealthKitDataType) -> Bool {
		lhs.id == rhs.id
	}

	func hash(into hasher: inout Hasher) {
		hasher.combine(id)
	}
}

// MARK: - Catalog

extension HealthKitDataType {

	static let catalog: [HealthKitDataType] = {
		var types: [HealthKitDataType] = []
		types.append(contentsOf: cardiovascularTypes)
		types.append(contentsOf: activityMovementTypes)
		types.append(contentsOf: sleepRecoveryTypes)
		types.append(contentsOf: stressMindfulnessTypes)
		types.append(contentsOf: environmentSafetyTypes)
		return types
	}()

	static let allReadTypes: Set<HKObjectType> = {
		var set = Set<HKObjectType>()
		for type in catalog {
			if let obj = type.hkObjectType {
				set.insert(obj)
			}
		}
		if let ecg = ecgType { set.insert(ecg) }
		set.insert(HKObjectType.workoutType())
		return set
	}()

	static var byCategory: [(category: HealthKitCategory, types: [HealthKitDataType])] {
		HealthKitCategory.allCases.compactMap { cat in
			let filtered = catalog.filter { $0.category == cat }
			return filtered.isEmpty ? nil : (category: cat, types: filtered)
		}
	}

	static var monitorableTypes: [HealthKitDataType] {
		catalog.filter { $0.quantityTypeId != nil || $0.categoryTypeId != nil }
	}

	// MARK: - ECG (special type, not fetchable via standard queries)

	private static var ecgType: HKObjectType? {
		HKObjectType.electrocardiogramType()
	}

	// MARK: - Cardiovascular

	private static let cardiovascularTypes: [HealthKitDataType] = [
		HealthKitDataType(
			id: "heartRate", name: "Heart Rate", icon: "heart.fill", unit: "bpm",
			category: .cardiovascular, quantityTypeId: .heartRate, categoryTypeId: nil,
			hkUnit: HKUnit.count().unitDivided(by: .minute())
		),
		HealthKitDataType(
			id: "restingHeartRate", name: "Resting Heart Rate", icon: "heart", unit: "bpm",
			category: .cardiovascular, quantityTypeId: .restingHeartRate, categoryTypeId: nil,
			hkUnit: HKUnit.count().unitDivided(by: .minute())
		),
		HealthKitDataType(
			id: "walkingHeartRateAverage", name: "Walking Heart Rate Avg", icon: "figure.walk", unit: "bpm",
			category: .cardiovascular, quantityTypeId: .walkingHeartRateAverage, categoryTypeId: nil,
			hkUnit: HKUnit.count().unitDivided(by: .minute())
		),
		HealthKitDataType(
			id: "heartRateVariability", name: "Heart Rate Variability", icon: "waveform.path.ecg", unit: "ms",
			category: .cardiovascular, quantityTypeId: .heartRateVariabilitySDNN, categoryTypeId: nil,
			hkUnit: .secondUnit(with: .milli)
		),
		HealthKitDataType(
			id: "vo2Max", name: "VO2 Max", icon: "lungs.fill", unit: "mL/kg/min",
			category: .cardiovascular, quantityTypeId: .vo2Max, categoryTypeId: nil,
			hkUnit: HKUnit.literUnit(with: .milli).unitDivided(by: .gramUnit(with: .kilo).unitMultiplied(by: .minute()))
		),
		HealthKitDataType(
			id: "bloodOxygenSaturation", name: "Blood Oxygen", icon: "drop.fill", unit: "%",
			category: .cardiovascular, quantityTypeId: .oxygenSaturation, categoryTypeId: nil,
			hkUnit: .percent()
		),
		HealthKitDataType(
			id: "respiratoryRate", name: "Respiratory Rate", icon: "wind", unit: "br/min",
			category: .cardiovascular, quantityTypeId: .respiratoryRate, categoryTypeId: nil,
			hkUnit: HKUnit.count().unitDivided(by: .minute())
		),
		HealthKitDataType(
			id: "cardioRecovery", name: "Cardio Recovery", icon: "arrow.down.heart.fill", unit: "bpm",
			category: .cardiovascular, quantityTypeId: .heartRateRecoveryOneMinute, categoryTypeId: nil,
			hkUnit: HKUnit.count().unitDivided(by: .minute())
		),
		HealthKitDataType(
			id: "atrialFibrillationBurden", name: "AFib Burden", icon: "waveform.path.ecg.rectangle", unit: "%",
			category: .cardiovascular, quantityTypeId: .atrialFibrillationBurden, categoryTypeId: nil,
			hkUnit: .percent()
		),
		HealthKitDataType(
			id: "irregularHeartRhythm", name: "Irregular Heart Rhythm", icon: "exclamationmark.heart.fill", unit: "",
			category: .cardiovascular, quantityTypeId: nil, categoryTypeId: .irregularHeartRhythmEvent,
			hkUnit: nil
		),
	]

	// MARK: - Activity & Movement

	private static let activityMovementTypes: [HealthKitDataType] = [
		HealthKitDataType(
			id: "activeEnergy", name: "Active Energy", icon: "flame.fill", unit: "kcal",
			category: .activityMovement, quantityTypeId: .activeEnergyBurned, categoryTypeId: nil,
			hkUnit: .kilocalorie()
		),
		HealthKitDataType(
			id: "basalEnergy", name: "Basal Energy", icon: "flame", unit: "kcal",
			category: .activityMovement, quantityTypeId: .basalEnergyBurned, categoryTypeId: nil,
			hkUnit: .kilocalorie()
		),
		HealthKitDataType(
			id: "exerciseTime", name: "Exercise Time", icon: "timer", unit: "min",
			category: .activityMovement, quantityTypeId: .appleExerciseTime, categoryTypeId: nil,
			hkUnit: .minute()
		),
		HealthKitDataType(
			id: "standTime", name: "Stand Time", icon: "figure.stand", unit: "min",
			category: .activityMovement, quantityTypeId: .appleStandTime, categoryTypeId: nil,
			hkUnit: .minute()
		),
		HealthKitDataType(
			id: "steps", name: "Steps", icon: "figure.walk", unit: "steps",
			category: .activityMovement, quantityTypeId: .stepCount, categoryTypeId: nil,
			hkUnit: .count()
		),
		HealthKitDataType(
			id: "distanceWalkingRunning", name: "Walking + Running Distance", icon: "figure.walk.motion", unit: "mi",
			category: .activityMovement, quantityTypeId: .distanceWalkingRunning, categoryTypeId: nil,
			hkUnit: .mile()
		),
		HealthKitDataType(
			id: "walkingSpeed", name: "Walking Speed", icon: "speedometer", unit: "mph",
			category: .activityMovement, quantityTypeId: .walkingSpeed, categoryTypeId: nil,
			hkUnit: HKUnit.mile().unitDivided(by: .hour())
		),
		HealthKitDataType(
			id: "walkingAsymmetry", name: "Walking Asymmetry", icon: "figure.walk", unit: "%",
			category: .activityMovement, quantityTypeId: .walkingAsymmetryPercentage, categoryTypeId: nil,
			hkUnit: .percent()
		),
		HealthKitDataType(
			id: "walkingDoubleSupport", name: "Double Support Time", icon: "figure.walk", unit: "%",
			category: .activityMovement, quantityTypeId: .walkingDoubleSupportPercentage, categoryTypeId: nil,
			hkUnit: .percent()
		),
		HealthKitDataType(
			id: "stairAscentSpeed", name: "Stair Ascent Speed", icon: "figure.stairs", unit: "ft/s",
			category: .activityMovement, quantityTypeId: .stairAscentSpeed, categoryTypeId: nil,
			hkUnit: HKUnit.foot().unitDivided(by: .second())
		),
		HealthKitDataType(
			id: "flightsClimbed", name: "Flights Climbed", icon: "figure.stairs", unit: "flights",
			category: .activityMovement, quantityTypeId: .flightsClimbed, categoryTypeId: nil,
			hkUnit: .count()
		),
		HealthKitDataType(
			id: "runningPower", name: "Running Power", icon: "figure.run", unit: "W",
			category: .activityMovement, quantityTypeId: .runningPower, categoryTypeId: nil,
			hkUnit: .watt()
		),
		HealthKitDataType(
			id: "runningGroundContactTime", name: "Ground Contact Time", icon: "figure.run", unit: "ms",
			category: .activityMovement, quantityTypeId: .runningGroundContactTime, categoryTypeId: nil,
			hkUnit: .secondUnit(with: .milli)
		),
		HealthKitDataType(
			id: "runningVerticalOscillation", name: "Vertical Oscillation", icon: "figure.run", unit: "cm",
			category: .activityMovement, quantityTypeId: .runningVerticalOscillation, categoryTypeId: nil,
			hkUnit: .meterUnit(with: .centi)
		),
		HealthKitDataType(
			id: "runningStrideLength", name: "Stride Length", icon: "figure.run", unit: "m",
			category: .activityMovement, quantityTypeId: .runningStrideLength, categoryTypeId: nil,
			hkUnit: .meter()
		),
		HealthKitDataType(
			id: "cyclingSpeed", name: "Cycling Speed", icon: "bicycle", unit: "mph",
			category: .activityMovement, quantityTypeId: .cyclingSpeed, categoryTypeId: nil,
			hkUnit: HKUnit.mile().unitDivided(by: .hour())
		),
		HealthKitDataType(
			id: "cyclingPower", name: "Cycling Power", icon: "bicycle", unit: "W",
			category: .activityMovement, quantityTypeId: .cyclingPower, categoryTypeId: nil,
			hkUnit: .watt()
		),
		HealthKitDataType(
			id: "swimmingStrokeCount", name: "Swimming Strokes", icon: "figure.pool.swim", unit: "strokes",
			category: .activityMovement, quantityTypeId: .swimmingStrokeCount, categoryTypeId: nil,
			hkUnit: .count()
		),
	]

	// MARK: - Sleep & Recovery

	private static let sleepRecoveryTypes: [HealthKitDataType] = [
		HealthKitDataType(
			id: "sleepAnalysis", name: "Sleep Analysis", icon: "bed.double.fill", unit: "",
			category: .sleepRecovery, quantityTypeId: nil, categoryTypeId: .sleepAnalysis,
			hkUnit: nil
		),
		HealthKitDataType(
			id: "wristTemperature", name: "Wrist Temperature", icon: "thermometer.medium", unit: "°C",
			category: .sleepRecovery, quantityTypeId: .appleSleepingWristTemperature, categoryTypeId: nil,
			hkUnit: .degreeCelsius()
		),
		HealthKitDataType(
			id: "bodyTemperature", name: "Body Temperature", icon: "thermometer", unit: "°F",
			category: .sleepRecovery, quantityTypeId: .bodyTemperature, categoryTypeId: nil,
			hkUnit: .degreeFahrenheit()
		),
	]

	// MARK: - Stress & Mindfulness

	private static let stressMindfulnessTypes: [HealthKitDataType] = [
		HealthKitDataType(
			id: "mindfulSession", name: "Mindful Minutes", icon: "brain.head.profile", unit: "min",
			category: .stressMindfulness, quantityTypeId: nil, categoryTypeId: .mindfulSession,
			hkUnit: nil
		),
	]

	// MARK: - Environment & Safety

	private static let environmentSafetyTypes: [HealthKitDataType] = [
		HealthKitDataType(
			id: "environmentalAudioExposure", name: "Environmental Sound", icon: "speaker.wave.2.fill", unit: "dB",
			category: .environmentSafety, quantityTypeId: .environmentalAudioExposure, categoryTypeId: nil,
			hkUnit: .decibelAWeightedSoundPressureLevel()
		),
		HealthKitDataType(
			id: "headphoneAudioExposure", name: "Headphone Audio", icon: "headphones", unit: "dB",
			category: .environmentSafety, quantityTypeId: .headphoneAudioExposure, categoryTypeId: nil,
			hkUnit: .decibelAWeightedSoundPressureLevel()
		),
		HealthKitDataType(
			id: "handwashingEvent", name: "Handwashing", icon: "hands.sparkles.fill", unit: "",
			category: .environmentSafety, quantityTypeId: nil, categoryTypeId: .handwashingEvent,
			hkUnit: nil
		),
	]
}
