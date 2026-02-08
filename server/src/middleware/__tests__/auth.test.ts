import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { authMiddleware } from '../auth'
import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../auth'

const JWT_SECRET = process.env.JWT_SECRET!

function createMockReq(headers: Record<string, string> = {}): AuthenticatedRequest {
	return {
		headers,
		path: '/test',
	} as unknown as AuthenticatedRequest
}

function createMockRes() {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	}
	return res as unknown as Response
}

describe('authMiddleware', () => {
	it('returns 401 when no Authorization header is present', () => {
		const req = createMockReq()
		const res = createMockRes()
		const next = vi.fn()

		authMiddleware(req, res, next)

		expect(res.status).toHaveBeenCalledWith(401)
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
			})
		)
		expect(next).not.toHaveBeenCalled()
	})

	it('returns 401 when Authorization header has no Bearer prefix', () => {
		const req = createMockReq({ authorization: 'Basic abc123' })
		const res = createMockRes()
		const next = vi.fn()

		authMiddleware(req, res, next)

		expect(res.status).toHaveBeenCalledWith(401)
		expect(next).not.toHaveBeenCalled()
	})

	it('returns 401 when token is invalid', () => {
		const req = createMockReq({ authorization: 'Bearer invalid-token' })
		const res = createMockRes()
		const next = vi.fn()

		authMiddleware(req, res, next)

		expect(res.status).toHaveBeenCalledWith(401)
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({ message: 'Invalid or expired token' }),
			})
		)
		expect(next).not.toHaveBeenCalled()
	})

	it('returns 401 when token is expired', () => {
		const token = jwt.sign(
			{ userId: '507f1f77bcf86cd799439011', email: 'test@example.com' },
			JWT_SECRET,
			{ expiresIn: -10 } // already expired
		)
		const req = createMockReq({ authorization: `Bearer ${token}` })
		const res = createMockRes()
		const next = vi.fn()

		authMiddleware(req, res, next)

		expect(res.status).toHaveBeenCalledWith(401)
		expect(next).not.toHaveBeenCalled()
	})

	it('calls next() and sets req.user when token is valid', () => {
		const payload = { userId: '507f1f77bcf86cd799439011', email: 'test@example.com' }
		const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
		const req = createMockReq({ authorization: `Bearer ${token}` })
		const res = createMockRes()
		const next = vi.fn()

		authMiddleware(req, res, next)

		expect(next).toHaveBeenCalled()
		expect(req.user).toBeDefined()
		expect(req.user!.userId).toBe(payload.userId)
		expect(req.user!.email).toBe(payload.email)
	})
})
