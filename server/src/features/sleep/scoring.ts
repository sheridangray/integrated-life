import type { NightlyMetrics, BaselineStats, ComponentBreakdown, ReadinessBreakdown, ActionBucket } from '@integrated-life/shared'

export const SCORING_CONFIG_V1 = {
	modelVersion: 'sleep_readiness_v1.2_rule_based',
	sleepWeights: {
		duration: 0.20,
		efficiency: 0.15,
		deep: 0.15,
		rem: 0.15,
		restfulness: 0.10,
		timing: 0.15,
		physioStability: 0.10,
	},
	readinessWeights: {
		sleepScore: 0.30,
		hrvDeviation: 0.20,
		rhrDeviation: 0.15,
		recoveryIndex: 0.10,
		hrvTrendSlope: 0.10,
		sleepDebt: 0.10,
		activityLoad: 0.05,
	},
	kValues: {
		gentle: 0.9,
		moderate: 1.3,
		steep: 2.0,
	},
	interactionBounds: {
		1: { min: 0.85, max: 1.10 },
		2: { min: 0.75, max: 1.15 },
		3: { min: 0.65, max: 1.20 },
	} as Record<number, { min: number; max: number }>,
	actionThresholds: {
		pushHard: 85,
		maintain: 70,
		activeRecovery: 50,
	},
} as const

export function sigmoid(z: number, k: number): number {
	return 100 / (1 + Math.exp(-k * z))
}

export function computeZScore(value: number, mean: number, std: number): number {
	if (std === 0) return 0
	const z = (value - mean) / std
	return Math.max(-3, Math.min(3, z))
}

export function getCalibrationPhase(dataPointCount: number): 1 | 2 | 3 {
	if (dataPointCount < 7) return 1
	if (dataPointCount < 21) return 2
	return 3
}

export function determineActionBucket(readinessScore: number): ActionBucket {
	const t = SCORING_CONFIG_V1.actionThresholds
	if (readinessScore >= t.pushHard) return 'push_hard'
	if (readinessScore >= t.maintain) return 'maintain'
	if (readinessScore >= t.activeRecovery) return 'active_recovery'
	return 'full_rest'
}

function minutesToMidpointHour(isoString: string): number {
	const d = new Date(isoString)
	let h = d.getUTCHours() + d.getUTCMinutes() / 60
	if (h > 12) h -= 24
	return h
}

