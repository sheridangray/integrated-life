import mongoose, { Schema, Document, Model } from 'mongoose'

export type WorkoutExerciseSubdoc = {
	exerciseId: mongoose.Types.ObjectId
	order: number
	defaultSets?: number
	defaultReps?: number
	defaultWeight?: number
}

export type RecurrenceRuleSubdoc = {
	frequency: string
	interval: number
	daysOfWeek?: string[]
	dayOfMonth?: number
	endDate?: Date
	count?: number
}

export type WorkoutDocument = Document & {
	name: string
	difficulty: string
	isGlobal: boolean
	userId?: mongoose.Types.ObjectId
	exercises: WorkoutExerciseSubdoc[]
	schedule?: RecurrenceRuleSubdoc
	createdAt: Date
	updatedAt: Date
}

const workoutExerciseSchema = new Schema<WorkoutExerciseSubdoc>(
	{
		exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
		order: { type: Number, required: true },
		defaultSets: { type: Number },
		defaultReps: { type: Number },
		defaultWeight: { type: Number }
	},
	{ _id: false }
)

const recurrenceRuleSchema = new Schema<RecurrenceRuleSubdoc>(
	{
		frequency: { type: String, required: true },
		interval: { type: Number, default: 1 },
		daysOfWeek: [{ type: String }],
		dayOfMonth: { type: Number },
		endDate: { type: Date },
		count: { type: Number }
	},
	{ _id: false }
)

const workoutSchema = new Schema<WorkoutDocument>(
	{
		name: { type: String, required: true },
		difficulty: { type: String, required: true },
		isGlobal: { type: Boolean, default: false },
		userId: { type: Schema.Types.ObjectId, ref: 'User' },
		exercises: [workoutExerciseSchema],
		schedule: { type: recurrenceRuleSchema }
	},
	{ timestamps: true }
)

workoutSchema.index({ userId: 1 })
workoutSchema.index({ isGlobal: 1 })
workoutSchema.index({ difficulty: 1 })

export const Workout: Model<WorkoutDocument> =
	mongoose.models.Workout ?? mongoose.model<WorkoutDocument>('Workout', workoutSchema)
