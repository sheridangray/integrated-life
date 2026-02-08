import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'
import type { Express } from 'express'
import { setupIntegrationTest } from '../../../__tests__/integration-helper'

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

// Mock OpenAPI module — integration tests don't need spec generation
vi.mock('../../../lib/openapi', () => ({
	generateOpenAPIDocument: () => ({ openapi: '3.0.0', info: { title: 'test', version: '0.0.0' }, paths: {} }),
}))

import { createApp } from '../../../server/app'
import { errorHandler } from '../../../middleware/errorHandler'

describe('Auth integration tests', () => {
	setupIntegrationTest()

	let app: Express
	let accessToken: string
	let refreshToken: string

	beforeAll(() => {
		// Configure mock Google to return a valid payload
		mockVerifyIdToken.mockResolvedValue({
			getPayload: () => ({
				sub: 'google-integration-123',
				email: 'integration@example.com',
				name: 'Integration User',
				picture: 'https://example.com/avatar.png',
			}),
		})

		// Build the test app (same as production: createApp + errorHandler)
		app = createApp()
		app.use(errorHandler)
	})

	describe('POST /v1/auth/google', () => {
		it('returns 200 with tokens and user on valid idToken', async () => {
			const res = await request(app)
				.post('/v1/auth/google')
				.send({ idToken: 'mock-google-token' })
				.expect(200)

			expect(res.body.accessToken).toBeDefined()
			expect(res.body.refreshToken).toBeDefined()
			expect(res.body.expiresIn).toBe(900)
			expect(res.body.user).toEqual(
				expect.objectContaining({
					email: 'integration@example.com',
					name: 'Integration User',
				})
			)
			expect(res.body.user.id).toBeDefined()

			// Store tokens for subsequent tests
			accessToken = res.body.accessToken
			refreshToken = res.body.refreshToken
		})

		it('returns 400 when idToken is missing', async () => {
			const res = await request(app)
				.post('/v1/auth/google')
				.send({})
				.expect(400)

			expect(res.body.error.code).toBe('VALIDATION_ERROR')
		})
	})

	describe('POST /v1/auth/refresh', () => {
		it('returns 200 with a new access token', async () => {
			const res = await request(app)
				.post('/v1/auth/refresh')
				.send({ refreshToken })
				.expect(200)

			expect(res.body.accessToken).toBeDefined()
			expect(res.body.expiresIn).toBe(900)
			expect(res.body.user).toEqual(
				expect.objectContaining({
					email: 'integration@example.com',
				})
			)
		})

		it('returns 400 when refreshToken is missing', async () => {
			const res = await request(app)
				.post('/v1/auth/refresh')
				.send({})
				.expect(400)

			expect(res.body.error.code).toBe('VALIDATION_ERROR')
		})
	})

	describe('GET /v1/auth/me', () => {
		it('returns 401 without Authorization header', async () => {
			const res = await request(app)
				.get('/v1/auth/me')
				.expect(401)

			expect(res.body.error.code).toBe('UNAUTHORIZED')
		})

		it('returns 200 with user data when authenticated', async () => {
			const res = await request(app)
				.get('/v1/auth/me')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body.email).toBe('integration@example.com')
			expect(res.body.name).toBe('Integration User')
			expect(res.body.id).toBeDefined()
		})

		it('returns 401 with an invalid token', async () => {
			const res = await request(app)
				.get('/v1/auth/me')
				.set('Authorization', 'Bearer invalid-token-xyz')
				.expect(401)

			expect(res.body.error.code).toBe('UNAUTHORIZED')
		})
	})
})
