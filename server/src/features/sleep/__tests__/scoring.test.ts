import { describe, it, expect } from 'vitest'
import {
	sigmoid,
	computeZScore,
	getCalibrationPhase,
	determineActionBucket,
	computeSleepScore,
	computeReadinessScore,
	applyInteractionRules,
	SCORING_CONFIG_V1,
} from '../scoring'
import type { NightlyMetrics, BaselineStats } from '@integrated-life/shared'

function makeMetrics(overrides: Partial<NightlyMetrics> = {}): NightlyMetrics {
	return {
		date: '2026-02-20',
		sleepStartTime: '2026-02-20T23:00:00Z',
		sleepEndTime: '2026-02-21T07:00:00Z',
		sleepMidpoint: '2026-02-21T03:00:00Z',
		totalAsleepDuration: 450,
		totalInBedDuration: 480,
		deepDuration: 90,
		remDuration: 110,
		coreDuration: 250,
		wasoDuration: 15,
		minHrValue: 48,
		minHrTimestamp: '2026-02-21T03:30:00Z',
		avgHr: 55,
		hrvMean: 45,
		respiratoryRateMean: 14,
		temperatureDeviation: 0.1,
		deviceTier: 'A',
		...overrides,
	}
}

function makeBaseline(overrides: Partial<BaselineStats> = {}): BaselineStats {
	return {
		duration: { mean: 440, std: 30, median: 445 },
		efficiency: { mean: 92, std: 3, median: 93 },
		deepPct: { mean: 18, std: 3, median: 18 },
		remPct: { mean: 22, std: 4, median: 23 },
		hrv: { mean: 42, std: 8, median: 43 },
		restingHr: { mean: 56, std: 4, median: 55 },
		respiratoryRate: { mean: 14, std: 1, median: 14 },
		tempDeviation: { mean: 0, std: 0.3, median: 0 },
		sleepMidpoint: { mean: 3, std: 0.5, median: 3 },
		dataPointCount: 30,
		lastUpdatedDate: '2026-02-20',
		hrvSlope14d: 0.2,
		durationSlope14d: 1.5,
		sleepScoreSlope14d: 0.5,
		...overrides,
	}
}

describe('sigmoid', () => {
	it('returns 50 when z=0', () => {
		expect(sigmoid(0, 1)).toBe(50)
	})

	it('approaches 100 for large positive z', () => {
		expect(sigmoid(5, 1)).toBeGreaterThan(99)
	})

	it('approaches 0 for large negative z', () => {
		expect(sigmoid(-5, 1)).toBeLessThan(1)
	})

	it('is steeper with higher k', () => {
		const gentle = sigmoid(1, 0.9)
		const steep = sigmoid(1, 2.0)
		expect(steep).toBeGreaterThan(gentle)
	})
})

describe('computeZScore', () => {
	it('returns 0 when value equals mean', () => {
		expect(computeZScore(50, 50, 10)).toBe(0)
	})

	it('clamps to +3', () => {
		expect(computeZScore(100, 50, 5)).toBe(3)
	})

	it('clamps to -3', () => {
		expect(computeZScore(0, 50, 5)).toBe(-3)
	})

	it('returns 0 when std is 0', () => {
		expect(computeZScore(100, 50, 0)).toBe(0)
	})

	it('computes normal z-score within range', () => {
		expect(computeZScore(60, 50, 10)).toBe(1)
	})
})

describe('getCalibrationPhase', () => {
	it('returns 1 for < 7 data points', () => {
		expect(getCalibrationPhase(0)).toBe(1)
		expect(getCalibrationPhase(6)).toBe(1)
	})

	it('returns 2 for 7-20 data points', () => {
		expect(getCalibrationPhase(7)).toBe(2)
		expect(getCalibrationPhase(20)).toBe(2)
	})

	it('returns 3 for >= 21 data points', () => {
		expect(getCalibrationPhase(21)).toBe(3)
		expect(getCalibrationPhase(100)).toBe(3)
	})
})

describe('determineActionBucket', () => {
	it('returns push_hard for score >= 85', () => {
		expect(determineActionBucket(85)).toBe('push_hard')
		expect(determineActionBucket(100)).toBe('push_hard')
	})

	it('returns maintain for 70-84', () => {
		expect(determineActionBucket(70)).toBe('maintain')
		expect(determineActionBucket(84)).toBe('maintain')
	})

	it('returns active_recovery for 50-69', () => {
		expect(determineActionBucket(50)).toBe('active_recovery')
		expect(determineActionBucket(69)).toBe('active_recovery')
	})

	it('returns full_rest for < 50', () => {
		expect(determineActionBucket(49)).toBe('full_rest')
		expect(determineActionBucket(0)).toBe('full_rest')
	})
})

