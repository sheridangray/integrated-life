import mongoose, { Schema, Document, Model } from 'mongoose'

export type CleanerRotationDocument = Document & {
	userId: mongoose.Types.ObjectId
	nextRotationIndex: number
	nextRunDate: string
	rotation: Array<{
		index: number
		area: string
		details: string
	}>
	createdAt: Date
	updatedAt: Date
}

const cleanerRotationSchema = new Schema<CleanerRotationDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
		nextRotationIndex: { type: Number, required: true },
		nextRunDate: { type: String, required: true },
		rotation: [
			{
				index: { type: Number, required: true },
				area: { type: String, required: true },
				details: { type: String, required: true },
				_id: false
			}
		]
	},
	{ timestamps: true }
)

export const CleanerRotation: Model<CleanerRotationDocument> =
	mongoose.models.CleanerRotation ??
	mongoose.model<CleanerRotationDocument>('CleanerRotation', cleanerRotationSchema)
