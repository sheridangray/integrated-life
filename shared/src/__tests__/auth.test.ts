import { describe, it, expect } from 'vitest'
import {
	GoogleAuthRequestSchema,
	UserSchema,
	AuthResponseSchema,
	RefreshRequestSchema,
} from '../auth'

describe('GoogleAuthRequestSchema', () => {
	it('accepts a valid idToken', () => {
		const result = GoogleAuthRequestSchema.safeParse({ idToken: 'abc123' })
		expect(result.success).toBe(true)
	})

	it('rejects an empty idToken', () => {
		const result = GoogleAuthRequestSchema.safeParse({ idToken: '' })
		expect(result.success).toBe(false)
	})

	it('rejects a missing idToken', () => {
		const result = GoogleAuthRequestSchema.safeParse({})
		expect(result.success).toBe(false)
	})

	it('rejects a non-string idToken', () => {
		const result = GoogleAuthRequestSchema.safeParse({ idToken: 123 })
		expect(result.success).toBe(false)
	})
})

describe('UserSchema', () => {
	const validUser = {
		id: '507f1f77bcf86cd799439011',
		email: 'test@example.com',
		name: 'Test User',
		avatarUrl: 'https://example.com/avatar.png',
	}

	it('accepts a valid user', () => {
		const result = UserSchema.safeParse(validUser)
		expect(result.success).toBe(true)
	})

	it('accepts a user with null avatarUrl', () => {
		const result = UserSchema.safeParse({ ...validUser, avatarUrl: null })
		expect(result.success).toBe(true)
	})

	it('accepts a user without avatarUrl', () => {
		const { avatarUrl, ...userWithoutAvatar } = validUser
		const result = UserSchema.safeParse(userWithoutAvatar)
		expect(result.success).toBe(true)
	})

	it('rejects a missing email', () => {
		const { email, ...noEmail } = validUser
		const result = UserSchema.safeParse(noEmail)
		expect(result.success).toBe(false)
	})

	it('rejects an invalid email', () => {
		const result = UserSchema.safeParse({ ...validUser, email: 'not-an-email' })
		expect(result.success).toBe(false)
	})

	it('rejects an invalid avatarUrl', () => {
		const result = UserSchema.safeParse({ ...validUser, avatarUrl: 'not-a-url' })
		expect(result.success).toBe(false)
	})
})

describe('AuthResponseSchema', () => {
	const validUser = {
		id: '507f1f77bcf86cd799439011',
		email: 'test@example.com',
		name: 'Test User',
		avatarUrl: null,
	}

	const validResponse = {
		accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
		refreshToken: 'abc123refresh',
		expiresIn: 900,
		user: validUser,
	}

	it('accepts a valid auth response', () => {
		const result = AuthResponseSchema.safeParse(validResponse)
		expect(result.success).toBe(true)
	})

	it('rejects a missing accessToken', () => {
		const { accessToken, ...noToken } = validResponse
		const result = AuthResponseSchema.safeParse(noToken)
		expect(result.success).toBe(false)
	})

	it('rejects a missing refreshToken', () => {
		const { refreshToken, ...noRefresh } = validResponse
		const result = AuthResponseSchema.safeParse(noRefresh)
		expect(result.success).toBe(false)
	})

	it('rejects a non-number expiresIn', () => {
		const result = AuthResponseSchema.safeParse({ ...validResponse, expiresIn: '900' })
		expect(result.success).toBe(false)
	})

	it('rejects a missing user', () => {
		const { user, ...noUser } = validResponse
		const result = AuthResponseSchema.safeParse(noUser)
		expect(result.success).toBe(false)
	})
})

describe('RefreshRequestSchema', () => {
	it('accepts a valid refreshToken', () => {
		const result = RefreshRequestSchema.safeParse({ refreshToken: 'abc123' })
		expect(result.success).toBe(true)
	})

	it('rejects an empty refreshToken', () => {
		const result = RefreshRequestSchema.safeParse({ refreshToken: '' })
		expect(result.success).toBe(false)
	})

	it('rejects a missing refreshToken', () => {
		const result = RefreshRequestSchema.safeParse({})
		expect(result.success).toBe(false)
	})
})
