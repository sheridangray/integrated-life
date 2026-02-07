import mongoose, { Schema, Document, Model } from 'mongoose'

export type RefreshTokenDocument = Document & {
	userId: mongoose.Types.ObjectId
	tokenHash: string
	expiresAt: Date
	createdAt: Date
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		tokenHash: { type: String, required: true },
		expiresAt: { type: Date, required: true }
	},
	{ timestamps: true }
)

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
refreshTokenSchema.index({ userId: 1 })

export const RefreshToken: Model<RefreshTokenDocument> =
	mongoose.models.RefreshToken ?? mongoose.model<RefreshTokenDocument>('RefreshToken', refreshTokenSchema)
