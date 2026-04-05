import mongoose, { Schema, Document, Model } from 'mongoose'

export type RoutineRecurrenceRule = {
	frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
	interval: number
	daysOfWeek?: number[]
	dayOfMonth?: number
}

export type RoutineDocument = Document & {
	userId: mongoose.Types.ObjectId
	title: string
	defaultTime: string | null
	defaultDuration: number
	color: string
	icon: string
	notes?: string
	recurrenceRule: RoutineRecurrenceRule
	isActive: boolean
	skippedDates: string[]
	createdAt: Date
	updatedAt: Date
}

const recurrenceRuleSchema = new Schema(
	{
		frequency: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
		interval: { type: Number, required: true, min: 1, default: 1 },
		daysOfWeek: { type: [Number] },
		dayOfMonth: { type: Number, min: 1, max: 31 }
	},
	{ _id: false }
)

const routineSchema = new Schema<RoutineDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		title: { type: String, required: true, trim: true },
		defaultTime: { type: String, default: null },
		defaultDuration: { type: Number, required: true, min: 1, max: 1440, default: 30 },
		color: { type: String, required: true, default: '#4DABF7' },
		icon: { type: String, required: true, default: 'arrow.triangle.2.circlepath' },
		notes: { type: String },
		recurrenceRule: { type: recurrenceRuleSchema, required: true },
		isActive: { type: Boolean, default: true },
		skippedDates: { type: [String], default: [] }
	},
	{ timestamps: true }
)

routineSchema.index({ userId: 1, isActive: 1 })

export const Routine: Model<RoutineDocument> =
	mongoose.models.Routine ?? mongoose.model<RoutineDocument>('Routine', routineSchema)