export function computeSleepScore(
	metrics: NightlyMetrics,
	baseline: BaselineStats | null,
	config = SCORING_CONFIG_V1
): { score: number; breakdown: ComponentBreakdown } {
	const w = config.sleepWeights
	const k = config.kValues

	const efficiency = metrics.totalInBedDuration > 0
		? (metrics.totalAsleepDuration / metrics.totalInBedDuration) * 100
		: 0

	let durationScore: number
	let efficiencyScore: number
	let timingScore: number

	if (baseline) {
		const durationZ = computeZScore(metrics.totalAsleepDuration, baseline.duration.mean, baseline.duration.std)
		durationScore = sigmoid(durationZ, k.gentle)

		const efficiencyZ = computeZScore(efficiency, baseline.efficiency.mean, baseline.efficiency.std)
		efficiencyScore = sigmoid(efficiencyZ, k.moderate)

		const midpointHour = minutesToMidpointHour(metrics.sleepMidpoint)
		const timingZ = computeZScore(midpointHour, baseline.sleepMidpoint.mean, baseline.sleepMidpoint.std)
		timingScore = 100 * Math.exp(-0.5 * timingZ * timingZ)
	} else {
		durationScore = Math.min(100, (metrics.totalAsleepDuration / 480) * 100)
		efficiencyScore = Math.min(100, efficiency)
		timingScore = 75
	}

	let deepScore: number | undefined
	let remScore: number | undefined

	if (metrics.deepDuration !== undefined && metrics.totalAsleepDuration > 0) {
		const deepPct = (metrics.deepDuration / metrics.totalAsleepDuration) * 100
		if (baseline?.deepPct) {
			deepScore = sigmoid(computeZScore(deepPct, baseline.deepPct.mean, baseline.deepPct.std), k.gentle)
		} else {
			deepScore = Math.min(100, (deepPct / 20) * 100)
		}
	}

	if (metrics.remDuration !== undefined && metrics.totalAsleepDuration > 0) {
		const remPct = (metrics.remDuration / metrics.totalAsleepDuration) * 100
		if (baseline?.remPct) {
			remScore = sigmoid(computeZScore(remPct, baseline.remPct.mean, baseline.remPct.std), k.gentle)
		} else {
			remScore = Math.min(100, (remPct / 25) * 100)
		}
	}

	const wasoPct = metrics.wasoDuration !== undefined && metrics.totalInBedDuration > 0
		? (metrics.wasoDuration / metrics.totalInBedDuration) * 100
		: (100 - efficiency)
	const restfulnessScore = Math.max(0, Math.min(100, 100 - wasoPct * 5))

	let physioScore = 50
	let physioComponents = 0
	let physioSum = 0

	if (metrics.hrvMean !== undefined && baseline?.hrv) {
		const hrvZ = computeZScore(metrics.hrvMean, baseline.hrv.mean, baseline.hrv.std)
		physioSum += sigmoid(hrvZ, k.moderate)
		physioComponents++
	}

	if (baseline?.restingHr) {
		const rhrZ = computeZScore(metrics.avgHr, baseline.restingHr.mean, baseline.restingHr.std)
		physioSum += sigmoid(-rhrZ, k.moderate)
		physioComponents++
	}

	if (metrics.respiratoryRateMean !== undefined && baseline?.respiratoryRate) {
		const rrZ = computeZScore(metrics.respiratoryRateMean, baseline.respiratoryRate.mean, baseline.respiratoryRate.std)
		physioSum += sigmoid(-Math.abs(rrZ), k.steep)
		physioComponents++
	}

	if (metrics.temperatureDeviation !== undefined && baseline?.tempDeviation) {
		const tempZ = computeZScore(metrics.temperatureDeviation, baseline.tempDeviation.mean, baseline.tempDeviation.std)
		physioSum += sigmoid(-Math.abs(tempZ), k.steep)
		physioComponents++
	}

	if (physioComponents > 0) {
		physioScore = physioSum / physioComponents
	}

	const hasStages = deepScore !== undefined && remScore !== undefined
	let weightedSum: number
	let totalWeight: number

	if (hasStages) {
		weightedSum =
			durationScore * w.duration +
			efficiencyScore * w.efficiency +
			deepScore! * w.deep +
			remScore! * w.rem +
			restfulnessScore * w.restfulness +
			timingScore * w.timing +
			physioScore * w.physioStability
		totalWeight = 1.0
	} else {
		const adjustedDuration = w.duration + w.deep * 0.5
		const adjustedEfficiency = w.efficiency + w.rem * 0.5
		const adjustedRestfulness = w.restfulness + (w.deep + w.rem) * 0.0
		weightedSum =
			durationScore * adjustedDuration +
			efficiencyScore * adjustedEfficiency +
			restfulnessScore * (w.restfulness + adjustedRestfulness) +
			timingScore * w.timing +
			physioScore * w.physioStability
		totalWeight = adjustedDuration + adjustedEfficiency + (w.restfulness + adjustedRestfulness) + w.timing + w.physioStability
	}

	const score = Math.round(Math.max(0, Math.min(100, weightedSum / totalWeight)))

	return {
		score,
		breakdown: {
			duration: Math.round(durationScore),
			efficiency: Math.round(efficiencyScore),
			deep: deepScore !== undefined ? Math.round(deepScore) : undefined,
			rem: remScore !== undefined ? Math.round(remScore) : undefined,
			restfulness: Math.round(restfulnessScore),
			timing: Math.round(timingScore),
			physioStability: Math.round(physioScore),
		},
	}
}

export type InteractionResult = {
	factor: number
	flags: string[]
}

