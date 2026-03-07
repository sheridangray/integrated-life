import mongoose, { Schema, Document, Model } from 'mongoose'

export type HealthReportDocument = Document & {
	userId: mongoose.Types.ObjectId
	type: 'weekly' | 'on_demand'
	periodStart: Date
	periodEnd: Date
	report: string
	metrics: string[]
	generatedAt: Date
	createdAt: Date
	updatedAt: Date
}

const healthReportSchema = new Schema<HealthReportDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		type: { type: String, enum: ['weekly', 'on_demand'], required: true },
		periodStart: { type: Date, required: true },
		periodEnd: { type: Date, required: true },
		report: { type: String, required: true },
		metrics: [{ type: String }],
		generatedAt: { type: Date, required: true }
	},
	{ timestamps: true }
)

healthReportSchema.index({ userId: 1, generatedAt: -1 })
healthReportSchema.index({ userId: 1, type: 1, periodEnd: -1 })

export const HealthReport: Model<HealthReportDocument> =
	mongoose.models.HealthReport ?? mongoose.model<HealthReportDocument>('HealthReport', healthReportSchema)
