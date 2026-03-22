import mongoose, { Schema, Document, Model } from 'mongoose'

export type UserDocument = Document & {
	googleId: string
	email: string
	name: string
	avatarUrl?: string
	gender?: 'female' | 'male' | 'other'
	dateOfBirth?: Date
	/** Hex APNs device tokens (most recent first), max ~8 */
	iosPushDeviceTokens?: string[]
	createdAt: Date
	updatedAt: Date
}

const userSchema = new Schema<UserDocument>(
	{
		googleId: { type: String, required: true, unique: true },
		email: { type: String, required: true },
		name: { type: String, required: true },
		avatarUrl: { type: String },
		gender: { type: String, enum: ['female', 'male', 'other'] },
		dateOfBirth: { type: Date },
		iosPushDeviceTokens: { type: [String], default: [] }
	},
	{ timestamps: true }
)

userSchema.index({ googleId: 1 })
userSchema.index({ email: 1 })

export const User: Model<UserDocument> = mongoose.models.User ?? mongoose.model<UserDocument>('User', userSchema)
