import Foundation

// MARK: - Health Range

struct HealthRange {
	let low: Double
	let high: Double
	let lowLabel: String
	let highLabel: String
	let normalLabel: String

	func status(for value: Double) -> HealthStatus {
		if value < low { return .low }
		if value > high { return .high }
		return .normal
	}
}

enum HealthStatus {
	case low, normal, high
}

// MARK: - Descriptions & Ranges

extension HealthKitDataType {

	var description: String {
		Self.descriptions[id] ?? "Health metric tracked via Apple HealthKit."
	}

	func personalizedRange(gender: String?, age: Int?) -> HealthRange? {
		if let rangeFunc = Self.personalizedRanges[id] {
			return rangeFunc(gender, age)
		}
		return Self.staticRanges[id]
	}

	func statusColor(for value: Double, gender: String?, age: Int?) -> HealthStatus {
		guard let range = personalizedRange(gender: gender, age: age) else { return .normal }
		let adjusted = unit == "%" && value <= 1.0 ? value * 100 : value
		return range.status(for: adjusted)
	}

	// MARK: - Descriptions

	private static let descriptions: [String: String] = [
		"heartRate": "Your heart rate measures how many times your heart beats per minute. It fluctuates throughout the day based on activity, stress, and rest. A typical resting range is 60-100 bpm, though athletes may be lower.",
		"restingHeartRate": "Resting heart rate is measured when you've been still and calm for a sustained period. It's one of the best indicators of cardiovascular fitness. Lower values generally indicate better fitness. Typical range is 60-100 bpm.",
		"walkingHeartRateAverage": "Your average heart rate while walking reflects cardiovascular efficiency during light activity. Lower values at a given pace suggest better aerobic fitness. Typical range is 90-130 bpm.",
		"heartRateVariability": "HRV measures the variation in time between heartbeats (in milliseconds). Higher HRV generally indicates better cardiovascular fitness and stress resilience. It naturally decreases with age.",
		"vo2Max": "VO2 Max estimates the maximum amount of oxygen your body can use during exercise. It's the gold standard for aerobic fitness. Values vary significantly by age and gender. Higher is better.",
		"bloodOxygenSaturation": "Blood oxygen (SpO2) measures the percentage of oxygen carried by your red blood cells. Normal values are 95-100%. Values below 95% may warrant medical attention.",
		"respiratoryRate": "Respiratory rate is the number of breaths you take per minute. Normal range for adults at rest is 12-20 breaths/min. Elevated rates can indicate stress, illness, or poor fitness.",
		"cardioRecovery": "Cardio recovery measures how much your heart rate drops in the first minute after intense exercise. A drop of 12+ bpm is normal; greater drops indicate better cardiovascular fitness.",
		"atrialFibrillationBurden": "AFib burden estimates the percentage of time your heart shows signs of atrial fibrillation. Lower is better. Any sustained elevation should be discussed with your doctor.",
		"irregularHeartRhythm": "Irregular heart rhythm notifications indicate episodes where your heart rhythm appeared irregular. Occasional notifications may be benign, but recurring ones should be discussed with your doctor.",
		"activeEnergy": "Active energy is the number of kilocalories you burn through movement and exercise (excluding your basal metabolic rate). Typical daily targets range from 300-600+ kcal depending on activity level.",
		"basalEnergy": "Basal energy is the calories your body burns at rest to maintain basic functions like breathing and circulation. It varies by age, gender, weight, and body composition.",
		"exerciseTime": "Exercise time tracks minutes of activity at or above a brisk walk intensity. The WHO recommends at least 150 minutes of moderate exercise per week (about 22 min/day).",
		"standTime": "Stand time tracks minutes in which you stood and moved at least once. Standing regularly throughout the day helps reduce the health risks associated with prolonged sitting.",
		"steps": "Daily step count tracks your overall walking activity. A common target is 10,000 steps/day, though research shows health benefits start as low as 7,000 steps/day.",
		"distanceWalkingRunning": "Total distance covered by walking and running throughout the day. A typical range for moderately active adults is 3-6 miles per day.",
		"walkingSpeed": "Walking speed is a functional health marker that can indicate overall fitness and mobility. Average adult walking speed is 2.5-3.5 mph. It tends to decrease with age.",
		"walkingAsymmetry": "Walking asymmetry measures the percentage difference in step timing between your left and right legs. Values under 10% are typical. Higher values may indicate injury or imbalance.",
		"walkingDoubleSupport": "Double support time is the percentage of your walking stride during which both feet are on the ground. Typical values are 20-40%. Higher values may indicate reduced balance or stability.",
		"stairAscentSpeed": "Stair ascent speed measures how quickly you climb stairs. It reflects lower-body strength and cardiovascular fitness. Typical values range from 1.0-2.0 ft/s.",
		"flightsClimbed": "A flight of stairs is counted as approximately 10 feet of elevation gain. Climbing stairs is excellent cardiovascular exercise and builds lower-body strength.",
		"runningPower": "Running power (watts) measures the total mechanical output while running. It accounts for pace, elevation, and form. Higher power at a given pace indicates more effort.",
		"runningGroundContactTime": "Ground contact time measures how long your foot stays on the ground with each stride. Shorter contact times (200-300ms) are typical of faster, more efficient runners.",
		"runningVerticalOscillation": "Vertical oscillation measures how much your body bounces up and down while running. Lower values (6-10 cm) indicate more efficient forward motion.",
		"runningStrideLength": "Stride length is the distance covered in a single step while running. It varies with height, pace, and fitness. Optimal stride length balances efficiency and speed.",
		"cyclingSpeed": "Cycling speed reflects your pace during rides. Average recreational cycling speed is 10-15 mph. Terrain, wind, and fitness level all affect speed.",
		"cyclingPower": "Cycling power (watts) is the most objective measure of cycling effort. It's independent of wind, terrain, and other external factors.",
		"swimmingStrokeCount": "Swimming stroke count tracks the number of arm strokes during swim workouts. Fewer strokes per length generally indicates better technique and efficiency.",
		"wristTemperature": "Wrist temperature is measured during sleep and reflects your baseline body temperature. Small deviations (±0.5°C) are normal. Larger shifts may correlate with illness or hormonal changes.",
		"bodyTemperature": "Body temperature is a vital sign reflecting your core thermal state. Normal oral temperature is around 98.6°F (37°C), with typical variation of ±1°F throughout the day.",
		"mindfulSession": "Mindful minutes track time spent in guided or timed meditation and breathing exercises. Regular mindfulness practice is associated with reduced stress, improved focus, and better emotional regulation.",
		"environmentalAudioExposure": "Environmental sound levels measure ambient noise in decibels. Prolonged exposure above 80 dB can damage hearing over time. WHO recommends keeping levels below 70 dB.",
		"headphoneAudioExposure": "Headphone audio levels track the volume of sound delivered through your headphones. Levels above 80 dB for extended periods can cause hearing damage. Keep levels below 75 dB for safe listening.",
		"handwashingEvent": "Handwashing events are detected by Apple Watch. Regular handwashing for 20+ seconds is one of the most effective ways to prevent the spread of illness.",
	]

