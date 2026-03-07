import mongoose, { Schema, Document, Model } from 'mongoose'

export type HealthSampleDocument = Document & {
	userId: mongoose.Types.ObjectId
	sampleType: string
	date: Date
	value: number
	unit: string
	source?: string
	createdAt: Date
	updatedAt: Date
}

const healthSampleSchema = new Schema<HealthSampleDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		sampleType: { type: String, required: true },
		date: { type: Date, required: true },
		value: { type: Number, required: true },
		unit: { type: String, required: true },
		source: { type: String }
	},
	{ timestamps: true }
)

healthSampleSchema.index({ userId: 1, sampleType: 1, date: 1 }, { unique: true })
healthSampleSchema.index({ userId: 1, sampleType: 1, date: -1 })
healthSampleSchema.index({ userId: 1, date: -1 })

export const HealthSample: Model<HealthSampleDocument> =
	mongoose.models.HealthSample ?? mongoose.model<HealthSampleDocument>('HealthSample', healthSampleSchema)
