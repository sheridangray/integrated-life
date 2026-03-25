import mongoose, { Schema, Document, Model } from 'mongoose'

export type SleepNightlyMetricsDocument = Document & {
	userId: mongoose.Types.ObjectId
	date: string
	sleepStartTime: string
	sleepEndTime: string
	sleepMidpoint: string
	totalAsleepDuration: number
	totalInBedDuration: number
	deepDuration?: number
	remDuration?: number
	coreDuration?: number
	wasoDuration?: number
	awakeAfterOnsetMinutes?: number
	awakeningCountOver2m?: number
	longestAwakeEpisodeMinutes?: number
	minHrValue: number
	minHrTimestamp: string
	avgHr: number
	hrvMean?: number
	respiratoryRateMean?: number
	temperatureDeviation?: number
	deviceTier: 'A' | 'B' | 'C'
	createdAt: Date
	updatedAt: Date
}

const sleepNightlyMetricsSchema = new Schema<SleepNightlyMetricsDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		date: { type: String, required: true },
		sleepStartTime: { type: String, required: true },
		sleepEndTime: { type: String, required: true },
		sleepMidpoint: { type: String, required: true },
		totalAsleepDuration: { type: Number, required: true },
		totalInBedDuration: { type: Number, required: true },
		deepDuration: { type: Number },
		remDuration: { type: Number },
		coreDuration: { type: Number },
		wasoDuration: { type: Number },
		awakeAfterOnsetMinutes: { type: Number },
		awakeningCountOver2m: { type: Number },
		longestAwakeEpisodeMinutes: { type: Number },
		minHrValue: { type: Number, required: true },
		minHrTimestamp: { type: String, required: true },
		avgHr: { type: Number, required: true },
		hrvMean: { type: Number },
		respiratoryRateMean: { type: Number },
		temperatureDeviation: { type: Number },
		deviceTier: { type: String, enum: ['A', 'B', 'C'], required: true },
	},
	{ timestamps: true }
)

sleepNightlyMetricsSchema.index({ userId: 1, date: -1 }, { unique: true })

export const SleepNightlyMetrics: Model<SleepNightlyMetricsDocument> =
	mongoose.models.SleepNightlyMetrics ??
	mongoose.model<SleepNightlyMetricsDocument>('SleepNightlyMetrics', sleepNightlyMetricsSchema)
