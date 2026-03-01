import mongoose, { Schema, Document, Model } from 'mongoose'

export type TimeBudgetDocument = Document & {
	userId: mongoose.Types.ObjectId
	categoryId: number
	period: 'daily' | 'weekly' | 'monthly'
	allocatedMinutes: number
	createdAt: Date
	updatedAt: Date
}

const timeBudgetSchema = new Schema<TimeBudgetDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		categoryId: { type: Number, required: true, min: 1, max: 15 },
		period: { type: String, required: true, enum: ['daily', 'weekly', 'monthly'] },
		allocatedMinutes: { type: Number, required: true, min: 0 }
	},
	{ timestamps: true }
)

timeBudgetSchema.index({ userId: 1, categoryId: 1, period: 1 }, { unique: true })

export const TimeBudget: Model<TimeBudgetDocument> =
	mongoose.models.TimeBudget ?? mongoose.model<TimeBudgetDocument>('TimeBudget', timeBudgetSchema)
