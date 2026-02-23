import { z } from 'zod'

// --- Enums ---

export const DeviceTierEnum = z.enum(['A', 'B', 'C'])
export type DeviceTier = z.infer<typeof DeviceTierEnum>

export const ActionBucketEnum = z.enum(['push_hard', 'maintain', 'active_recovery', 'full_rest'])
export type ActionBucket = z.infer<typeof ActionBucketEnum>

// --- Nightly Metrics (client -> server) ---

export const NightlyMetricsSchema = z.object({
	date: z.string(),
	sleepStartTime: z.string(),
	sleepEndTime: z.string(),
	sleepMidpoint: z.string(),
	totalAsleepDuration: z.number().min(0),
	totalInBedDuration: z.number().min(0),
	deepDuration: z.number().min(0).optional(),
	remDuration: z.number().min(0).optional(),
	coreDuration: z.number().min(0).optional(),
	wasoDuration: z.number().min(0).optional(),
	minHrValue: z.number().positive(),
	minHrTimestamp: z.string(),
	avgHr: z.number().positive(),
	hrvMean: z.number().min(0).optional(),
	respiratoryRateMean: z.number().min(0).optional(),
	temperatureDeviation: z.number().optional(),
	deviceTier: DeviceTierEnum,
})

export type NightlyMetrics = z.infer<typeof NightlyMetricsSchema>

export const CreateNightlyMetricsSchema = NightlyMetricsSchema

export type CreateNightlyMetrics = z.infer<typeof CreateNightlyMetricsSchema>

// --- Sleep Score Component Breakdown ---

export const ComponentBreakdownSchema = z.object({
	duration: z.number(),
	efficiency: z.number(),
	deep: z.number().optional(),
	rem: z.number().optional(),
	restfulness: z.number(),
	timing: z.number(),
	physioStability: z.number(),
})

export type ComponentBreakdown = z.infer<typeof ComponentBreakdownSchema>

// --- Readiness Component Breakdown ---

export const ReadinessBreakdownSchema = z.object({
	sleepScoreContrib: z.number(),
	hrvDeviation: z.number(),
	rhrDeviation: z.number(),
	recoveryIndex: z.number(),
	hrvTrendSlope: z.number(),
	sleepDebt: z.number(),
	activityLoad: z.number(),
})

export type ReadinessBreakdown = z.infer<typeof ReadinessBreakdownSchema>

// --- Sleep Score Response ---

export const SleepScoreSchema = z.object({
	id: z.string(),
	date: z.string(),
	sleepScore: z.number().min(0).max(100),
	readinessScore: z.number().min(0).max(100),
	sleepBreakdown: ComponentBreakdownSchema,
	readinessBreakdown: ReadinessBreakdownSchema,
	interactionFlags: z.array(z.string()),
	interactionFactor: z.number(),
	actionBucket: ActionBucketEnum,
	modelVersion: z.string(),
	calibrationPhase: z.number().int().min(1).max(3),
	deviceTier: DeviceTierEnum,
})

export type SleepScore = z.infer<typeof SleepScoreSchema>

// --- Baseline Stats ---

export const MetricBaselineSchema = z.object({
	mean: z.number(),
	std: z.number(),
	median: z.number(),
})

export type MetricBaseline = z.infer<typeof MetricBaselineSchema>

export const BaselineStatsSchema = z.object({
	duration: MetricBaselineSchema,
	efficiency: MetricBaselineSchema,
	deepPct: MetricBaselineSchema.optional(),
	remPct: MetricBaselineSchema.optional(),
	hrv: MetricBaselineSchema.optional(),
	restingHr: MetricBaselineSchema,
	respiratoryRate: MetricBaselineSchema.optional(),
	tempDeviation: MetricBaselineSchema.optional(),
	sleepMidpoint: MetricBaselineSchema,
	dataPointCount: z.number().int().min(0),
	lastUpdatedDate: z.string(),
	hrvSlope14d: z.number().optional(),
	durationSlope14d: z.number().optional(),
	sleepScoreSlope14d: z.number().optional(),
})

export type BaselineStats = z.infer<typeof BaselineStatsSchema>
