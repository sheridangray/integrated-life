import { z } from 'zod'

export const GoogleAuthRequestSchema = z.object({
	idToken: z.string().min(1, 'idToken is required')
})

export type GoogleAuthRequest = z.infer<typeof GoogleAuthRequestSchema>

export const UserSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	name: z.string(),
	avatarUrl: z.string().url().optional().nullable()
})

export type User = z.infer<typeof UserSchema>

export const AuthResponseSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	expiresIn: z.number(),
	user: UserSchema
})

export type AuthResponse = z.infer<typeof AuthResponseSchema>

export const RefreshRequestSchema = z.object({
	refreshToken: z.string().min(1, 'refreshToken is required')
})

export type RefreshRequest = z.infer<typeof RefreshRequestSchema>
