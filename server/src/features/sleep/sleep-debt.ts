import type { NightlyMetrics, BaselineStats } from '@integrated-life/shared'

const DECAY_WEIGHTS = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4]

const MIN_OPTIMAL_DURATION = 420 // 7 hours in minutes

export function getOptimalDuration(baseline: BaselineStats | null): number {
	if (!baseline) return 480
	return Math.max(MIN_OPTIMAL_DURATION, baseline.duration.mean)
}

export function computeSleepDebt(
	recentMetrics: NightlyMetrics[],
	optimalDuration: number
): number {
	const last7 = recentMetrics.slice(-7)
	if (last7.length === 0) return 0

	let weightedDeficit = 0
	let totalWeight = 0

	for (let i = 0; i < last7.length; i++) {
		const deficit = Math.max(0, optimalDuration - last7[i].totalAsleepDuration)
		const weight = DECAY_WEIGHTS[last7.length - 1 - i] ?? 0.4
		weightedDeficit += deficit * weight
		totalWeight += weight
	}

	return totalWeight > 0
		? Math.round((weightedDeficit / totalWeight) * 10) / 10
		: 0
}
