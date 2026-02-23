import mongoose, { Schema, Document, Model } from 'mongoose'

export type MetricBaselineSubdoc = {
	mean: number
	std: number
	median: number
}

export type SleepBaselineDocument = Document & {
	userId: mongoose.Types.ObjectId
	duration: MetricBaselineSubdoc
	efficiency: MetricBaselineSubdoc
	deepPct?: MetricBaselineSubdoc
	remPct?: MetricBaselineSubdoc
	hrv?: MetricBaselineSubdoc
	restingHr: MetricBaselineSubdoc
	respiratoryRate?: MetricBaselineSubdoc
	tempDeviation?: MetricBaselineSubdoc
	sleepMidpoint: MetricBaselineSubdoc
	dataPointCount: number
	lastUpdatedDate: string
	hrvSlope14d?: number
	durationSlope14d?: number
	sleepScoreSlope14d?: number
	createdAt: Date
	updatedAt: Date
}

const metricBaselineSchema = new Schema<MetricBaselineSubdoc>(
	{
		mean: { type: Number, required: true },
		std: { type: Number, required: true },
		median: { type: Number, required: true },
	},
	{ _id: false }
)

const sleepBaselineSchema = new Schema<SleepBaselineDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
		duration: { type: metricBaselineSchema, required: true },
		efficiency: { type: metricBaselineSchema, required: true },
		deepPct: { type: metricBaselineSchema },
		remPct: { type: metricBaselineSchema },
		hrv: { type: metricBaselineSchema },
		restingHr: { type: metricBaselineSchema, required: true },
		respiratoryRate: { type: metricBaselineSchema },
		tempDeviation: { type: metricBaselineSchema },
		sleepMidpoint: { type: metricBaselineSchema, required: true },
		dataPointCount: { type: Number, required: true, default: 0 },
		lastUpdatedDate: { type: String, required: true },
		hrvSlope14d: { type: Number },
		durationSlope14d: { type: Number },
		sleepScoreSlope14d: { type: Number },
	},
	{ timestamps: true }
)

export const SleepBaseline: Model<SleepBaselineDocument> =
	mongoose.models.SleepBaseline ??
	mongoose.model<SleepBaselineDocument>('SleepBaseline', sleepBaselineSchema)
