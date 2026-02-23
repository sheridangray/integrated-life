import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../../middleware/auth'

vi.mock('../service', () => ({
	processNightlyData: vi.fn(),
	getTodayScores: vi.fn(),
	getScoreHistory: vi.fn(),
}))

import * as controller from '../controller'
import * as sleepService from '../service'

function createMockReq(
	overrides: {
		body?: unknown
		params?: Record<string, string>
		query?: Record<string, string>
		userId?: string
	} = {}
): AuthenticatedRequest {
	return {
		body: overrides.body ?? {},
		params: overrides.params ?? {},
		query: overrides.query ?? {},
		headers: {},
		id: 'req-test-123',
		userId: overrides.userId ?? 'user123',
	} as unknown as AuthenticatedRequest
}

function createMockRes() {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	}
	return res as unknown as Response
}

const validNightlyPayload = {
	date: '2026-02-20',
	sleepStartTime: '2026-02-20T23:00:00Z',
	sleepEndTime: '2026-02-21T07:00:00Z',
	sleepMidpoint: '2026-02-21T03:00:00Z',
	totalAsleepDuration: 450,
	totalInBedDuration: 480,
	deepDuration: 90,
	remDuration: 110,
	coreDuration: 250,
	wasoDuration: 15,
	minHrValue: 48,
	minHrTimestamp: '2026-02-21T03:30:00Z',
	avgHr: 55,
	hrvMean: 45,
	respiratoryRateMean: 14,
	temperatureDeviation: 0.1,
	deviceTier: 'A',
}

const mockScoreResponse = {
	id: 'score123',
	date: '2026-02-20',
	sleepScore: 82,
	readinessScore: 78,
	sleepBreakdown: {
		duration: 85,
		efficiency: 90,
		deep: 75,
		rem: 80,
		restfulness: 88,
		timing: 82,
		physioStability: 70,
	},
	readinessBreakdown: {
		sleepScoreContrib: 82,
		hrvDeviation: 55,
		rhrDeviation: 60,
		recoveryIndex: 50,
		hrvTrendSlope: 52,
		sleepDebt: 90,
		activityLoad: 50,
	},
	interactionFlags: [],
	interactionFactor: 1.0,
	actionBucket: 'maintain' as const,
	modelVersion: 'sleep_readiness_v1.2_rule_based',
	calibrationPhase: 3,
	deviceTier: 'A' as const,
}

describe('submitNightly', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns 200 with score on valid payload', async () => {
		vi.mocked(sleepService.processNightlyData).mockResolvedValue(mockScoreResponse)

		const req = createMockReq({ body: validNightlyPayload })
		const res = createMockRes()

		await controller.submitNightly(req, res)

		expect(res.status).toHaveBeenCalledWith(200)
		expect(res.json).toHaveBeenCalledWith(mockScoreResponse)
		expect(sleepService.processNightlyData).toHaveBeenCalledWith('user123', validNightlyPayload)
	})

	it('returns 400 on invalid payload', async () => {
		const req = createMockReq({ body: { date: '2026-02-20' } })
		const res = createMockRes()

		await controller.submitNightly(req, res)

		expect(res.status).toHaveBeenCalledWith(400)
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
			})
		)
	})
})

describe('getTodayScores', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns score when available', async () => {
		vi.mocked(sleepService.getTodayScores).mockResolvedValue(mockScoreResponse)

		const req = createMockReq()
		const res = createMockRes()

		await controller.getTodayScores(req, res)

		expect(res.status).toHaveBeenCalledWith(200)
		expect(res.json).toHaveBeenCalledWith(mockScoreResponse)
	})

	it('returns null when no score available', async () => {
		vi.mocked(sleepService.getTodayScores).mockResolvedValue(null)

		const req = createMockReq()
		const res = createMockRes()

		await controller.getTodayScores(req, res)

		expect(res.status).toHaveBeenCalledWith(200)
		expect(res.json).toHaveBeenCalledWith(null)
	})
})

describe('getHistory', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns score history with default 14 days', async () => {
		vi.mocked(sleepService.getScoreHistory).mockResolvedValue([mockScoreResponse])

		const req = createMockReq()
		const res = createMockRes()

		await controller.getHistory(req, res)

		expect(res.status).toHaveBeenCalledWith(200)
		expect(sleepService.getScoreHistory).toHaveBeenCalledWith('user123', 14)
	})

	it('respects days query parameter', async () => {
		vi.mocked(sleepService.getScoreHistory).mockResolvedValue([])

		const req = createMockReq({ query: { days: '30' } })
		const res = createMockRes()

		await controller.getHistory(req, res)

		expect(sleepService.getScoreHistory).toHaveBeenCalledWith('user123', 30)
	})
})