	// MARK: - Static Ranges (not gender/age dependent)

	private static let staticRanges: [String: HealthRange] = [
		"heartRate": HealthRange(low: 40, high: 120, lowLabel: "Unusually low", highLabel: "Elevated", normalLabel: "Normal"),
		"walkingHeartRateAverage": HealthRange(low: 70, high: 140, lowLabel: "Low", highLabel: "Elevated", normalLabel: "Normal"),
		"bloodOxygenSaturation": HealthRange(low: 95, high: 100, lowLabel: "Low — consult doctor", highLabel: "Normal", normalLabel: "Healthy"),
		"respiratoryRate": HealthRange(low: 12, high: 20, lowLabel: "Below normal", highLabel: "Elevated", normalLabel: "Normal"),
		"cardioRecovery": HealthRange(low: 12, high: 200, lowLabel: "Below average recovery", highLabel: "Normal", normalLabel: "Good recovery"),
		"atrialFibrillationBurden": HealthRange(low: 0, high: 1, lowLabel: "Normal", highLabel: "Elevated — consult doctor", normalLabel: "Minimal"),
		"activeEnergy": HealthRange(low: 100, high: 1200, lowLabel: "Low activity", highLabel: "Very active", normalLabel: "Active"),
		"exerciseTime": HealthRange(low: 15, high: 120, lowLabel: "Below recommended", highLabel: "Very active", normalLabel: "On track"),
		"steps": HealthRange(low: 5000, high: 15000, lowLabel: "Below target", highLabel: "Very active", normalLabel: "On target"),
		"walkingAsymmetry": HealthRange(low: 0, high: 10, lowLabel: "Normal", highLabel: "Notable asymmetry", normalLabel: "Balanced"),
		"walkingDoubleSupport": HealthRange(low: 20, high: 40, lowLabel: "Low", highLabel: "High", normalLabel: "Normal"),
		"environmentalAudioExposure": HealthRange(low: 0, high: 80, lowLabel: "Quiet", highLabel: "Potentially damaging", normalLabel: "Safe"),
		"headphoneAudioExposure": HealthRange(low: 0, high: 75, lowLabel: "Quiet", highLabel: "Risk of hearing damage", normalLabel: "Safe"),
		"bodyTemperature": HealthRange(low: 97.0, high: 99.5, lowLabel: "Below normal", highLabel: "Elevated — possible fever", normalLabel: "Normal"),
		"wristTemperature": HealthRange(low: -1.0, high: 1.0, lowLabel: "Below baseline", highLabel: "Above baseline", normalLabel: "Within baseline"),
	]

