import type { NightlyMetrics, MetricBaseline, BaselineStats } from '@integrated-life/shared'

export function isOutlier(value: number, mean: number, std: number): boolean {
	if (std === 0) return false
	return Math.abs((value - mean) / std) > 2.5
}

function computeStats(values: number[]): MetricBaseline {
	if (values.length === 0) return { mean: 0, std: 0, median: 0 }

	const sorted = [...values].sort((a, b) => a - b)
	const mean = values.reduce((s, v) => s + v, 0) / values.length

	const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
	const std = Math.sqrt(variance)

	const mid = Math.floor(sorted.length / 2)
	const median = sorted.length % 2 !== 0
		? sorted[mid]
		: (sorted[mid - 1] + sorted[mid]) / 2

	return { mean: Math.round(mean * 100) / 100, std: Math.round(std * 100) / 100, median: Math.round(median * 100) / 100 }
}

function extractMetricValues(
	metrics: NightlyMetrics[],
	extractor: (m: NightlyMetrics) => number | undefined,
): number[] {
	const raw = metrics.map(extractor).filter((v): v is number => v !== undefined)
	if (raw.length < 5) return raw

	const mean = raw.reduce((s, v) => s + v, 0) / raw.length
	const variance = raw.reduce((s, v) => s + (v - mean) ** 2, 0) / raw.length
	const std = Math.sqrt(variance)
	if (std === 0) return raw

	return raw.filter(v => !isOutlier(v, mean, std))
}

function midpointHour(isoString: string): number {
	const d = new Date(isoString)
	let h = d.getUTCHours() + d.getUTCMinutes() / 60
	if (h > 12) h -= 24
	return h
}

export function updateBaseline(
	existing: BaselineStats | null,
	recentMetrics: NightlyMetrics[]
): BaselineStats {
	if (recentMetrics.length === 0 && existing) return existing

	const durations = extractMetricValues(recentMetrics, m => m.totalAsleepDuration)
	const efficiencies = extractMetricValues(
		recentMetrics,
		m => m.totalInBedDuration > 0 ? (m.totalAsleepDuration / m.totalInBedDuration) * 100 : undefined,
	)
	const midpoints = extractMetricValues(recentMetrics, m => midpointHour(m.sleepMidpoint))
	const hrs = extractMetricValues(recentMetrics, m => m.avgHr)

	const deepPcts = extractMetricValues(
		recentMetrics,
		m => m.deepDuration !== undefined && m.totalAsleepDuration > 0
			? (m.deepDuration / m.totalAsleepDuration) * 100 : undefined,
	)

	const remPcts = extractMetricValues(
		recentMetrics,
		m => m.remDuration !== undefined && m.totalAsleepDuration > 0
			? (m.remDuration / m.totalAsleepDuration) * 100 : undefined,
	)

	const hrvValues = extractMetricValues(recentMetrics, m => m.hrvMean)
	const rrValues = extractMetricValues(recentMetrics, m => m.respiratoryRateMean)
	const tempValues = extractMetricValues(recentMetrics, m => m.temperatureDeviation)

	const lastDate = recentMetrics.length > 0
		? recentMetrics[recentMetrics.length - 1].date
		: existing?.lastUpdatedDate ?? new Date().toISOString()

	return {
		duration: durations.length > 0 ? computeStats(durations) : existing?.duration ?? { mean: 480, std: 60, median: 480 },
		efficiency: efficiencies.length > 0 ? computeStats(efficiencies) : existing?.efficiency ?? { mean: 90, std: 5, median: 90 },
		deepPct: deepPcts.length > 0 ? computeStats(deepPcts) : existing?.deepPct,
		remPct: remPcts.length > 0 ? computeStats(remPcts) : existing?.remPct,
		hrv: hrvValues.length > 0 ? computeStats(hrvValues) : existing?.hrv,
		restingHr: hrs.length > 0 ? computeStats(hrs) : existing?.restingHr ?? { mean: 65, std: 5, median: 65 },
		respiratoryRate: rrValues.length > 0 ? computeStats(rrValues) : existing?.respiratoryRate,
		tempDeviation: tempValues.length > 0 ? computeStats(tempValues) : existing?.tempDeviation,
		sleepMidpoint: midpoints.length > 0 ? computeStats(midpoints) : existing?.sleepMidpoint ?? { mean: 3, std: 1, median: 3 },
		dataPointCount: recentMetrics.length,
		lastUpdatedDate: lastDate,
		hrvSlope14d: existing?.hrvSlope14d,
		durationSlope14d: existing?.durationSlope14d,
		sleepScoreSlope14d: existing?.sleepScoreSlope14d,
	}
}

export function computeSlopes(
	recentMetrics: NightlyMetrics[],
	recentScores: number[],
): { hrvSlope14d?: number; durationSlope14d?: number; sleepScoreSlope14d?: number } {
	if (recentMetrics.length < 5) return {}

	const hrvRaw = recentMetrics.map(m => m.hrvMean).filter((v): v is number => v !== undefined)
	const hrvMean = hrvRaw.length > 0 ? hrvRaw.reduce((s, v) => s + v, 0) / hrvRaw.length : 0
	const hrvVar = hrvRaw.length > 0 ? hrvRaw.reduce((s, v) => s + (v - hrvMean) ** 2, 0) / hrvRaw.length : 0
	const hrvStd = Math.sqrt(hrvVar)

	const filtered = hrvStd > 0
		? recentMetrics.filter(m => {
			if (m.hrvMean === undefined) return true
			return !isOutlier(m.hrvMean, hrvMean, hrvStd)
		})
		: recentMetrics

	function linearSlope(values: number[]): number | undefined {
		if (values.length < 5) return undefined
		const n = values.length
		let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
		for (let i = 0; i < n; i++) {
			sumX += i
			sumY += values[i]
			sumXY += i * values[i]
			sumX2 += i * i
		}
		const denom = n * sumX2 - sumX * sumX
		if (denom === 0) return 0
		return Math.round(((n * sumXY - sumX * sumY) / denom) * 1000) / 1000
	}

	const hrvValues = filtered.map(m => m.hrvMean).filter((v): v is number => v !== undefined)
	const durationValues = filtered.map(m => m.totalAsleepDuration)

	return {
		hrvSlope14d: linearSlope(hrvValues),
		durationSlope14d: linearSlope(durationValues),
		sleepScoreSlope14d: linearSlope(recentScores),
	}
}
