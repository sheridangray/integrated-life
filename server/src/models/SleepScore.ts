import mongoose, { Schema, Document, Model } from 'mongoose'

export type ComponentBreakdownSubdoc = {
	durationAdequacy: number
	consistency: number
	fragmentation: number
	recoveryPhysiology: number
	structure?: number
	timingAlignment: number
	preliminaryScore: number
	penaltyTotal: number
	penaltyFlags: string[]
	sleepNeedMinutes?: number
	sleepDebt7dSumMinutes?: number
	nightAvgHr?: number
	nightMinHr?: number
	nightHrvMean?: number
}

export type ReadinessBreakdownSubdoc = {
	sleepScoreContrib: number
	hrvDeviation: number
	rhrDeviation: number
	recoveryIndex: number
	hrvTrendSlope: number
	sleepDebt: number
	activityLoad: number
}

export type SleepScoreDocument = Document & {
	userId: mongoose.Types.ObjectId
	date: string
	sleepScore: number
	readinessScore: number
	sleepBreakdown: ComponentBreakdownSubdoc
	readinessBreakdown: ReadinessBreakdownSubdoc
	interactionFlags: string[]
	interactionFactor: number
	actionBucket: string
	modelVersion: string
	calibrationPhase: number
	deviceTier: string
	createdAt: Date
	updatedAt: Date
}

/** Legacy documents may still carry pre-v2 keys; new writes always use v2 shape (durationAdequacy, …). */
const componentBreakdownSchema = new Schema<ComponentBreakdownSubdoc>(
	{
		durationAdequacy: { type: Number, required: true },
		consistency: { type: Number, required: true },
		fragmentation: { type: Number, required: true },
		recoveryPhysiology: { type: Number, required: true },
		structure: { type: Number },
		timingAlignment: { type: Number, required: true },
		preliminaryScore: { type: Number, required: true },
		penaltyTotal: { type: Number, required: true },
		penaltyFlags: [{ type: String }],
		sleepNeedMinutes: { type: Number },
		sleepDebt7dSumMinutes: { type: Number },
		nightAvgHr: { type: Number },
		nightMinHr: { type: Number },
		nightHrvMean: { type: Number },
	},
	{ _id: false }
)

const readinessBreakdownSchema = new Schema<ReadinessBreakdownSubdoc>(
	{
		sleepScoreContrib: { type: Number, required: true },
		hrvDeviation: { type: Number, required: true },
		rhrDeviation: { type: Number, required: true },
		recoveryIndex: { type: Number, required: true },
		hrvTrendSlope: { type: Number, required: true },
		sleepDebt: { type: Number, required: true },
		activityLoad: { type: Number, required: true },
	},
	{ _id: false }
)

const sleepScoreSchema = new Schema<SleepScoreDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		date: { type: String, required: true },
		sleepScore: { type: Number, required: true },
		readinessScore: { type: Number, required: true },
		sleepBreakdown: { type: componentBreakdownSchema, required: true },
		readinessBreakdown: { type: readinessBreakdownSchema, required: true },
		interactionFlags: [{ type: String }],
		interactionFactor: { type: Number, required: true },
		actionBucket: { type: String, required: true },
		modelVersion: { type: String, required: true },
		calibrationPhase: { type: Number, required: true },
		deviceTier: { type: String, required: true },
	},
	{ timestamps: true }
)

sleepScoreSchema.index({ userId: 1, date: -1 }, { unique: true })

export const SleepScoreModel: Model<SleepScoreDocument> =
	mongoose.models.SleepScore ??
	mongoose.model<SleepScoreDocument>('SleepScore', sleepScoreSchema)
