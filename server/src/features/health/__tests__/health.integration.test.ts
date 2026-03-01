import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'
import type { Express } from 'express'
import jwt from 'jsonwebtoken'
import { setupIntegrationTest } from '../../../__tests__/integration-helper'

// Mock google-auth-library (required by auth middleware transitive imports)
vi.mock('google-auth-library', () => {
	return {
		OAuth2Client: function () {
			return { verifyIdToken: vi.fn() }
		},
	}
})

// Mock OpenAPI — integration tests don't need spec generation
vi.mock('../../../lib/openapi', () => ({
	generateOpenAPIDocument: () => ({
		openapi: '3.0.0',
		info: { title: 'test', version: '0.0.0' },
		paths: {},
	}),
}))

// Mock Together AI so AI endpoints don't make real API calls
vi.mock('../../../integrations/together', () => ({
	chatCompletion: vi.fn().mockResolvedValue('Test AI insight response'),
}))

import { createApp } from '../../../server/app'
import { errorHandler } from '../../../middleware/errorHandler'
import { seedHealthData } from '../../../seeds/health'

describe('Health integration tests', () => {
	setupIntegrationTest()

	let app: Express
	let accessToken: string
	const userId = '507f1f77bcf86cd799439011'

	beforeAll(async () => {
		app = createApp()
		app.use(errorHandler)

		// Seed exercises and workouts
		await seedHealthData()

		// Generate a test JWT
		accessToken = jwt.sign(
			{ userId, email: 'test@example.com' },
			process.env.JWT_SECRET!,
			{ expiresIn: '15m' }
		)
	})

	// --- Exercises ---

	describe('GET /v1/exercises', () => {
		it('returns seeded exercises', async () => {
			const res = await request(app).get('/v1/exercises').expect(200)

			expect(Array.isArray(res.body)).toBe(true)
			expect(res.body.length).toBeGreaterThan(0)
			expect(res.body[0]).toHaveProperty('id')
			expect(res.body[0]).toHaveProperty('name')
			expect(res.body[0]).toHaveProperty('slug')
		})

		it('filters by bodyPart', async () => {
			const res = await request(app)
				.get('/v1/exercises')
				.query({ bodyPart: 'Chest' })
				.expect(200)

			for (const exercise of res.body) {
				expect(exercise.bodyParts).toContain('Chest')
			}
		})

		it('filters by search', async () => {
			const res = await request(app)
				.get('/v1/exercises')
				.query({ search: 'bench' })
				.expect(200)

			expect(res.body.length).toBeGreaterThan(0)
			for (const exercise of res.body) {
				expect(exercise.name.toLowerCase()).toContain('bench')
			}
		})
	})

	describe('GET /v1/exercises/:id', () => {
		it('returns exercise detail', async () => {
			const listRes = await request(app).get('/v1/exercises').expect(200)
			const exerciseId = listRes.body[0].id

			const res = await request(app)
				.get(`/v1/exercises/${exerciseId}`)
				.expect(200)

			expect(res.body.id).toBe(exerciseId)
			expect(res.body).toHaveProperty('steps')
			expect(res.body).toHaveProperty('muscles')
		})

		it('returns 404 for nonexistent exercise', async () => {
			const res = await request(app)
				.get('/v1/exercises/000000000000000000000000')
				.expect(404)

			expect(res.body.error.code).toBe('NOT_FOUND')
		})
	})

	describe('POST /v1/exercises/:id/favorite', () => {
		it('returns 401 without auth', async () => {
			await request(app)
				.post('/v1/exercises/000000000000000000000000/favorite')
				.expect(401)
		})

		it('toggles favorite on and off', async () => {
			const listRes = await request(app).get('/v1/exercises').expect(200)
			const exerciseId = listRes.body[0].id

			// Toggle on
			const onRes = await request(app)
				.post(`/v1/exercises/${exerciseId}/favorite`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(onRes.body.isFavorite).toBe(true)

			// Toggle off
			const offRes = await request(app)
				.post(`/v1/exercises/${exerciseId}/favorite`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(offRes.body.isFavorite).toBe(false)
		})
	})

	describe('POST /v1/exercises/:id/log', () => {
		it('returns 401 without auth', async () => {
			await request(app)
				.post('/v1/exercises/000000000000000000000000/log')
				.send({})
				.expect(401)
		})

		it('returns 400 on invalid body', async () => {
			const listRes = await request(app).get('/v1/exercises').expect(200)
			const exerciseId = listRes.body[0].id

			await request(app)
				.post(`/v1/exercises/${exerciseId}/log`)
				.set('Authorization', `Bearer ${accessToken}`)
				.send({})
				.expect(400)
		})

		it('creates exercise log and returns 201', async () => {
			const listRes = await request(app).get('/v1/exercises').expect(200)
			const exerciseId = listRes.body[0].id

			const logData = {
				exerciseId,
				date: '2026-02-16',
				startTime: '09:00',
				endTime: '09:30',
				resistanceType: 'Weights (Free)',
				sets: [{ setNumber: 1, weight: 135, reps: 10 }],
			}

			const res = await request(app)
				.post(`/v1/exercises/${exerciseId}/log`)
				.set('Authorization', `Bearer ${accessToken}`)
				.send(logData)
				.expect(201)

			expect(res.body).toHaveProperty('id')
			expect(res.body.exerciseId).toBe(exerciseId)
			expect(res.body.sets).toHaveLength(1)
		})
	})

	describe('GET /v1/exercises/:id/last-log', () => {
		it('returns 401 without auth', async () => {
			await request(app)
				.get('/v1/exercises/000000000000000000000000/last-log')
				.expect(401)
		})

		it('returns most recent log after logging', async () => {
			const listRes = await request(app).get('/v1/exercises').expect(200)
			const exerciseId = listRes.body[0].id

			const res = await request(app)
				.get(`/v1/exercises/${exerciseId}/last-log`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body).toHaveProperty('id')
			expect(res.body.exerciseId).toBe(exerciseId)
		})
	})

	// --- Workouts ---

	describe('GET /v1/workouts', () => {
		it('returns seeded workouts', async () => {
			const res = await request(app).get('/v1/workouts').expect(200)

			expect(Array.isArray(res.body)).toBe(true)
			expect(res.body.length).toBeGreaterThan(0)
			expect(res.body[0]).toHaveProperty('id')
			expect(res.body[0]).toHaveProperty('name')
			expect(res.body[0]).toHaveProperty('exerciseCount')
		})
	})

	describe('GET /v1/workouts/:id', () => {
		it('returns workout with populated exercises', async () => {
			const listRes = await request(app).get('/v1/workouts').expect(200)
			const workoutId = listRes.body[0].id

			const res = await request(app)
				.get(`/v1/workouts/${workoutId}`)
				.expect(200)

			expect(res.body.id).toBe(workoutId)
			expect(res.body).toHaveProperty('exercises')
			expect(Array.isArray(res.body.exercises)).toBe(true)
		})
	})

	describe('POST /v1/workouts', () => {
		it('returns 401 without auth', async () => {
			await request(app)
				.post('/v1/workouts')
				.send({})
				.expect(401)
		})

		it('returns 400 on invalid body', async () => {
			await request(app)
				.post('/v1/workouts')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({})
				.expect(400)
		})

		it('creates user workout and returns 201', async () => {
			const listRes = await request(app).get('/v1/exercises').expect(200)
			const exerciseId = listRes.body[0].id

			const res = await request(app)
				.post('/v1/workouts')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					name: 'My Custom Workout',
					exercises: [{ exerciseId, order: 0 }],
				})
				.expect(201)

			expect(res.body).toHaveProperty('id')
			expect(res.body.name).toBe('My Custom Workout')
			expect(res.body.isGlobal).toBe(false)
		})
	})

	describe('PUT /v1/workouts/:id', () => {
		it('returns 401 without auth', async () => {
			await request(app)
				.put('/v1/workouts/000000000000000000000000')
				.send({ name: 'Updated' })
				.expect(401)
		})

		it('updates owned workout', async () => {
			// First create a workout
			const exerciseListRes = await request(app).get('/v1/exercises').expect(200)
			const exerciseId = exerciseListRes.body[0].id

			const createRes = await request(app)
				.post('/v1/workouts')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					name: 'To Update',
					exercises: [{ exerciseId, order: 0 }],
				})
				.expect(201)

			const res = await request(app)
				.put(`/v1/workouts/${createRes.body.id}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ name: 'Updated Name' })
				.expect(200)

			expect(res.body.name).toBe('Updated Name')
		})

		it('returns 404 when updating a global workout', async () => {
			const listRes = await request(app).get('/v1/workouts').expect(200)
			const globalWorkout = listRes.body.find((w: any) => w.isGlobal === true)

			await request(app)
				.put(`/v1/workouts/${globalWorkout.id}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ name: 'Hacked' })
				.expect(404)
		})
	})

	describe('DELETE /v1/workouts/:id', () => {
		it('returns 401 without auth', async () => {
			await request(app)
				.delete('/v1/workouts/000000000000000000000000')
				.expect(401)
		})

		it('deletes owned workout and returns 204', async () => {
			// Create a workout to delete
			const exerciseListRes = await request(app).get('/v1/exercises').expect(200)
			const exerciseId = exerciseListRes.body[0].id

			const createRes = await request(app)
				.post('/v1/workouts')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					name: 'To Delete',
					exercises: [{ exerciseId, order: 0 }],
				})
				.expect(201)

			await request(app)
				.delete(`/v1/workouts/${createRes.body.id}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(204)
		})
	})

	// --- History ---

	describe('GET /v1/history', () => {
		it('returns 401 without auth', async () => {
			await request(app).get('/v1/history').expect(401)
		})

		it('returns paginated results', async () => {
			const res = await request(app)
				.get('/v1/history')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body).toHaveProperty('items')
			expect(res.body).toHaveProperty('total')
			expect(res.body).toHaveProperty('page')
			expect(res.body).toHaveProperty('totalPages')
			expect(Array.isArray(res.body.items)).toBe(true)
		})
	})

	describe('GET /v1/history/export', () => {
		it('returns 401 without auth', async () => {
			await request(app).get('/v1/history/export').expect(401)
		})

		it('returns CSV with correct content-type', async () => {
			const res = await request(app)
				.get('/v1/history/export')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.headers['content-type']).toContain('text/csv')
			expect(res.headers['content-disposition']).toContain('exercise-history.csv')
			expect(res.text).toContain('Date,Exercise')
		})
	})

	describe('GET /v1/history/:type/:id', () => {
		it('returns 401 without auth', async () => {
			await request(app)
				.get('/v1/history/exercise/000000000000000000000000')
				.expect(401)
		})

		it('returns exercise log detail', async () => {
			// Get an exercise log from history
			const historyRes = await request(app)
				.get('/v1/history')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			const exerciseItem = historyRes.body.items.find((i: any) => i.type === 'exercise')
			if (!exerciseItem) return // skip if no logs yet

			const res = await request(app)
				.get(`/v1/history/exercise/${exerciseItem.id}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body).toHaveProperty('type', 'exercise')
			expect(res.body).toHaveProperty('sets')
		})
	})

	// --- AI Insights ---

	describe('GET /v1/health/insights/exercise/:exerciseId', () => {
		it('returns 401 without auth', async () => {
			await request(app)
				.get('/v1/health/insights/exercise/000000000000000000000000')
				.expect(401)
		})

		it('returns insight for exercise with logs', async () => {
			const listRes = await request(app).get('/v1/exercises').expect(200)
			const exerciseId = listRes.body[0].id

			const res = await request(app)
				.get(`/v1/health/insights/exercise/${exerciseId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			// May be null if no logs or may have insight
			expect(res.body).toHaveProperty('insight')
			expect(res.body).toHaveProperty('generatedAt')
		})
	})

	describe('GET /v1/health/insights/summary', () => {
		it('returns 401 without auth', async () => {
			await request(app)
				.get('/v1/health/insights/summary')
				.expect(401)
		})

		it('returns summary insight', async () => {
			const res = await request(app)
				.get('/v1/health/insights/summary')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body).toHaveProperty('insight')
			expect(res.body).toHaveProperty('generatedAt')
		})
	})

	describe('POST /v1/health/insights/monitor/:sampleType', () => {
		it('returns 401 without auth', async () => {
			await request(app)
				.post('/v1/health/insights/monitor/steps')
				.send({ data: [] })
				.expect(401)
		})

		it('returns insight for monitor data', async () => {
			const res = await request(app)
				.post('/v1/health/insights/monitor/steps')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ data: [{ date: '2026-02-16', value: 8000 }] })
				.expect(200)

			expect(res.body).toHaveProperty('insight')
		})
	})
})
