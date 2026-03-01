import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../../middleware/auth'

vi.mock('../service', () => ({
	listExercises: vi.fn(),
	getExercise: vi.fn(),
	toggleFavorite: vi.fn(),
	getExerciseHistory: vi.fn(),
	logExercise: vi.fn(),
	getLastExerciseLog: vi.fn(),
	listWorkouts: vi.fn(),
	getWorkout: vi.fn(),
	createWorkout: vi.fn(),
	updateWorkout: vi.fn(),
	deleteWorkout: vi.fn(),
	logWorkout: vi.fn(),
	getHistory: vi.fn(),
	getHistoryDetail: vi.fn(),
	exportHistoryCsv: vi.fn(),
}))

vi.mock('../ai', () => ({
	getExerciseInsight: vi.fn(),
	getHistorySummary: vi.fn(),
	getMonitorInsight: vi.fn(),
}))

import * as controller from '../controller'
import * as healthService from '../service'
import * as healthAI from '../ai'

// --- Helpers ---

function createMockReq(
	overrides: {
		body?: unknown
		params?: Record<string, string>
		query?: Record<string, string>
		user?: { userId: string; email: string }
	} = {}
): AuthenticatedRequest {
	return {
		body: overrides.body ?? {},
		params: overrides.params ?? {},
		query: overrides.query ?? {},
		headers: {},
		id: 'req-test-123',
		user: overrides.user,
	} as unknown as AuthenticatedRequest
}

function createMockRes() {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		send: vi.fn().mockReturnThis(),
		setHeader: vi.fn().mockReturnThis(),
	}
	return res as unknown as Response
}

const testUser = { userId: 'user-1', email: 'test@example.com' }

// --- Exercises ---

describe('listExercises', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns exercises from service', async () => {
		const exercises = [{ id: 'ex1', name: 'Bench Press' }]
		vi.mocked(healthService.listExercises).mockResolvedValue(exercises as any)

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.listExercises(req, res)

		expect(healthService.listExercises).toHaveBeenCalledWith(
			expect.objectContaining({ userId: 'user-1' })
		)
		expect(res.json).toHaveBeenCalledWith(exercises)
	})

	it('works without auth (optional auth)', async () => {
		vi.mocked(healthService.listExercises).mockResolvedValue([])

		const req = createMockReq()
		const res = createMockRes()

		await controller.listExercises(req, res)

		expect(healthService.listExercises).toHaveBeenCalledWith(
			expect.objectContaining({ userId: undefined })
		)
		expect(res.json).toHaveBeenCalledWith([])
	})
})

describe('getExercise', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns exercise by id', async () => {
		const exercise = { id: 'ex1', name: 'Bench Press' }
		vi.mocked(healthService.getExercise).mockResolvedValue(exercise as any)

		const req = createMockReq({ params: { id: 'ex1' } })
		const res = createMockRes()

		await controller.getExercise(req, res)

		expect(healthService.getExercise).toHaveBeenCalledWith('ex1', undefined)
		expect(res.json).toHaveBeenCalledWith(exercise)
	})
})

describe('toggleFavorite', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { id: 'ex1' } })
		const res = createMockRes()

		await controller.toggleFavorite(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: expect.objectContaining({ code: 'UNAUTHORIZED' }) })
		)
	})

	it('delegates to service when authenticated', async () => {
		vi.mocked(healthService.toggleFavorite).mockResolvedValue({ isFavorite: true })

		const req = createMockReq({ params: { id: 'ex1' }, user: testUser })
		const res = createMockRes()

		await controller.toggleFavorite(req, res)

		expect(healthService.toggleFavorite).toHaveBeenCalledWith('user-1', 'ex1')
		expect(res.json).toHaveBeenCalledWith({ isFavorite: true })
	})
})

describe('getExerciseHistory', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { id: 'ex1' } })
		const res = createMockRes()

		await controller.getExerciseHistory(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns history when authenticated', async () => {
		vi.mocked(healthService.getExerciseHistory).mockResolvedValue([])

		const req = createMockReq({ params: { id: 'ex1' }, user: testUser })
		const res = createMockRes()

		await controller.getExerciseHistory(req, res)

		expect(res.json).toHaveBeenCalledWith([])
	})
})

// --- Exercise Logging ---

