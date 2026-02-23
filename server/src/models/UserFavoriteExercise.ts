import mongoose, { Schema, Document, Model } from 'mongoose'

export type UserFavoriteExerciseDocument = Document & {
	userId: mongoose.Types.ObjectId
	exerciseId: mongoose.Types.ObjectId
	createdAt: Date
}

const userFavoriteExerciseSchema = new Schema<UserFavoriteExerciseDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true }
	},
	{ timestamps: true }
)

userFavoriteExerciseSchema.index({ userId: 1, exerciseId: 1 }, { unique: true })
userFavoriteExerciseSchema.index({ userId: 1 })

export const UserFavoriteExercise: Model<UserFavoriteExerciseDocument> =
	mongoose.models.UserFavoriteExercise ??
	mongoose.model<UserFavoriteExerciseDocument>('UserFavoriteExercise', userFavoriteExerciseSchema)
