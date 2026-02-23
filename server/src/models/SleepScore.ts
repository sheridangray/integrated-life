import mongoose, { Schema, Document, Model } from 'mongoose'

export type ComponentBreakdownSubdoc = {
	duration: number
	efficiency: number
	deep?: number
	rem?: number
	restfulness: number
	timing: number
	physioStability: number
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

const componentBreakdownSchema = new Schema<ComponentBreakdownSubdoc>(
	{
		duration: { type: Number, required: true },
		efficiency: { type: Number, required: true },
		deep: { type: Number },
		rem: { type: Number },
		restfulness: { type: Number, required: true },
		timing: { type: Number, required: true },
		physioStability: { type: Number, required: true },
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
