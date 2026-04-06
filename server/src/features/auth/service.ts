import { OAuth2Client } from 'google-auth-library'
import { AppError } from '../../lib/errors'
import jwt from 'jsonwebtoken'
import { env } from '../../config'
import * as authRepository from './repository'
import type { User } from '@integrated-life/shared'

const googleClient = new OAuth2Client(
	env.GOOGLE_CLIENT_ID_WEB,
	env.GOOGLE_CLIENT_SECRET_WEB,
	'postmessage'
)

const ACCESS_TOKEN_EXPIRY = 60 * 15 // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7

function toUserResponse(doc: { _id: { toString(): string }; email: string; name: string; avatarUrl?: string }): User {
	return {
		id: doc._id.toString(),
		email: doc.email,
		name: doc.name,
		avatarUrl: doc.avatarUrl ?? null
	}
}

export async function authenticateWithGoogle(idToken: string, serverAuthCode?: string): Promise<{
	accessToken: string
	refreshToken: string
	expiresIn: number
	user: User
}> {
	let ticket
	try {
		ticket = await googleClient.verifyIdToken({
			idToken,
			audience: [env.GOOGLE_CLIENT_ID_WEB, env.GOOGLE_CLIENT_ID_IOS]
		})
	} catch {
		throw new AppError('Invalid Google token', 401)
	}

	const payload = ticket.getPayload()
	if (!payload?.email || !payload.sub) {
		throw new AppError('Invalid Google token: missing email or sub', 401)
	}

	const user = await authRepository.upsertUser({
		googleId: payload.sub,
		email: payload.email,
		name: payload.name ?? payload.email,
		avatarUrl: payload.picture
	})

	if (serverAuthCode) {
		try {
			const { tokens } = await googleClient.getToken(serverAuthCode)
			if (tokens.access_token) {
				const expiresAt = tokens.expiry_date
					? new Date(tokens.expiry_date)
					: new Date(Date.now() + 3600 * 1000)

				await authRepository.updateGoogleTokens(user._id.toString(), {
					accessToken: tokens.access_token,
					refreshToken: tokens.refresh_token ?? undefined,
					expiresAt
				})
			}
		} catch (err) {
			console.error('Failed to exchange Google auth code for tokens:', err)
		}
	}

	const accessToken = jwt.sign(
		{ userId: user._id.toString(), email: user.email },
		env.JWT_SECRET,
		{ expiresIn: ACCESS_TOKEN_EXPIRY }
	)

	const expiresAt = new Date()
	expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

	const { token: refreshToken } = await authRepository.createRefreshToken(user._id.toString(), expiresAt)

	return {
		accessToken,
		refreshToken,
		expiresIn: ACCESS_TOKEN_EXPIRY,
		user: toUserResponse(user)
	}
}

export async function refreshAccessToken(refreshToken: string): Promise<{
	accessToken: string
	expiresIn: number
	user: User
}> {
	const doc = await authRepository.findValidRefreshToken(refreshToken)
	if (!doc) {
		throw new AppError('Invalid or expired refresh token', 401)
	}

	const userRef = doc.userId as { _id: { toString(): string }; email: string; name: string; avatarUrl?: string }
	const userId = userRef._id.toString()

	const accessToken = jwt.sign(
		{ userId, email: userRef.email },
		env.JWT_SECRET,
		{ expiresIn: ACCESS_TOKEN_EXPIRY }
	)

	return {
		accessToken,
		expiresIn: ACCESS_TOKEN_EXPIRY,
		user: {
			id: userId,
			email: userRef.email,
			name: userRef.name,
			avatarUrl: userRef.avatarUrl ?? null
		}
	}
}
