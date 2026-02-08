import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../../middleware/auth'

// Mock the service module
vi.mock('../service', () => ({
	authenticateWithGoogle: vi.fn(),
	refreshAccessToken: vi.fn(),
}))

// Mock the User model
vi.mock('../../../models/User', () => ({
	User: {
		findById: vi.fn(),
	},
}))

import { googleAuth, refresh, me } from '../controller'
import * as authService from '../service'
import { User } from '../../../models/User'

function createMockReq(body: unknown = {}, user?: { userId: string; email: string }): Request {
	const req = {
		body,
		headers: {},
		path: '/test',
		id: 'req-test-123',
		user,
	}
	return req as unknown as Request
}

function createMockRes() {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	}
	return res as unknown as Response
}

describe('googleAuth controller', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns 400 when body is empty', async () => {
		const req = createMockReq({})
		const res = createMockRes()

		await googleAuth(req, res)

		expect(res.status).toHaveBeenCalledWith(400)
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
			})
		)
	})

	it('returns 400 when idToken is empty string', async () => {
		const req = createMockReq({ idToken: '' })
		const res = createMockRes()

		await googleAuth(req, res)

		expect(res.status).toHaveBeenCalledWith(400)
	})

	it('calls authService.authenticateWithGoogle on valid body', async () => {
		const mockResult = {
			accessToken: 'access-xyz',
			refreshToken: 'refresh-xyz',
			expiresIn: 900,
			user: { id: '123', email: 'test@example.com', name: 'Test', avatarUrl: null },
		}
		vi.mocked(authService.authenticateWithGoogle).mockResolvedValue(mockResult)

		const req = createMockReq({ idToken: 'valid-token' })
		const res = createMockRes()

		await googleAuth(req, res)

		expect(authService.authenticateWithGoogle).toHaveBeenCalledWith('valid-token')
		expect(res.json).toHaveBeenCalledWith(mockResult)
	})
})

describe('refresh controller', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns 400 when body is empty', async () => {
		const req = createMockReq({})
		const res = createMockRes()

		await refresh(req, res)

		expect(res.status).toHaveBeenCalledWith(400)
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
			})
		)
	})

	it('returns 400 when refreshToken is empty string', async () => {
		const req = createMockReq({ refreshToken: '' })
		const res = createMockRes()

		await refresh(req, res)

		expect(res.status).toHaveBeenCalledWith(400)
	})

	it('calls authService.refreshAccessToken on valid body', async () => {
		const mockResult = {
			accessToken: 'new-access-xyz',
			expiresIn: 900,
			user: { id: '123', email: 'test@example.com', name: 'Test', avatarUrl: null },
		}
		vi.mocked(authService.refreshAccessToken).mockResolvedValue(mockResult)

		const req = createMockReq({ refreshToken: 'valid-refresh' })
		const res = createMockRes()

		await refresh(req, res)

		expect(authService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh')
		expect(res.json).toHaveBeenCalledWith(mockResult)
	})
})

describe('me controller', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns 401 when req.user is not set', async () => {
		const req = createMockReq() as unknown as AuthenticatedRequest
		const res = createMockRes()

		await me(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
			})
		)
	})

	it('returns 404 when user is not found in DB', async () => {
		const mockExec = vi.fn().mockResolvedValue(null)
		vi.mocked(User.findById).mockReturnValue({ exec: mockExec } as any)

		const req = createMockReq({}, { userId: '507f1f77bcf86cd799439011', email: 'test@example.com' }) as unknown as AuthenticatedRequest
		const res = createMockRes()

		await me(req, res)

		expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
		expect(res.status).toHaveBeenCalledWith(404)
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({ code: 'NOT_FOUND' }),
			})
		)
	})

	it('returns 200 with user data when user exists', async () => {
		const mockUser = {
			_id: { toString: () => '507f1f77bcf86cd799439011' },
			email: 'test@example.com',
			name: 'Test User',
			avatarUrl: 'https://example.com/avatar.png',
		}
		const mockExec = vi.fn().mockResolvedValue(mockUser)
		vi.mocked(User.findById).mockReturnValue({ exec: mockExec } as any)

		const req = createMockReq({}, { userId: '507f1f77bcf86cd799439011', email: 'test@example.com' }) as unknown as AuthenticatedRequest
		const res = createMockRes()

		await me(req, res)

		expect(res.json).toHaveBeenCalledWith({
			id: '507f1f77bcf86cd799439011',
			email: 'test@example.com',
			name: 'Test User',
			avatarUrl: 'https://example.com/avatar.png',
		})
	})

	it('returns null avatarUrl when user has no avatar', async () => {
		const mockUser = {
			_id: { toString: () => '507f1f77bcf86cd799439011' },
			email: 'test@example.com',
			name: 'Test User',
		}
		const mockExec = vi.fn().mockResolvedValue(mockUser)
		vi.mocked(User.findById).mockReturnValue({ exec: mockExec } as any)

		const req = createMockReq({}, { userId: '507f1f77bcf86cd799439011', email: 'test@example.com' }) as unknown as AuthenticatedRequest
		const res = createMockRes()

		await me(req, res)

		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ avatarUrl: null })
		)
	})
})
