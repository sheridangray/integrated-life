import mongoose, { Schema, Document, Model } from 'mongoose'

export type ExerciseSetSubdoc = {
	setNumber: number
	weight?: number
	reps?: number
	minutes?: number
	seconds?: number
	miles?: number
	kilometers?: number
	meters?: number
}

export type ExerciseLogDocument = Document & {
	userId: mongoose.Types.ObjectId
	exerciseId: mongoose.Types.ObjectId
	date: string
	startTime: string
	endTime: string
	resistanceType: string
	sets: ExerciseSetSubdoc[]
	notes?: string
	writtenToHealthKit: boolean
	createdAt: Date
	updatedAt: Date
}

const exerciseSetSchema = new Schema<ExerciseSetSubdoc>(
	{
		setNumber: { type: Number, required: true },
		weight: { type: Number },
		reps: { type: Number },
		minutes: { type: Number },
		seconds: { type: Number },
		miles: { type: Number },
		kilometers: { type: Number },
		meters: { type: Number }
	},
	{ _id: false }
)

const exerciseLogSchema = new Schema<ExerciseLogDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
		date: { type: String, required: true },
		startTime: { type: String, required: true },
		endTime: { type: String, required: true },
		resistanceType: { type: String, required: true },
		sets: [exerciseSetSchema],
		notes: { type: String },
		writtenToHealthKit: { type: Boolean, default: false }
	},
	{ timestamps: true }
)

exerciseLogSchema.index({ userId: 1, date: -1 })
exerciseLogSchema.index({ userId: 1, exerciseId: 1, date: -1 })

export const ExerciseLog: Model<ExerciseLogDocument> =
	mongoose.models.ExerciseLog ?? mongoose.model<ExerciseLogDocument>('ExerciseLog', exerciseLogSchema)
