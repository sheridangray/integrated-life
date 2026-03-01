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

// MARK: - Contributor Detail

export type ContributorDetail = {
	key: string
	score: number
	rawValue: number
	rawLabel: string
	baselineMean?: number
	baselineStd?: number
	zScore?: number
	formula: string
	weight: number
	subComponents?: Array<{
		name: string
		rawValue: number
		score: number
		baselineMean?: number
		baselineStd?: number
		zScore?: number
	}>
}

function formatMinutes(mins: number): string {
	const h = Math.floor(mins / 60)
	const m = Math.round(mins % 60)
	return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function midpointToTimeLabel(hour: number): string {
	let h24 = hour < 0 ? hour + 24 : hour
	const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
	const suffix = h24 < 12 ? 'AM' : 'PM'
	const mins = Math.round((h24 % 1) * 60)
	return `${Math.floor(h12)}:${mins.toString().padStart(2, '0')} ${suffix}`
}

export function computeContributorDetail(
	key: string,
	metrics: NightlyMetrics,
	baseline: BaselineStats | null,
	config = SCORING_CONFIG_V1,
): ContributorDetail | null {
	const w = config.sleepWeights
	const k = config.kValues

	const efficiency = metrics.totalInBedDuration > 0
		? (metrics.totalAsleepDuration / metrics.totalInBedDuration) * 100
		: 0

	switch (key) {
		case 'duration': {
			let score: number
			let zScore: number | undefined
			if (baseline) {
				zScore = computeZScore(metrics.totalAsleepDuration, baseline.duration.mean, baseline.duration.std)
				score = Math.round(sigmoid(zScore, k.gentle))
			} else {
				score = Math.round(Math.min(100, (metrics.totalAsleepDuration / 480) * 100))
			}
			return {
				key, score, weight: w.duration,
				rawValue: metrics.totalAsleepDuration,
				rawLabel: formatMinutes(metrics.totalAsleepDuration),
				baselineMean: baseline?.duration.mean,
				baselineStd: baseline?.duration.std,
				zScore,
				formula: baseline
					? 'Sigmoid of Z-score vs your average sleep duration'
					: 'Percentage of 8-hour target (no baseline yet)',
			}
		}
		case 'efficiency': {
			let score: number
			let zScore: number | undefined
			if (baseline) {
				zScore = computeZScore(efficiency, baseline.efficiency.mean, baseline.efficiency.std)
				score = Math.round(sigmoid(zScore, k.moderate))
			} else {
				score = Math.round(Math.min(100, efficiency))
			}
			return {
				key, score, weight: w.efficiency,
				rawValue: Math.round(efficiency * 10) / 10,
				rawLabel: `${Math.round(efficiency)}%`,
				baselineMean: baseline?.efficiency.mean,
				baselineStd: baseline?.efficiency.std,
				zScore,
				formula: baseline
					? 'Sigmoid of Z-score vs your average sleep efficiency'
					: 'Raw efficiency percentage (no baseline yet)',
			}
		}
		case 'deep': {
			if (metrics.deepDuration === undefined || metrics.totalAsleepDuration === 0) return null
			const deepPct = (metrics.deepDuration / metrics.totalAsleepDuration) * 100
			let score: number
			let zScore: number | undefined
			if (baseline?.deepPct) {
				zScore = computeZScore(deepPct, baseline.deepPct.mean, baseline.deepPct.std)
				score = Math.round(sigmoid(zScore, k.gentle))
			} else {
				score = Math.round(Math.min(100, (deepPct / 20) * 100))
			}
			return {
				key, score, weight: w.deep,
				rawValue: Math.round(deepPct * 10) / 10,
				rawLabel: `${formatMinutes(metrics.deepDuration)} (${Math.round(deepPct)}%)`,
				baselineMean: baseline?.deepPct?.mean,
				baselineStd: baseline?.deepPct?.std,
				zScore,
				formula: baseline?.deepPct
					? 'Sigmoid of Z-score vs your average deep sleep percentage'
					: 'Percentage of 20% deep sleep target',
			}
		}
		case 'rem': {
			if (metrics.remDuration === undefined || metrics.totalAsleepDuration === 0) return null
			const remPct = (metrics.remDuration / metrics.totalAsleepDuration) * 100
			let score: number
			let zScore: number | undefined
			if (baseline?.remPct) {
				zScore = computeZScore(remPct, baseline.remPct.mean, baseline.remPct.std)
				score = Math.round(sigmoid(zScore, k.gentle))
			} else {
				score = Math.round(Math.min(100, (remPct / 25) * 100))
			}
			return {
				key, score, weight: w.rem,
				rawValue: Math.round(remPct * 10) / 10,
				rawLabel: `${formatMinutes(metrics.remDuration)} (${Math.round(remPct)}%)`,
				baselineMean: baseline?.remPct?.mean,
				baselineStd: baseline?.remPct?.std,
				zScore,
				formula: baseline?.remPct
					? 'Sigmoid of Z-score vs your average REM percentage'
					: 'Percentage of 25% REM sleep target',
			}
		}
		case 'restfulness': {
			const wasoPct = metrics.wasoDuration !== undefined && metrics.totalInBedDuration > 0
				? (metrics.wasoDuration / metrics.totalInBedDuration) * 100
				: (100 - efficiency)
			const score = Math.round(Math.max(0, Math.min(100, 100 - wasoPct * 5)))
			return {
				key, score, weight: w.restfulness,
				rawValue: Math.round(wasoPct * 10) / 10,
				rawLabel: `${Math.round(wasoPct)}% time awake`,
				formula: 'Score = 100 minus (wake percentage x 5). Lower wake time = higher score.',
			}
		}
		case 'timing': {
			const midpointHour = minutesToMidpointHour(metrics.sleepMidpoint)
			let score: number
			let zScore: number | undefined
			if (baseline) {
				zScore = computeZScore(midpointHour, baseline.sleepMidpoint.mean, baseline.sleepMidpoint.std)
				score = Math.round(100 * Math.exp(-0.5 * zScore * zScore))
			} else {
				score = 75
			}
			return {
				key, score, weight: w.timing,
				rawValue: Math.round(midpointHour * 100) / 100,
				rawLabel: midpointToTimeLabel(midpointHour),
				baselineMean: baseline?.sleepMidpoint.mean,
				baselineStd: baseline?.sleepMidpoint.std,
				zScore,
				formula: baseline
					? 'Gaussian decay based on deviation from your typical sleep midpoint'
					: 'Default score (no baseline yet)',
			}
		}
		case 'physioStability': {
			const subs: ContributorDetail['subComponents'] = []
			let physioSum = 0
			let physioCount = 0

			if (metrics.hrvMean !== undefined && baseline?.hrv) {
				const z = computeZScore(metrics.hrvMean, baseline.hrv.mean, baseline.hrv.std)
				const s = sigmoid(z, k.moderate)
				subs.push({ name: 'HRV', rawValue: Math.round(metrics.hrvMean * 10) / 10, score: Math.round(s), baselineMean: baseline.hrv.mean, baselineStd: baseline.hrv.std, zScore: z })
				physioSum += s; physioCount++
			}
			if (baseline?.restingHr) {
				const z = computeZScore(metrics.avgHr, baseline.restingHr.mean, baseline.restingHr.std)
				const s = sigmoid(-z, k.moderate)
				subs.push({ name: 'Resting HR', rawValue: Math.round(metrics.avgHr * 10) / 10, score: Math.round(s), baselineMean: baseline.restingHr.mean, baselineStd: baseline.restingHr.std, zScore: z })
				physioSum += s; physioCount++
			}
			if (metrics.respiratoryRateMean !== undefined && baseline?.respiratoryRate) {
				const z = computeZScore(metrics.respiratoryRateMean, baseline.respiratoryRate.mean, baseline.respiratoryRate.std)
				const s = sigmoid(-Math.abs(z), k.steep)
				subs.push({ name: 'Respiratory Rate', rawValue: Math.round(metrics.respiratoryRateMean * 10) / 10, score: Math.round(s), baselineMean: baseline.respiratoryRate.mean, baselineStd: baseline.respiratoryRate.std, zScore: z })
				physioSum += s; physioCount++
			}
			if (metrics.temperatureDeviation !== undefined && baseline?.tempDeviation) {
				const z = computeZScore(metrics.temperatureDeviation, baseline.tempDeviation.mean, baseline.tempDeviation.std)
				const s = sigmoid(-Math.abs(z), k.steep)
				subs.push({ name: 'Temperature', rawValue: Math.round(metrics.temperatureDeviation * 100) / 100, score: Math.round(s), baselineMean: baseline.tempDeviation.mean, baselineStd: baseline.tempDeviation.std, zScore: z })
				physioSum += s; physioCount++
			}

			const score = physioCount > 0 ? Math.round(physioSum / physioCount) : 50
			return {
				key, score, weight: w.physioStability,
				rawValue: score,
				rawLabel: `${score}/100`,
				formula: physioCount > 0
					? `Average of ${physioCount} physiological metric(s) compared to your baseline`
					: 'Default score (no baseline data available)',
				subComponents: subs.length > 0 ? subs : undefined,
			}
		}
		default:
			return null
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
