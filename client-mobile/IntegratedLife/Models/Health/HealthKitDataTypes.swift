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

// MARK: - Aggregation Strategy

enum AggregationStrategy {
	case cumulative
	case average
	case sparse
	case categorical
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
	let aggregation: AggregationStrategy
	let lowerIsBetter: Bool

	init(
		id: String, name: String, icon: String, unit: String,
		category: HealthKitCategory,
		quantityTypeId: HKQuantityTypeIdentifier? = nil,
		categoryTypeId: HKCategoryTypeIdentifier? = nil,
		hkUnit: HKUnit? = nil,
		aggregation: AggregationStrategy = .average,
		lowerIsBetter: Bool = false
	) {
		self.id = id; self.name = name; self.icon = icon; self.unit = unit
		self.category = category; self.quantityTypeId = quantityTypeId
		self.categoryTypeId = categoryTypeId; self.hkUnit = hkUnit
		self.aggregation = aggregation; self.lowerIsBetter = lowerIsBetter
	}

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
			category: .cardiovascular, quantityTypeId: .heartRate,
			hkUnit: HKUnit.count().unitDivided(by: .minute()), aggregation: .average
		),
		HealthKitDataType(
			id: "restingHeartRate", name: "Resting Heart Rate", icon: "heart", unit: "bpm",
			category: .cardiovascular, quantityTypeId: .restingHeartRate,
			hkUnit: HKUnit.count().unitDivided(by: .minute()), aggregation: .average, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "walkingHeartRateAverage", name: "Walking Heart Rate Avg", icon: "figure.walk", unit: "bpm",
			category: .cardiovascular, quantityTypeId: .walkingHeartRateAverage,
			hkUnit: HKUnit.count().unitDivided(by: .minute()), aggregation: .average
		),
		HealthKitDataType(
			id: "heartRateVariability", name: "Heart Rate Variability", icon: "waveform.path.ecg", unit: "ms",
			category: .cardiovascular, quantityTypeId: .heartRateVariabilitySDNN,
			hkUnit: .secondUnit(with: .milli), aggregation: .average
		),
		HealthKitDataType(
			id: "vo2Max", name: "VO2 Max", icon: "lungs.fill", unit: "mL/kg/min",
			category: .cardiovascular, quantityTypeId: .vo2Max,
			hkUnit: HKUnit.literUnit(with: .milli).unitDivided(by: .gramUnit(with: .kilo).unitMultiplied(by: .minute())),
			aggregation: .sparse
		),
		HealthKitDataType(
			id: "bloodOxygenSaturation", name: "Blood Oxygen", icon: "drop.fill", unit: "%",
			category: .cardiovascular, quantityTypeId: .oxygenSaturation,
			hkUnit: .percent(), aggregation: .average
		),
		HealthKitDataType(
			id: "respiratoryRate", name: "Respiratory Rate", icon: "wind", unit: "br/min",
			category: .cardiovascular, quantityTypeId: .respiratoryRate,
			hkUnit: HKUnit.count().unitDivided(by: .minute()), aggregation: .average
		),
		HealthKitDataType(
			id: "cardioRecovery", name: "Cardio Recovery", icon: "arrow.down.heart.fill", unit: "bpm",
			category: .cardiovascular, quantityTypeId: .heartRateRecoveryOneMinute,
			hkUnit: HKUnit.count().unitDivided(by: .minute()), aggregation: .sparse
		),
		HealthKitDataType(
			id: "atrialFibrillationBurden", name: "AFib Burden", icon: "waveform.path.ecg.rectangle", unit: "%",
			category: .cardiovascular, quantityTypeId: .atrialFibrillationBurden,
			hkUnit: .percent(), aggregation: .average, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "irregularHeartRhythm", name: "Irregular Heart Rhythm", icon: "exclamationmark.heart.fill", unit: "",
			category: .cardiovascular, categoryTypeId: .irregularHeartRhythmEvent,
			aggregation: .categorical, lowerIsBetter: true
		),
	]

	// MARK: - Activity & Movement

	private static let activityMovementTypes: [HealthKitDataType] = [
		HealthKitDataType(
			id: "activeEnergy", name: "Active Energy", icon: "flame.fill", unit: "kcal",
			category: .activityMovement, quantityTypeId: .activeEnergyBurned,
			hkUnit: .kilocalorie(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "basalEnergy", name: "Basal Energy", icon: "flame", unit: "kcal",
			category: .activityMovement, quantityTypeId: .basalEnergyBurned,
			hkUnit: .kilocalorie(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "exerciseTime", name: "Exercise Time", icon: "timer", unit: "min",
			category: .activityMovement, quantityTypeId: .appleExerciseTime,
			hkUnit: .minute(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "standTime", name: "Stand Time", icon: "figure.stand", unit: "min",
			category: .activityMovement, quantityTypeId: .appleStandTime,
			hkUnit: .minute(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "steps", name: "Steps", icon: "figure.walk", unit: "steps",
			category: .activityMovement, quantityTypeId: .stepCount,
			hkUnit: .count(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "distanceWalkingRunning", name: "Walking + Running Distance", icon: "figure.walk.motion", unit: "mi",
			category: .activityMovement, quantityTypeId: .distanceWalkingRunning,
			hkUnit: .mile(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "walkingSpeed", name: "Walking Speed", icon: "speedometer", unit: "mph",
			category: .activityMovement, quantityTypeId: .walkingSpeed,
			hkUnit: HKUnit.mile().unitDivided(by: .hour()), aggregation: .average
		),
		HealthKitDataType(
			id: "walkingAsymmetry", name: "Walking Asymmetry", icon: "figure.walk", unit: "%",
			category: .activityMovement, quantityTypeId: .walkingAsymmetryPercentage,
			hkUnit: .percent(), aggregation: .average, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "walkingDoubleSupport", name: "Double Support Time", icon: "figure.walk", unit: "%",
			category: .activityMovement, quantityTypeId: .walkingDoubleSupportPercentage,
			hkUnit: .percent(), aggregation: .average
		),
		HealthKitDataType(
			id: "stairAscentSpeed", name: "Stair Ascent Speed", icon: "figure.stairs", unit: "ft/s",
			category: .activityMovement, quantityTypeId: .stairAscentSpeed,
			hkUnit: HKUnit.foot().unitDivided(by: .second()), aggregation: .sparse
		),
		HealthKitDataType(
			id: "flightsClimbed", name: "Flights Climbed", icon: "figure.stairs", unit: "flights",
			category: .activityMovement, quantityTypeId: .flightsClimbed,
			hkUnit: .count(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "runningPower", name: "Running Power", icon: "figure.run", unit: "W",
			category: .activityMovement, quantityTypeId: .runningPower,
			hkUnit: .watt(), aggregation: .sparse
		),
		HealthKitDataType(
			id: "runningGroundContactTime", name: "Ground Contact Time", icon: "figure.run", unit: "ms",
			category: .activityMovement, quantityTypeId: .runningGroundContactTime,
			hkUnit: .secondUnit(with: .milli), aggregation: .sparse, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "runningVerticalOscillation", name: "Vertical Oscillation", icon: "figure.run", unit: "cm",
			category: .activityMovement, quantityTypeId: .runningVerticalOscillation,
			hkUnit: .meterUnit(with: .centi), aggregation: .sparse, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "runningStrideLength", name: "Stride Length", icon: "figure.run", unit: "m",
			category: .activityMovement, quantityTypeId: .runningStrideLength,
			hkUnit: .meter(), aggregation: .sparse
		),
		HealthKitDataType(
			id: "cyclingSpeed", name: "Cycling Speed", icon: "bicycle", unit: "mph",
			category: .activityMovement, quantityTypeId: .cyclingSpeed,
			hkUnit: HKUnit.mile().unitDivided(by: .hour()), aggregation: .sparse
		),
		HealthKitDataType(
			id: "cyclingPower", name: "Cycling Power", icon: "bicycle", unit: "W",
			category: .activityMovement, quantityTypeId: .cyclingPower,
			hkUnit: .watt(), aggregation: .sparse
		),
		HealthKitDataType(
			id: "swimmingStrokeCount", name: "Swimming Strokes", icon: "figure.pool.swim", unit: "strokes",
			category: .activityMovement, quantityTypeId: .swimmingStrokeCount,
			hkUnit: .count(), aggregation: .cumulative
		),
	]

	// MARK: - Sleep & Recovery

	private static let sleepRecoveryTypes: [HealthKitDataType] = [
		HealthKitDataType(
			id: "wristTemperature", name: "Wrist Temperature", icon: "thermometer.medium", unit: "°C",
			category: .sleepRecovery, quantityTypeId: .appleSleepingWristTemperature,
			hkUnit: .degreeCelsius(), aggregation: .average
		),
		HealthKitDataType(
			id: "bodyTemperature", name: "Body Temperature", icon: "thermometer", unit: "°F",
			category: .sleepRecovery, quantityTypeId: .bodyTemperature,
			hkUnit: .degreeFahrenheit(), aggregation: .average
		),
	]

	// MARK: - Stress & Mindfulness

	private static let stressMindfulnessTypes: [HealthKitDataType] = [
		HealthKitDataType(
			id: "mindfulSession", name: "Mindful Minutes", icon: "brain.head.profile", unit: "min",
			category: .stressMindfulness, categoryTypeId: .mindfulSession,
			aggregation: .categorical
		),
	]

	// MARK: - Environment & Safety

	private static let environmentSafetyTypes: [HealthKitDataType] = [
		HealthKitDataType(
			id: "environmentalAudioExposure", name: "Environmental Sound", icon: "speaker.wave.2.fill", unit: "dB",
			category: .environmentSafety, quantityTypeId: .environmentalAudioExposure,
			hkUnit: .decibelAWeightedSoundPressureLevel(), aggregation: .average, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "headphoneAudioExposure", name: "Headphone Audio", icon: "headphones", unit: "dB",
			category: .environmentSafety, quantityTypeId: .headphoneAudioExposure,
			hkUnit: .decibelAWeightedSoundPressureLevel(), aggregation: .average, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "handwashingEvent", name: "Handwashing", icon: "hands.sparkles.fill", unit: "",
			category: .environmentSafety, categoryTypeId: .handwashingEvent,
			aggregation: .categorical
		),
	]
}
