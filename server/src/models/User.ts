import mongoose, { Schema, Document, Model } from 'mongoose'

export type UserDocument = Document & {
	googleId: string
	email: string
	name: string
	avatarUrl?: string
	createdAt: Date
	updatedAt: Date
}

const userSchema = new Schema<UserDocument>(
	{
		googleId: { type: String, required: true, unique: true },
		email: { type: String, required: true },
		name: { type: String, required: true },
		avatarUrl: { type: String }
	},
	{ timestamps: true }
)

userSchema.index({ googleId: 1 })
userSchema.index({ email: 1 })

export const User: Model<UserDocument> = mongoose.models.User ?? mongoose.model<UserDocument>('User', userSchema)