describe('logExercise', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { id: 'ex1' } })
		const res = createMockRes()

		await controller.logExercise(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns 400 on invalid body', async () => {
		const req = createMockReq({ params: { id: 'ex1' }, user: testUser, body: {} })
		const res = createMockRes()

		await controller.logExercise(req, res)

		expect(res.status).toHaveBeenCalledWith(400)
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: expect.objectContaining({ code: 'VALIDATION_ERROR' }) })
		)
	})

	it('returns 201 on success', async () => {
		const logData = {
			exerciseId: 'ex1',
			date: '2026-02-16',
			startTime: '09:00',
			endTime: '09:30',
			resistanceType: 'Weights (Free)',
			sets: [{ setNumber: 1, weight: 135, reps: 10 }],
		}
		vi.mocked(healthService.logExercise).mockResolvedValue({ id: 'log-1', ...logData } as any)

		const req = createMockReq({ params: { id: 'ex1' }, user: testUser, body: logData })
		const res = createMockRes()

		await controller.logExercise(req, res)

		expect(res.status).toHaveBeenCalledWith(201)
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'log-1' }))
	})
})

describe('getLastExerciseLog', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { id: 'ex1' } })
		const res = createMockRes()

		await controller.getLastExerciseLog(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns 404 when no log exists', async () => {
		vi.mocked(healthService.getLastExerciseLog).mockResolvedValue(null)

		const req = createMockReq({ params: { id: 'ex1' }, user: testUser })
		const res = createMockRes()

		await controller.getLastExerciseLog(req, res)

		expect(res.status).toHaveBeenCalledWith(404)
	})

	it('returns log when found', async () => {
		vi.mocked(healthService.getLastExerciseLog).mockResolvedValue({ id: 'log-1' } as any)

		const req = createMockReq({ params: { id: 'ex1' }, user: testUser })
		const res = createMockRes()

		await controller.getLastExerciseLog(req, res)

		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'log-1' }))
	})
})

// --- Workouts ---

describe('listWorkouts', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns workouts from service', async () => {
		vi.mocked(healthService.listWorkouts).mockResolvedValue([])

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.listWorkouts(req, res)

		expect(res.json).toHaveBeenCalledWith([])
	})
})

describe('getWorkout', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns workout by id', async () => {
		vi.mocked(healthService.getWorkout).mockResolvedValue({ id: 'w1' } as any)

		const req = createMockReq({ params: { id: 'w1' } })
		const res = createMockRes()

		await controller.getWorkout(req, res)

		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'w1' }))
	})
})

describe('createWorkout', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.createWorkout(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns 400 on invalid body', async () => {
		const req = createMockReq({ user: testUser, body: {} })
		const res = createMockRes()

		await controller.createWorkout(req, res)

		expect(res.status).toHaveBeenCalledWith(400)
	})

	it('returns 201 on success', async () => {
		const workoutData = {
			name: 'Push Day',
			exercises: [{ exerciseId: 'ex1', order: 0 }],
		}
		vi.mocked(healthService.createWorkout).mockResolvedValue({ id: 'w-new', ...workoutData } as any)

		const req = createMockReq({ user: testUser, body: workoutData })
		const res = createMockRes()

		await controller.createWorkout(req, res)

		expect(res.status).toHaveBeenCalledWith(201)
	})
})

describe('updateWorkout', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { id: 'w1' } })
		const res = createMockRes()

		await controller.updateWorkout(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns updated workout on success', async () => {
		vi.mocked(healthService.updateWorkout).mockResolvedValue({ id: 'w1', name: 'Updated' } as any)

		const req = createMockReq({
			params: { id: 'w1' },
			user: testUser,
			body: { name: 'Updated' },
		})
		const res = createMockRes()

		await controller.updateWorkout(req, res)

		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated' }))
	})
})

describe('deleteWorkout', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { id: 'w1' } })
		const res = createMockRes()

		await controller.deleteWorkout(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns 204 on success', async () => {
		vi.mocked(healthService.deleteWorkout).mockResolvedValue(undefined)

		const req = createMockReq({ params: { id: 'w1' }, user: testUser })
		const res = createMockRes()

		await controller.deleteWorkout(req, res)

		expect(res.status).toHaveBeenCalledWith(204)
		expect(res.send).toHaveBeenCalled()
	})
})

