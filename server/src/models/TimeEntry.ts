import mongoose, { Schema, Document, Model } from 'mongoose'

export type TimeEntryDocument = Document & {
	userId: mongoose.Types.ObjectId
	categoryId: number
	startTime: Date
	endTime?: Date | null
	notes?: string
	createdAt: Date
	updatedAt: Date
}

const timeEntrySchema = new Schema<TimeEntryDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		categoryId: { type: Number, required: true, min: 1, max: 15 },
		startTime: { type: Date, required: true },
		endTime: { type: Date, default: null },
		notes: { type: String }
	},
	{ timestamps: true }
)

timeEntrySchema.index({ userId: 1, endTime: 1 })
timeEntrySchema.index({ userId: 1, startTime: -1 })

export const TimeEntry: Model<TimeEntryDocument> =
	mongoose.models.TimeEntry ?? mongoose.model<TimeEntryDocument>('TimeEntry', timeEntrySchema)
