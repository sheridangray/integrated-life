import type {
	NightlyMetrics,
	SleepScore,
	BaselineStats,
	ComponentBreakdown,
	ReadinessBreakdown,
	ActionBucket,
	DeviceTier,
} from '@integrated-life/shared'

export type {
	NightlyMetrics,
	SleepScore,
	BaselineStats,
	ComponentBreakdown,
	ReadinessBreakdown,
	ActionBucket,
	DeviceTier,
}

export type ScoringResult = {
	sleepScore: number
	readinessScore: number
	sleepBreakdown: ComponentBreakdown
	readinessBreakdown: ReadinessBreakdown
	interactionFlags: string[]
	interactionFactor: number
	actionBucket: ActionBucket
	modelVersion: string
	calibrationPhase: number
	deviceTier: DeviceTier
}
