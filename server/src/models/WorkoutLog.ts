import mongoose, { Schema, Document, Model } from 'mongoose'

export type WorkoutLogDocument = Document & {
	userId: mongoose.Types.ObjectId
	workoutId: mongoose.Types.ObjectId
	date: string
	startTime: string
	endTime: string
	exerciseLogIds: mongoose.Types.ObjectId[]
	completedAll: boolean
	createdAt: Date
	updatedAt: Date
}

const workoutLogSchema = new Schema<WorkoutLogDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		workoutId: { type: Schema.Types.ObjectId, ref: 'Workout', required: true },
		date: { type: String, required: true },
		startTime: { type: String, required: true },
		endTime: { type: String, required: true },
		exerciseLogIds: [{ type: Schema.Types.ObjectId, ref: 'ExerciseLog' }],
		completedAll: { type: Boolean, default: false }
	},
	{ timestamps: true }
)

workoutLogSchema.index({ userId: 1, date: -1 })
workoutLogSchema.index({ userId: 1, workoutId: 1, date: -1 })

export const WorkoutLog: Model<WorkoutLogDocument> =
	mongoose.models.WorkoutLog ?? mongoose.model<WorkoutLogDocument>('WorkoutLog', workoutLogSchema)
