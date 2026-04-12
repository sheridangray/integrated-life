import mongoose, { Schema, Document, Model } from 'mongoose'

export type ExerciseDocument = Document & {
	name: string
	slug: string
	muscles: string[]
	bodyParts: string[]
	resistanceType: string
	measurementType: string
	steps: string[]
	videoUrl?: string
	category?: string
	isGlobal: boolean
	createdAt: Date
	updatedAt: Date
}

const exerciseSchema = new Schema<ExerciseDocument>(
	{
		name: { type: String, required: true, unique: true },
		slug: { type: String, required: true, unique: true },
		muscles: [{ type: String, required: true }],
		bodyParts: [{ type: String, required: true }],
		resistanceType: { type: String, required: true },
		measurementType: { type: String, required: true },
		steps: [{ type: String }],
		videoUrl: { type: String },
		category: { type: String },
		isGlobal: { type: Boolean, default: true }
	},
	{ timestamps: true }
)

exerciseSchema.index({ bodyParts: 1 })
exerciseSchema.index({ muscles: 1 })
exerciseSchema.index({ resistanceType: 1 })

export const Exercise: Model<ExerciseDocument> =
	mongoose.models.Exercise ?? mongoose.model<ExerciseDocument>('Exercise', exerciseSchema)
