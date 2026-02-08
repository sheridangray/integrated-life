import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { AppError } from '../../../lib/errors'

// Mock google-auth-library — use vi.hoisted so the fn is available when vi.mock factory runs
const { mockVerifyIdToken } = vi.hoisted(() => ({
	mockVerifyIdToken: vi.fn(),
}))

vi.mock('google-auth-library', () => {
	return {
		OAuth2Client: function () {
			return { verifyIdToken: mockVerifyIdToken }
		},
	}
})

// Mock the repository
vi.mock('../repository', () => ({
	upsertUser: vi.fn(),
	createRefreshToken: vi.fn(),
	findValidRefreshToken: vi.fn(),
}))

import { authenticateWithGoogle, refreshAccessToken } from '../service'
import * as authRepository from '../repository'

const JWT_SECRET = process.env.JWT_SECRET!

describe('authenticateWithGoogle', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns tokens and user on success', async () => {
		mockVerifyIdToken.mockResolvedValue({
			getPayload: () => ({
				sub: 'google-123',
				email: 'test@example.com',
				name: 'Test User',
				picture: 'https://example.com/avatar.png',
			}),
		})

		const mockUser = {
			_id: { toString: () => '507f1f77bcf86cd799439011' },
			email: 'test@example.com',
			name: 'Test User',
			avatarUrl: 'https://example.com/avatar.png',
		}
		vi.mocked(authRepository.upsertUser).mockResolvedValue(mockUser as any)
		vi.mocked(authRepository.createRefreshToken).mockResolvedValue({
			token: 'refresh-token-xyz',
			tokenHash: 'hash-xyz',
		})

		const result = await authenticateWithGoogle('valid-id-token')

		expect(result.accessToken).toBeDefined()
		expect(result.refreshToken).toBe('refresh-token-xyz')
		expect(result.expiresIn).toBe(900)
		expect(result.user).toEqual({
			id: '507f1f77bcf86cd799439011',
			email: 'test@example.com',
			name: 'Test User',
			avatarUrl: 'https://example.com/avatar.png',
		})

		// Verify the JWT is valid
		const decoded = jwt.verify(result.accessToken, JWT_SECRET) as { userId: string; email: string }
		expect(decoded.userId).toBe('507f1f77bcf86cd799439011')
		expect(decoded.email).toBe('test@example.com')
	})

	it('throws AppError when Google verification fails', async () => {
		mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'))

		await expect(authenticateWithGoogle('bad-token')).rejects.toThrow(AppError)
		await expect(authenticateWithGoogle('bad-token')).rejects.toThrow('Invalid Google token')
	})

	it('throws AppError when payload is missing email', async () => {
		mockVerifyIdToken.mockResolvedValue({
			getPayload: () => ({
				sub: 'google-123',
				// no email
			}),
		})

		await expect(authenticateWithGoogle('token-no-email')).rejects.toThrow(AppError)
		await expect(authenticateWithGoogle('token-no-email')).rejects.toThrow('missing email or sub')
	})

	it('throws AppError when payload is missing sub', async () => {
		mockVerifyIdToken.mockResolvedValue({
			getPayload: () => ({
				email: 'test@example.com',
				// no sub
			}),
		})

		await expect(authenticateWithGoogle('token-no-sub')).rejects.toThrow(AppError)
	})

	it('uses email as name when name is not in payload', async () => {
		mockVerifyIdToken.mockResolvedValue({
			getPayload: () => ({
				sub: 'google-123',
				email: 'test@example.com',
				// no name
			}),
		})

		const mockUser = {
			_id: { toString: () => '507f1f77bcf86cd799439011' },
			email: 'test@example.com',
			name: 'test@example.com',
		}
		vi.mocked(authRepository.upsertUser).mockResolvedValue(mockUser as any)
		vi.mocked(authRepository.createRefreshToken).mockResolvedValue({
			token: 'refresh-xyz',
			tokenHash: 'hash-xyz',
		})

		await authenticateWithGoogle('token-no-name')

		expect(authRepository.upsertUser).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'test@example.com' })
		)
	})
})

describe('refreshAccessToken', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns a new access token and user on valid refresh token', async () => {
		const mockDoc = {
			userId: {
				_id: { toString: () => '507f1f77bcf86cd799439011' },
				email: 'test@example.com',
				name: 'Test User',
				avatarUrl: 'https://example.com/avatar.png',
			},
		}
		vi.mocked(authRepository.findValidRefreshToken).mockResolvedValue(mockDoc as any)

		const result = await refreshAccessToken('valid-refresh-token')

		expect(result.accessToken).toBeDefined()
		expect(result.expiresIn).toBe(900)
		expect(result.user).toEqual({
			id: '507f1f77bcf86cd799439011',
			email: 'test@example.com',
			name: 'Test User',
			avatarUrl: 'https://example.com/avatar.png',
		})

		// Verify the JWT is valid
		const decoded = jwt.verify(result.accessToken, JWT_SECRET) as { userId: string; email: string }
		expect(decoded.userId).toBe('507f1f77bcf86cd799439011')
		expect(decoded.email).toBe('test@example.com')
	})

	it('throws AppError when refresh token is invalid', async () => {
		vi.mocked(authRepository.findValidRefreshToken).mockResolvedValue(null)

		await expect(refreshAccessToken('bad-refresh')).rejects.toThrow(AppError)
		await expect(refreshAccessToken('bad-refresh')).rejects.toThrow('Invalid or expired refresh token')
	})

	it('returns null avatarUrl when user has no avatar', async () => {
		const mockDoc = {
			userId: {
				_id: { toString: () => '507f1f77bcf86cd799439011' },
				email: 'test@example.com',
				name: 'Test User',
				// no avatarUrl
			},
		}
		vi.mocked(authRepository.findValidRefreshToken).mockResolvedValue(mockDoc as any)

		const result = await refreshAccessToken('valid-refresh')

		expect(result.user.avatarUrl).toBeNull()
	})
})