export function applyInteractionRules(
	baseScore: number,
	metrics: NightlyMetrics,
	baseline: BaselineStats | null,
	calibrationPhase: number
): InteractionResult {
	const flags: string[] = []
	let factor = 1.0

	if (baseline?.hrv && metrics.hrvMean !== undefined && baseline?.restingHr) {
		const hrvLow = metrics.hrvMean < baseline.hrv.mean - baseline.hrv.std
		const rhrHigh = metrics.avgHr > baseline.restingHr.mean + baseline.restingHr.std

		if (hrvLow && rhrHigh) {
			flags.push('sympathetic_stress')
			factor *= 0.90
		}
	}

	if (baseline?.restingHr) {
		const hrNadirHour = new Date(metrics.minHrTimestamp).getUTCHours()
		const sleepEndHour = new Date(metrics.sleepEndTime).getUTCHours()
		const windowEnd = sleepEndHour - 1
		if (hrNadirHour >= windowEnd && hrNadirHour <= sleepEndHour) {
			flags.push('hr_nadir_late')
			factor *= 0.95
		}
	}

	if (metrics.totalAsleepDuration < 300) {
		flags.push('severely_short_sleep')
		factor *= 0.85
	}

	if (metrics.totalInBedDuration > 0) {
		const eff = (metrics.totalAsleepDuration / metrics.totalInBedDuration) * 100
		if (eff < 75) {
			flags.push('fragmented_sleep')
			factor *= 0.92
		}
	}

	if (metrics.temperatureDeviation !== undefined && baseline?.tempDeviation) {
		const tempZ = Math.abs(computeZScore(
			metrics.temperatureDeviation,
			baseline.tempDeviation.mean,
			baseline.tempDeviation.std
		))
		if (tempZ > 2.0) {
			flags.push('temperature_anomaly')
			factor *= 0.93
		}
	}

	const bounds = SCORING_CONFIG_V1.interactionBounds[calibrationPhase] ?? SCORING_CONFIG_V1.interactionBounds[3]
	factor = Math.max(bounds.min, Math.min(bounds.max, factor))

	return { factor, flags }
}

export function computeReadinessScore(
	sleepScore: number,
	metrics: NightlyMetrics,
	baseline: BaselineStats | null,
	sleepDebt: number,
	calibrationPhase: number,
	config = SCORING_CONFIG_V1
): { score: number; breakdown: ReadinessBreakdown; interactionFactor: number; interactionFlags: string[] } {
	const w = config.readinessWeights
	const k = config.kValues

	const sleepScoreContrib = sleepScore

	let hrvDeviation = 50
	if (metrics.hrvMean !== undefined && baseline?.hrv) {
		const z = computeZScore(metrics.hrvMean, baseline.hrv.mean, baseline.hrv.std)
		hrvDeviation = sigmoid(z, k.moderate)
	}

	let rhrDeviation = 50
	if (baseline?.restingHr) {
		const z = computeZScore(metrics.avgHr, baseline.restingHr.mean, baseline.restingHr.std)
		rhrDeviation = sigmoid(-z, k.moderate)
	}

	let recoveryIndex = 50
	if (baseline?.restingHr) {
		const hrDrop = metrics.avgHr - metrics.minHrValue
		const expectedDrop = baseline.restingHr.mean * 0.15
		recoveryIndex = Math.min(100, (hrDrop / expectedDrop) * 75)
	}

	let hrvTrendSlope = 50
	if (baseline?.hrvSlope14d !== undefined) {
		hrvTrendSlope = baseline.hrvSlope14d > 0 ? Math.min(100, 50 + baseline.hrvSlope14d * 10) : Math.max(0, 50 + baseline.hrvSlope14d * 10)
	}

	const sleepDebtScore = Math.max(0, Math.min(100, 100 - sleepDebt * 3))
	const activityLoad = 50

	const baseScore =
		sleepScoreContrib * w.sleepScore +
		hrvDeviation * w.hrvDeviation +
		rhrDeviation * w.rhrDeviation +
		recoveryIndex * w.recoveryIndex +
		hrvTrendSlope * w.hrvTrendSlope +
		sleepDebtScore * w.sleepDebt +
		activityLoad * w.activityLoad

	const interaction = applyInteractionRules(baseScore, metrics, baseline, calibrationPhase)
	const adjustedScore = Math.round(Math.max(0, Math.min(100, baseScore * interaction.factor)))

	return {
		score: adjustedScore,
		breakdown: {
			sleepScoreContrib: Math.round(sleepScoreContrib),
			hrvDeviation: Math.round(hrvDeviation),
			rhrDeviation: Math.round(rhrDeviation),
			recoveryIndex: Math.round(recoveryIndex),
			hrvTrendSlope: Math.round(hrvTrendSlope),
			sleepDebt: Math.round(sleepDebtScore),
			activityLoad: Math.round(activityLoad),
		},
		interactionFactor: interaction.factor,
		interactionFlags: interaction.flags,
	}
}
