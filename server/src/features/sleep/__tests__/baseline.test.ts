import { describe, it, expect } from 'vitest'
import { isOutlier, updateBaseline, computeSlopes } from '../baseline'
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

describe('isOutlier', () => {
	it('returns false for values within 2.5 std', () => {
		expect(isOutlier(55, 50, 10)).toBe(false)
	})

	it('returns true for values beyond 2.5 std', () => {
		expect(isOutlier(80, 50, 10)).toBe(true)
	})

	it('returns false when std is 0', () => {
		expect(isOutlier(100, 50, 0)).toBe(false)
	})
})

describe('updateBaseline', () => {
	it('creates baseline from scratch with metrics', () => {
		const metrics = [
			makeMetrics({ totalAsleepDuration: 420, avgHr: 55 }),
			makeMetrics({ totalAsleepDuration: 450, avgHr: 58, date: '2026-02-21' }),
			makeMetrics({ totalAsleepDuration: 480, avgHr: 52, date: '2026-02-22' }),
		]

		const baseline = updateBaseline(null, metrics)
		expect(baseline.dataPointCount).toBe(3)
		expect(baseline.duration.mean).toBe(450)
		expect(baseline.restingHr.mean).toBe(55)
	})

	it('returns existing baseline when no new metrics', () => {
		const existing: BaselineStats = {
			duration: { mean: 440, std: 30, median: 445 },
			efficiency: { mean: 92, std: 3, median: 93 },
			restingHr: { mean: 56, std: 4, median: 55 },
			sleepMidpoint: { mean: 3, std: 0.5, median: 3 },
			dataPointCount: 30,
			lastUpdatedDate: '2026-02-20',
		}

		const result = updateBaseline(existing, [])
		expect(result).toBe(existing)
	})

	it('handles optional metrics (hrv, deep, rem)', () => {
		const metrics = [
			makeMetrics({ hrvMean: 40, deepDuration: 80, remDuration: 100 }),
			makeMetrics({ hrvMean: 45, deepDuration: 90, remDuration: 110, date: '2026-02-21' }),
		]

		const baseline = updateBaseline(null, metrics)
		expect(baseline.hrv).toBeDefined()
		expect(baseline.hrv!.mean).toBe(42.5)
		expect(baseline.deepPct).toBeDefined()
		expect(baseline.remPct).toBeDefined()
	})

	it('uses default values when baseline is null and no metrics for optional fields', () => {
		const metrics = [
			makeMetrics({ hrvMean: undefined, deepDuration: undefined, remDuration: undefined }),
		]

		const baseline = updateBaseline(null, metrics)
		expect(baseline.hrv).toBeUndefined()
		expect(baseline.deepPct).toBeUndefined()
		expect(baseline.remPct).toBeUndefined()
	})
})

describe('computeSlopes', () => {
	it('returns empty when fewer than 5 data points', () => {
		const metrics = [makeMetrics(), makeMetrics({ date: '2026-02-21' })]
		const result = computeSlopes(metrics, [80, 82])
		expect(result.hrvSlope14d).toBeUndefined()
	})

	it('computes slopes for 5+ data points', () => {
		const metrics = Array.from({ length: 7 }, (_, i) =>
			makeMetrics({
				date: `2026-02-${14 + i}`,
				hrvMean: 40 + i,
				totalAsleepDuration: 420 + i * 10,
			})
		)
		const scores = [70, 72, 74, 76, 78, 80, 82]

		const result = computeSlopes(metrics, scores)
		expect(result.hrvSlope14d).toBeDefined()
		expect(result.hrvSlope14d!).toBeGreaterThan(0)
		expect(result.durationSlope14d).toBeDefined()
		expect(result.durationSlope14d!).toBeGreaterThan(0)
		expect(result.sleepScoreSlope14d).toBeDefined()
	})
})
