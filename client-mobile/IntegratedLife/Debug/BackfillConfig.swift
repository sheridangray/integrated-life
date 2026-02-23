#if DEBUG
import HealthKit

struct BackfillConfig {
	let label: String
	let quantityTypeId: HKQuantityTypeIdentifier?
	let unit: HKUnit
	let valueRange: ClosedRange<Double>
	let samplesPerDay: Int
	let hourStart: Int
	let hourEnd: Int

	// Only types that third-party apps are allowed to write.
	// Apple Watch-exclusive types (e.g. appleExerciseTime, restingHeartRate,
	// walkingHeartRateAverage, walkingAsymmetry, running metrics, cycling metrics,
	// atrialFibrillationBurden, wristTemperature) are excluded.
	static let all: [BackfillConfig] = [
		// Cardiovascular
		BackfillConfig(label: "Heart Rate", quantityTypeId: .heartRate,
			unit: HKUnit.count().unitDivided(by: .minute()),
			valueRange: 58...95, samplesPerDay: 8, hourStart: 6, hourEnd: 23),
		BackfillConfig(label: "HRV", quantityTypeId: .heartRateVariabilitySDNN,
			unit: .secondUnit(with: .milli),
			valueRange: 25...75, samplesPerDay: 2, hourStart: 7, hourEnd: 22),
		BackfillConfig(label: "VO2 Max", quantityTypeId: .vo2Max,
			unit: HKUnit.literUnit(with: .milli).unitDivided(by: .gramUnit(with: .kilo).unitMultiplied(by: .minute())),
			valueRange: 38...48, samplesPerDay: 1, hourStart: 12, hourEnd: 12),
		BackfillConfig(label: "Blood Oxygen", quantityTypeId: .oxygenSaturation,
			unit: .percent(),
			valueRange: 0.95...0.99, samplesPerDay: 2, hourStart: 8, hourEnd: 22),
		BackfillConfig(label: "Respiratory Rate", quantityTypeId: .respiratoryRate,
			unit: HKUnit.count().unitDivided(by: .minute()),
			valueRange: 12...18, samplesPerDay: 2, hourStart: 7, hourEnd: 22),

		// Activity & Movement
		BackfillConfig(label: "Active Energy", quantityTypeId: .activeEnergyBurned,
			unit: .kilocalorie(),
			valueRange: 200...600, samplesPerDay: 1, hourStart: 20, hourEnd: 22),
		BackfillConfig(label: "Basal Energy", quantityTypeId: .basalEnergyBurned,
			unit: .kilocalorie(),
			valueRange: 1500...1800, samplesPerDay: 1, hourStart: 23, hourEnd: 23),
		BackfillConfig(label: "Steps", quantityTypeId: .stepCount,
			unit: .count(),
			valueRange: 4000...12000, samplesPerDay: 1, hourStart: 20, hourEnd: 22),
		BackfillConfig(label: "Distance", quantityTypeId: .distanceWalkingRunning,
			unit: .mile(),
			valueRange: 1.5...5.5, samplesPerDay: 1, hourStart: 20, hourEnd: 22),
		BackfillConfig(label: "Flights Climbed", quantityTypeId: .flightsClimbed,
			unit: .count(),
			valueRange: 3...15, samplesPerDay: 1, hourStart: 18, hourEnd: 20),
		BackfillConfig(label: "Swimming Strokes", quantityTypeId: .swimmingStrokeCount,
			unit: .count(),
			valueRange: 200...800, samplesPerDay: 1, hourStart: 17, hourEnd: 18),

		// Sleep & Recovery
		BackfillConfig(label: "Body Temperature", quantityTypeId: .bodyTemperature,
			unit: .degreeFahrenheit(),
			valueRange: 97.2...98.8, samplesPerDay: 1, hourStart: 7, hourEnd: 8),

		// Environment & Safety
		BackfillConfig(label: "Environmental Sound", quantityTypeId: .environmentalAudioExposure,
			unit: .decibelAWeightedSoundPressureLevel(),
			valueRange: 40...78, samplesPerDay: 3, hourStart: 8, hourEnd: 22),
		BackfillConfig(label: "Headphone Audio", quantityTypeId: .headphoneAudioExposure,
			unit: .decibelAWeightedSoundPressureLevel(),
			valueRange: 55...82, samplesPerDay: 1, hourStart: 9, hourEnd: 18),
	]
}
#endif
