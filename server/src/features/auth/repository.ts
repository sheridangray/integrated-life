import mongoose from 'mongoose'
import { User as UserModel } from '../../models/User'
import { RefreshToken as RefreshTokenModel } from '../../models/RefreshToken'
import type { RefreshTokenDocument } from '../../models/RefreshToken'
import type { UserDocument } from '../../models/User'
import crypto from 'crypto'

export async function findUserByGoogleId(googleId: string): Promise<UserDocument | null> {
	return UserModel.findOne({ googleId }).exec()
}

export async function upsertUser(data: {
	googleId: string
	email: string
	name: string
	avatarUrl?: string
}): Promise<UserDocument> {
	return UserModel.findOneAndUpdate(
		{ googleId: data.googleId },
		{ $set: { email: data.email, name: data.name, avatarUrl: data.avatarUrl } },
		{ new: true, upsert: true, runValidators: true }
	).exec() as Promise<UserDocument>
}

export function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex')
}

export async function createRefreshToken(userId: string, expiresAt: Date): Promise<{ token: string; tokenHash: string }> {
	const token = crypto.randomBytes(32).toString('hex')
	const tokenHash = hashToken(token)

	await RefreshTokenModel.create({
		userId,
		tokenHash,
		expiresAt
	})

	return { token, tokenHash }
}

export type RefreshTokenWithUser = RefreshTokenDocument & {
	userId: { _id: mongoose.Types.ObjectId; email: string; name: string; avatarUrl?: string }
}

export async function findValidRefreshToken(token: string): Promise<RefreshTokenWithUser | null> {
	const tokenHash = hashToken(token)
	const doc = await RefreshTokenModel.findOne({ tokenHash, expiresAt: { $gt: new Date() } })
		.populate('userId', 'email name avatarUrl')
		.exec()

	return doc as RefreshTokenWithUser | null
}

export async function deleteRefreshToken(token: string): Promise<void> {
	const tokenHash = hashToken(token)
	await RefreshTokenModel.deleteOne({ tokenHash }).exec()
}
