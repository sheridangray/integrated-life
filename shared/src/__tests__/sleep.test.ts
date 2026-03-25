import { describe, it, expect } from 'vitest'
import { NightlyMetricsSchema, SleepScoreSchema, BaselineStatsSchema } from '../sleep'

describe('NightlyMetricsSchema', () => {
	const validPayload = {
		date: '2026-02-20',
		sleepStartTime: '2026-02-20T23:00:00Z',
		sleepEndTime: '2026-02-21T07:00:00Z',
		sleepMidpoint: '2026-02-21T03:00:00Z',
		totalAsleepDuration: 450,
		totalInBedDuration: 480,
		minHrValue: 48,
		minHrTimestamp: '2026-02-21T03:30:00Z',
		avgHr: 55,
		deviceTier: 'A',
	}

	it('accepts valid minimal payload', () => {
		const result = NightlyMetricsSchema.safeParse(validPayload)
		expect(result.success).toBe(true)
	})

	it('accepts valid full payload with optional fields', () => {
		const result = NightlyMetricsSchema.safeParse({
			...validPayload,
			deepDuration: 90,
			remDuration: 110,
			coreDuration: 250,
			wasoDuration: 15,
			awakeAfterOnsetMinutes: 22,
			awakeningCountOver2m: 3,
			longestAwakeEpisodeMinutes: 12,
			hrvMean: 45,
			respiratoryRateMean: 14,
			temperatureDeviation: 0.1,
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing required fields', () => {
		const result = NightlyMetricsSchema.safeParse({ date: '2026-02-20' })
		expect(result.success).toBe(false)
	})

	it('rejects negative durations', () => {
		const result = NightlyMetricsSchema.safeParse({
			...validPayload,
			totalAsleepDuration: -10,
		})
		expect(result.success).toBe(false)
	})

	it('rejects invalid device tier', () => {
		const result = NightlyMetricsSchema.safeParse({
			...validPayload,
			deviceTier: 'X',
		})
		expect(result.success).toBe(false)
	})
})

describe('SleepScoreSchema', () => {
	const validScore = {
		id: 'score123',
		date: '2026-02-20',
		sleepScore: 82,
		readinessScore: 78,
		sleepBreakdown: {
			durationAdequacy: 85,
			consistency: 88,
			fragmentation: 82,
			recoveryPhysiology: 70,
			structure: 75,
			timingAlignment: 80,
			preliminaryScore: 82,
			penaltyTotal: 4,
			penaltyFlags: ['sleep_debt_7d'],
		},
		readinessBreakdown: {
			sleepScoreContrib: 82,
			hrvDeviation: 55,
			rhrDeviation: 60,
			recoveryIndex: 50,
			hrvTrendSlope: 52,
			sleepDebt: 90,
			activityLoad: 50,
		},
		interactionFlags: ['sympathetic_stress'],
		interactionFactor: 0.9,
		actionBucket: 'maintain',
		modelVersion: 'sleep_readiness_v2.0_dci_rst',
		calibrationPhase: 3,
		deviceTier: 'A',
	}

	it('accepts valid score', () => {
		const result = SleepScoreSchema.safeParse(validScore)
		expect(result.success).toBe(true)
	})

	it('rejects score out of range', () => {
		const result = SleepScoreSchema.safeParse({
			...validScore,
			sleepScore: 150,
		})
		expect(result.success).toBe(false)
	})

	it('rejects invalid action bucket', () => {
		const result = SleepScoreSchema.safeParse({
			...validScore,
			actionBucket: 'invalid',
		})
		expect(result.success).toBe(false)
	})
})

describe('BaselineStatsSchema', () => {
	it('accepts valid baseline', () => {
		const result = BaselineStatsSchema.safeParse({
			duration: { mean: 440, std: 30, median: 445 },
			efficiency: { mean: 92, std: 3, median: 93 },
			restingHr: { mean: 56, std: 4, median: 55 },
			sleepMidpoint: { mean: 3, std: 0.5, median: 3 },
			dataPointCount: 30,
			lastUpdatedDate: '2026-02-20',
		})
		expect(result.success).toBe(true)
	})
})