	// MARK: - Personalized Ranges (gender/age dependent)

	private static let personalizedRanges: [String: (String?, Int?) -> HealthRange] = [
		"restingHeartRate": { _, _ in
			HealthRange(low: 40, high: 100, lowLabel: "Athletic range", highLabel: "Elevated", normalLabel: "Normal")
		},
		"heartRateVariability": { _, age in
			let high: Double
			switch age ?? 30 {
			case ..<30: high = 80
			case 30..<40: high = 70
			case 40..<50: high = 55
			case 50..<60: high = 40
			default: high = 30
			}
			let low = high * 0.3
			return HealthRange(low: low, high: high * 2, lowLabel: "Below average", highLabel: "Excellent", normalLabel: "Good")
		},
		"vo2Max": { gender, age in
			let isFemale = gender == "female"
			let ageVal = age ?? 30
			let low: Double
			let high: Double
			switch ageVal {
			case ..<30:
				low = isFemale ? 30 : 35
				high = isFemale ? 45 : 50
			case 30..<40:
				low = isFemale ? 28 : 33
				high = isFemale ? 42 : 48
			case 40..<50:
				low = isFemale ? 25 : 30
				high = isFemale ? 38 : 44
			case 50..<60:
				low = isFemale ? 22 : 27
				high = isFemale ? 35 : 40
			default:
				low = isFemale ? 20 : 24
				high = isFemale ? 32 : 37
			}
			return HealthRange(low: low, high: high, lowLabel: "Below average", highLabel: "Excellent", normalLabel: "Good")
		},
		"basalEnergy": { gender, _ in
			let isFemale = gender == "female"
			return HealthRange(
				low: isFemale ? 1100 : 1400,
				high: isFemale ? 1800 : 2200,
				lowLabel: "Below typical", highLabel: "Above typical", normalLabel: "Typical"
			)
		},
		"walkingSpeed": { _, age in
			let ageVal = age ?? 40
			let low: Double = ageVal > 65 ? 1.8 : 2.3
			let high: Double = ageVal > 65 ? 3.5 : 4.0
			return HealthRange(low: low, high: high, lowLabel: "Below average", highLabel: "Above average", normalLabel: "Normal")
		},
	]
}
