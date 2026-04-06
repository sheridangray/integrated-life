import mongoose, { Schema, Document, Model } from 'mongoose'

export type RecurrenceRuleData = {
	frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
	interval: number
	daysOfWeek?: number[]
	dayOfMonth?: number
}

export type TaskDocument = Document & {
	userId: mongoose.Types.ObjectId
	title: string
	date: string | null
	startTime: string | null
	durationMinutes: number
	color: string
	icon: string
	notes?: string
	source: 'manual' | 'routine' | 'calendar'
	routineId?: mongoose.Types.ObjectId
	calendarEventId?: string
	completedAt?: Date | null
	isRecurring: boolean
	recurrenceRule?: RecurrenceRuleData
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

const taskSchema = new Schema<TaskDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		title: { type: String, required: true, trim: true },
		date: { type: String, default: null },
		startTime: { type: String, default: null },
		durationMinutes: { type: Number, required: true, min: 1, max: 1440 },
		color: { type: String, required: true, default: '#FF6B6B' },
		icon: { type: String, required: true, default: 'circle.fill' },
		notes: { type: String },
		source: { type: String, required: true, enum: ['manual', 'routine', 'calendar'], default: 'manual' },
		routineId: { type: Schema.Types.ObjectId, ref: 'Routine' },
		calendarEventId: { type: String },
		completedAt: { type: Date, default: null },
		isRecurring: { type: Boolean, default: false },
		recurrenceRule: { type: recurrenceRuleSchema }
	},
	{ timestamps: true }
)

taskSchema.index({ userId: 1, date: 1 })
taskSchema.index({ userId: 1, routineId: 1, date: 1 })
taskSchema.index({ userId: 1, calendarEventId: 1 }, { sparse: true })

export const Task: Model<TaskDocument> =
	mongoose.models.Task ?? mongoose.model<TaskDocument>('Task', taskSchema)