// --- Workout Logging ---

describe('logWorkout', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.logWorkout(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns 400 on invalid body', async () => {
		const req = createMockReq({ user: testUser, body: {} })
		const res = createMockRes()

		await controller.logWorkout(req, res)

		expect(res.status).toHaveBeenCalledWith(400)
	})

	it('returns 201 on success', async () => {
		const logData = {
			workoutId: 'w1',
			date: '2026-02-16',
			startTime: '09:00',
			endTime: '10:00',
			exerciseLogIds: ['log1'],
			completedAll: true,
		}
		vi.mocked(healthService.logWorkout).mockResolvedValue({ id: 'wlog-1', ...logData } as any)

		const req = createMockReq({ user: testUser, body: logData })
		const res = createMockRes()

		await controller.logWorkout(req, res)

		expect(res.status).toHaveBeenCalledWith(201)
	})
})

// --- History ---

describe('getHistory', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.getHistory(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns paginated history', async () => {
		const history = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 }
		vi.mocked(healthService.getHistory).mockResolvedValue(history)

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.getHistory(req, res)

		expect(res.json).toHaveBeenCalledWith(history)
	})
})

describe('getHistoryDetail', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { type: 'exercise', id: 'log1' } })
		const res = createMockRes()

		await controller.getHistoryDetail(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns detail when authenticated', async () => {
		vi.mocked(healthService.getHistoryDetail).mockResolvedValue({ type: 'exercise', id: 'log1' } as any)

		const req = createMockReq({ params: { type: 'exercise', id: 'log1' }, user: testUser })
		const res = createMockRes()

		await controller.getHistoryDetail(req, res)

		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ type: 'exercise' }))
	})
})

describe('exportHistory', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.exportHistory(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('sets correct CSV headers and sends content', async () => {
		vi.mocked(healthService.exportHistoryCsv).mockResolvedValue('Date,Exercise\n2026-02-16,Bench')

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.exportHistory(req, res)

		expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv')
		expect(res.setHeader).toHaveBeenCalledWith(
			'Content-Disposition',
			'attachment; filename="exercise-history.csv"'
		)
		expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Bench'))
	})
})

// --- AI Insights ---

describe('getExerciseInsight', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { exerciseId: 'ex1' } })
		const res = createMockRes()

		await controller.getExerciseInsight(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns null insight when none available', async () => {
		vi.mocked(healthAI.getExerciseInsight).mockResolvedValue(null)

		const req = createMockReq({ params: { exerciseId: 'ex1' }, user: testUser })
		const res = createMockRes()

		await controller.getExerciseInsight(req, res)

		expect(res.json).toHaveBeenCalledWith({ insight: null, generatedAt: null })
	})

	it('returns insight when available', async () => {
		const insight = { insight: 'Great job!', generatedAt: '2026-02-16T12:00:00Z' }
		vi.mocked(healthAI.getExerciseInsight).mockResolvedValue(insight)

		const req = createMockReq({ params: { exerciseId: 'ex1' }, user: testUser })
		const res = createMockRes()

		await controller.getExerciseInsight(req, res)

		expect(res.json).toHaveBeenCalledWith(insight)
	})
})

describe('getHistorySummary', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.getHistorySummary(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns insight or null', async () => {
		vi.mocked(healthAI.getHistorySummary).mockResolvedValue(null)

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.getHistorySummary(req, res)

		expect(res.json).toHaveBeenCalledWith({ insight: null, generatedAt: null })
	})
})

describe('getMonitorInsight', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { sampleType: 'steps' } })
		const res = createMockRes()

		await controller.getMonitorInsight(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('passes body data to AI module', async () => {
		const insight = { insight: 'Good trend', generatedAt: '2026-02-16T12:00:00Z' }
		vi.mocked(healthAI.getMonitorInsight).mockResolvedValue(insight)

		const data = [{ date: '2026-02-16', value: 8000 }]
		const req = createMockReq({
			params: { sampleType: 'steps' },
			user: testUser,
			body: { data },
		})
		const res = createMockRes()

		await controller.getMonitorInsight(req, res)

		expect(healthAI.getMonitorInsight).toHaveBeenCalledWith('steps', data)
		expect(res.json).toHaveBeenCalledWith(insight)
	})
})
