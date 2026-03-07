import Foundation
import HealthKit

// MARK: - Categories

enum HealthKitCategory: String, CaseIterable, Identifiable {
	case bodyComposition = "Body Composition"
	case cardiovascular = "Cardiovascular"
	case activityMovement = "Activity & Movement"
	case nutrition = "Nutrition"
	case sleepRecovery = "Sleep & Recovery"
	case stressMindfulness = "Stress & Mindfulness"
	case environmentSafety = "Environment & Safety"

	var id: String { rawValue }

	var icon: String {
		switch self {
		case .bodyComposition: return "figure.arms.open"
		case .cardiovascular: return "heart.fill"
		case .activityMovement: return "figure.run"
		case .nutrition: return "fork.knife"
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

typealias DerivedComputation = (_ values: [String: Double], _ gender: String?) -> Double?

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
	let derivedFrom: [String]?
	let derivation: DerivedComputation?

	init(
		id: String, name: String, icon: String, unit: String,
		category: HealthKitCategory,
		quantityTypeId: HKQuantityTypeIdentifier? = nil,
		categoryTypeId: HKCategoryTypeIdentifier? = nil,
		hkUnit: HKUnit? = nil,
		aggregation: AggregationStrategy = .average,
		lowerIsBetter: Bool = false,
		derivedFrom: [String]? = nil,
		derivation: DerivedComputation? = nil
	) {
		self.id = id; self.name = name; self.icon = icon; self.unit = unit
		self.category = category; self.quantityTypeId = quantityTypeId
		self.categoryTypeId = categoryTypeId; self.hkUnit = hkUnit
		self.aggregation = aggregation; self.lowerIsBetter = lowerIsBetter
		self.derivedFrom = derivedFrom; self.derivation = derivation
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
	var isDerived: Bool { derivedFrom != nil }

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
		types.append(contentsOf: bodyCompositionTypes)
		types.append(contentsOf: cardiovascularTypes)
		types.append(contentsOf: activityMovementTypes)
		types.append(contentsOf: nutritionTypes)
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
		catalog.filter { $0.quantityTypeId != nil || $0.categoryTypeId != nil || $0.isDerived }
	}

	// MARK: - ECG (special type, not fetchable via standard queries)

	private static var ecgType: HKObjectType? {
		HKObjectType.electrocardiogramType()
	}

	// MARK: - Body Composition

	private static let bodyCompositionTypes: [HealthKitDataType] = [
		HealthKitDataType(
			id: "bodyMass", name: "Body Weight", icon: "scalemass.fill", unit: "lb",
			category: .bodyComposition, quantityTypeId: .bodyMass,
			hkUnit: .pound(), aggregation: .sparse
		),
		HealthKitDataType(
			id: "bodyMassIndex", name: "BMI", icon: "number.square.fill", unit: "kg/m²",
			category: .bodyComposition, quantityTypeId: .bodyMassIndex,
			hkUnit: .count(), aggregation: .sparse
		),
		HealthKitDataType(
			id: "bodyFatPercentage", name: "Body Fat", icon: "percent", unit: "%",
			category: .bodyComposition, quantityTypeId: .bodyFatPercentage,
			hkUnit: .percent(), aggregation: .sparse, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "leanBodyMass", name: "Lean Body Mass", icon: "figure.strengthtraining.traditional", unit: "lb",
			category: .bodyComposition, quantityTypeId: .leanBodyMass,
			hkUnit: .pound(), aggregation: .sparse
		),
		HealthKitDataType(
			id: "height", name: "Height", icon: "ruler.fill", unit: "in",
			category: .bodyComposition, quantityTypeId: .height,
			hkUnit: .inch(), aggregation: .sparse
		),
		HealthKitDataType(
			id: "fatMass", name: "Fat Mass", icon: "scalemass", unit: "lb",
			category: .bodyComposition, aggregation: .sparse, lowerIsBetter: true,
			derivedFrom: ["bodyMass", "bodyFatPercentage"],
			derivation: { values, _ in
				guard let mass = values["bodyMass"], let fatPct = values["bodyFatPercentage"] else { return nil }
				let pct = fatPct <= 1.0 ? fatPct : fatPct / 100.0
				return mass * pct
			}
		),
		HealthKitDataType(
			id: "ffmi", name: "FFMI", icon: "figure.strengthtraining.functional", unit: "kg/m²",
			category: .bodyComposition, aggregation: .sparse,
			derivedFrom: ["leanBodyMass", "height"],
			derivation: { values, _ in
				guard let lbmLb = values["leanBodyMass"], let heightIn = values["height"], heightIn > 0 else { return nil }
				let lbmKg = lbmLb * 0.453592
				let heightM = heightIn * 0.0254
				return lbmKg / (heightM * heightM)
			}
		),
		HealthKitDataType(
			id: "estimatedBodyWater", name: "Est. Body Water", icon: "drop.triangle.fill", unit: "%",
			category: .bodyComposition, aggregation: .sparse,
			derivedFrom: ["leanBodyMass", "bodyMass"],
			derivation: { values, _ in
				guard let lbm = values["leanBodyMass"], let mass = values["bodyMass"], mass > 0 else { return nil }
				return (lbm * 0.73) / mass
			}
		),
		HealthKitDataType(
			id: "estimatedBoneMass", name: "Est. Bone Mass", icon: "figure.stand", unit: "lb",
			category: .bodyComposition, aggregation: .sparse,
			derivedFrom: ["leanBodyMass"],
			derivation: { values, gender in
				guard let lbm = values["leanBodyMass"] else { return nil }
				let factor = gender == "female" ? 0.12 : 0.15
				return lbm * factor
			}
		),
		HealthKitDataType(
			id: "estimatedMuscleMass", name: "Est. Muscle Mass", icon: "figure.highintensity.intervaltraining", unit: "lb",
			category: .bodyComposition, aggregation: .sparse,
			derivedFrom: ["leanBodyMass"],
			derivation: { values, gender in
				guard let lbm = values["leanBodyMass"] else { return nil }
				let boneFactor = gender == "female" ? 0.12 : 0.15
				return lbm * (1.0 - boneFactor)
			}
		),
	]

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

	// MARK: - Nutrition

	private static let nutritionTypes: [HealthKitDataType] = [
		HealthKitDataType(
			id: "dietaryEnergyConsumed", name: "Calories Consumed", icon: "flame.fill", unit: "kcal",
			category: .nutrition, quantityTypeId: .dietaryEnergyConsumed,
			hkUnit: .kilocalorie(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryProtein", name: "Protein", icon: "fish.fill", unit: "g",
			category: .nutrition, quantityTypeId: .dietaryProtein,
			hkUnit: .gram(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryFatTotal", name: "Total Fat", icon: "drop.fill", unit: "g",
			category: .nutrition, quantityTypeId: .dietaryFatTotal,
			hkUnit: .gram(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryCarbohydrates", name: "Carbohydrates", icon: "leaf.fill", unit: "g",
			category: .nutrition, quantityTypeId: .dietaryCarbohydrates,
			hkUnit: .gram(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryFiber", name: "Fiber", icon: "leaf", unit: "g",
			category: .nutrition, quantityTypeId: .dietaryFiber,
			hkUnit: .gram(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietarySugar", name: "Sugar", icon: "cube.fill", unit: "g",
			category: .nutrition, quantityTypeId: .dietarySugar,
			hkUnit: .gram(), aggregation: .cumulative, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "dietarySodium", name: "Sodium", icon: "circle.grid.cross.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietarySodium,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "dietaryWater", name: "Water", icon: "drop.fill", unit: "mL",
			category: .nutrition, quantityTypeId: .dietaryWater,
			hkUnit: .literUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryFatSaturated", name: "Saturated Fat", icon: "drop.halffull", unit: "g",
			category: .nutrition, quantityTypeId: .dietaryFatSaturated,
			hkUnit: .gram(), aggregation: .cumulative, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "dietaryFatMonounsaturated", name: "Monounsaturated Fat", icon: "drop", unit: "g",
			category: .nutrition, quantityTypeId: .dietaryFatMonounsaturated,
			hkUnit: .gram(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryFatPolyunsaturated", name: "Polyunsaturated Fat", icon: "drop", unit: "g",
			category: .nutrition, quantityTypeId: .dietaryFatPolyunsaturated,
			hkUnit: .gram(), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryCholesterol", name: "Cholesterol", icon: "circle.grid.2x2.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryCholesterol,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative, lowerIsBetter: true
		),
		HealthKitDataType(
			id: "dietaryVitaminA", name: "Vitamin A", icon: "pill.fill", unit: "mcg",
			category: .nutrition, quantityTypeId: .dietaryVitaminA,
			hkUnit: .gramUnit(with: .micro), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryVitaminB6", name: "Vitamin B6", icon: "pill.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryVitaminB6,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryVitaminB12", name: "Vitamin B12", icon: "pill.fill", unit: "mcg",
			category: .nutrition, quantityTypeId: .dietaryVitaminB12,
			hkUnit: .gramUnit(with: .micro), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryVitaminC", name: "Vitamin C", icon: "pill.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryVitaminC,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryVitaminD", name: "Vitamin D", icon: "sun.max.fill", unit: "mcg",
			category: .nutrition, quantityTypeId: .dietaryVitaminD,
			hkUnit: .gramUnit(with: .micro), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryVitaminE", name: "Vitamin E", icon: "pill.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryVitaminE,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryVitaminK", name: "Vitamin K", icon: "pill.fill", unit: "mcg",
			category: .nutrition, quantityTypeId: .dietaryVitaminK,
			hkUnit: .gramUnit(with: .micro), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryThiamin", name: "Thiamin (B1)", icon: "pill.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryThiamin,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryRiboflavin", name: "Riboflavin (B2)", icon: "pill.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryRiboflavin,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryNiacin", name: "Niacin (B3)", icon: "pill.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryNiacin,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryFolate", name: "Folate", icon: "pill.fill", unit: "mcg",
			category: .nutrition, quantityTypeId: .dietaryFolate,
			hkUnit: .gramUnit(with: .micro), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryPantothenicAcid", name: "Pantothenic Acid (B5)", icon: "pill.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryPantothenicAcid,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryBiotin", name: "Biotin", icon: "pill.fill", unit: "mcg",
			category: .nutrition, quantityTypeId: .dietaryBiotin,
			hkUnit: .gramUnit(with: .micro), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryCalcium", name: "Calcium", icon: "circle.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryCalcium,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryIron", name: "Iron", icon: "circle.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryIron,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryMagnesium", name: "Magnesium", icon: "circle.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryMagnesium,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryManganese", name: "Manganese", icon: "circle.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryManganese,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryPhosphorus", name: "Phosphorus", icon: "circle.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryPhosphorus,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryPotassium", name: "Potassium", icon: "circle.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryPotassium,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryZinc", name: "Zinc", icon: "circle.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryZinc,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietarySelenium", name: "Selenium", icon: "circle.fill", unit: "mcg",
			category: .nutrition, quantityTypeId: .dietarySelenium,
			hkUnit: .gramUnit(with: .micro), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryCopper", name: "Copper", icon: "circle.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryCopper,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryChromium", name: "Chromium", icon: "circle.fill", unit: "mcg",
			category: .nutrition, quantityTypeId: .dietaryChromium,
			hkUnit: .gramUnit(with: .micro), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryMolybdenum", name: "Molybdenum", icon: "circle.fill", unit: "mcg",
			category: .nutrition, quantityTypeId: .dietaryMolybdenum,
			hkUnit: .gramUnit(with: .micro), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryChloride", name: "Chloride", icon: "circle.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryChloride,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryIodine", name: "Iodine", icon: "circle.fill", unit: "mcg",
			category: .nutrition, quantityTypeId: .dietaryIodine,
			hkUnit: .gramUnit(with: .micro), aggregation: .cumulative
		),
		HealthKitDataType(
			id: "dietaryCaffeine", name: "Caffeine", icon: "cup.and.saucer.fill", unit: "mg",
			category: .nutrition, quantityTypeId: .dietaryCaffeine,
			hkUnit: .gramUnit(with: .milli), aggregation: .cumulative
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