describe('computeSleepScore', () => {
	it('computes a score between 0 and 100 with full data', () => {
		const result = computeSleepScore(makeMetrics(), makeBaseline())
		expect(result.score).toBeGreaterThanOrEqual(0)
		expect(result.score).toBeLessThanOrEqual(100)
	})

	it('includes all breakdown components with Tier A data', () => {
		const result = computeSleepScore(makeMetrics(), makeBaseline())
		expect(result.breakdown.duration).toBeDefined()
		expect(result.breakdown.efficiency).toBeDefined()
		expect(result.breakdown.deep).toBeDefined()
		expect(result.breakdown.rem).toBeDefined()
		expect(result.breakdown.restfulness).toBeDefined()
		expect(result.breakdown.timing).toBeDefined()
		expect(result.breakdown.physioStability).toBeDefined()
	})

	it('degrades gracefully for Tier C (no stage data)', () => {
		const metrics = makeMetrics({
			deepDuration: undefined,
			remDuration: undefined,
			coreDuration: undefined,
			deviceTier: 'C',
		})
		const result = computeSleepScore(metrics, makeBaseline())
		expect(result.score).toBeGreaterThanOrEqual(0)
		expect(result.score).toBeLessThanOrEqual(100)
		expect(result.breakdown.deep).toBeUndefined()
		expect(result.breakdown.rem).toBeUndefined()
	})

	it('uses population defaults when no baseline exists', () => {
		const result = computeSleepScore(makeMetrics(), null)
		expect(result.score).toBeGreaterThanOrEqual(0)
		expect(result.score).toBeLessThanOrEqual(100)
	})

	it('penalizes short sleep duration', () => {
		const good = computeSleepScore(makeMetrics({ totalAsleepDuration: 480 }), makeBaseline())
		const bad = computeSleepScore(makeMetrics({ totalAsleepDuration: 240 }), makeBaseline())
		expect(good.score).toBeGreaterThan(bad.score)
	})
})

describe('applyInteractionRules', () => {
	it('flags sympathetic_stress when HRV low and RHR high', () => {
		const metrics = makeMetrics({ hrvMean: 30, avgHr: 65 })
		const baseline = makeBaseline()
		const result = applyInteractionRules(75, metrics, baseline, 3)
		expect(result.flags).toContain('sympathetic_stress')
		expect(result.factor).toBeLessThan(1.0)
	})

	it('flags severely_short_sleep under 300 minutes', () => {
		const metrics = makeMetrics({ totalAsleepDuration: 250 })
		const result = applyInteractionRules(60, metrics, null, 3)
		expect(result.flags).toContain('severely_short_sleep')
	})

	it('flags fragmented_sleep when efficiency < 75%', () => {
		const metrics = makeMetrics({ totalAsleepDuration: 300, totalInBedDuration: 480 })
		const result = applyInteractionRules(60, metrics, null, 3)
		expect(result.flags).toContain('fragmented_sleep')
	})

	it('respects calibration phase bounds', () => {
		const metrics = makeMetrics({ totalAsleepDuration: 200, hrvMean: 20, avgHr: 70 })
		const baseline = makeBaseline()

		const phase1 = applyInteractionRules(50, metrics, baseline, 1)
		const phase3 = applyInteractionRules(50, metrics, baseline, 3)

		expect(phase1.factor).toBeGreaterThanOrEqual(0.85)
		expect(phase3.factor).toBeGreaterThanOrEqual(0.65)
	})
})

describe('computeReadinessScore', () => {
	it('computes a score between 0 and 100', () => {
		const result = computeReadinessScore(80, makeMetrics(), makeBaseline(), 10, 3)
		expect(result.score).toBeGreaterThanOrEqual(0)
		expect(result.score).toBeLessThanOrEqual(100)
	})

	it('includes all readiness breakdown components', () => {
		const result = computeReadinessScore(80, makeMetrics(), makeBaseline(), 0, 3)
		expect(result.breakdown.sleepScoreContrib).toBeDefined()
		expect(result.breakdown.hrvDeviation).toBeDefined()
		expect(result.breakdown.rhrDeviation).toBeDefined()
		expect(result.breakdown.recoveryIndex).toBeDefined()
		expect(result.breakdown.hrvTrendSlope).toBeDefined()
		expect(result.breakdown.sleepDebt).toBeDefined()
		expect(result.breakdown.activityLoad).toBeDefined()
	})

	it('higher sleep score leads to higher readiness', () => {
		const high = computeReadinessScore(95, makeMetrics(), makeBaseline(), 0, 3)
		const low = computeReadinessScore(30, makeMetrics(), makeBaseline(), 0, 3)
		expect(high.score).toBeGreaterThan(low.score)
	})

	it('higher sleep debt reduces readiness', () => {
		const noDebt = computeReadinessScore(80, makeMetrics(), makeBaseline(), 0, 3)
		const highDebt = computeReadinessScore(80, makeMetrics(), makeBaseline(), 30, 3)
		expect(noDebt.score).toBeGreaterThan(highDebt.score)
	})
})
