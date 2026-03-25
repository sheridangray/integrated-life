import { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../middleware/auth'
import * as sleepService from './service'
import { submitNightlyValidator } from './validators'
import * as repository from './repository'

function requestId(req: Request): string | undefined {
	return (req as Request & { id?: string }).id
}

export async function submitNightly(req: Request, res: Response) {
	const authReq = req as AuthenticatedRequest
	const parsed = submitNightlyValidator.safeParse(req.body)

	if (!parsed.success) {
		return res.status(400).json({
			error: {
				code: 'VALIDATION_ERROR',
				message: parsed.error.issues[0]?.message ?? 'Invalid request',
				details: parsed.error.flatten(),
			},
			requestId: requestId(req),
		})
	}

	const score = await sleepService.processNightlyData(authReq.user!.userId, parsed.data)
	return res.status(200).json(score)
}

export async function getTodayScores(req: Request, res: Response) {
	const authReq = req as AuthenticatedRequest
	const score = await sleepService.getTodayScores(authReq.user!.userId)

	if (!score) {
		return res.status(200).json(null)
	}

	return res.status(200).json(score)
}

export async function getHistory(req: Request, res: Response) {
	const authReq = req as AuthenticatedRequest
	const days = parseInt(req.query.days as string) || 14

	const scores = await sleepService.getScoreHistory(authReq.user!.userId, days)
	return res.status(200).json(scores)
}

export async function getBaseline(req: Request, res: Response) {
	const authReq = req as AuthenticatedRequest
	const baseline = await repository.findBaseline(authReq.user!.userId)
	return res.status(200).json(baseline)
}

export async function getNightlyMetrics(req: Request, res: Response) {
	const authReq = req as AuthenticatedRequest
	const days = parseInt(req.query.days as string) || 90
	const metrics = await repository.findNightlyMetrics(authReq.user!.userId, days)

	const summary = metrics.map(m => ({
		date: m.date,
		totalAsleepDuration: m.totalAsleepDuration,
		totalInBedDuration: m.totalInBedDuration,
		deepDuration: m.deepDuration,
		remDuration: m.remDuration,
		coreDuration: m.coreDuration,
		avgHr: m.avgHr,
		hrvMean: m.hrvMean,
		respiratoryRateMean: m.respiratoryRateMean,
		temperatureDeviation: m.temperatureDeviation,
		deviceTier: m.deviceTier,
	}))

	return res.status(200).json({ count: metrics.length, metrics: summary })
}

export async function recomputeBaseline(req: Request, res: Response) {
	const authReq = req as AuthenticatedRequest
	const baseline = await sleepService.recomputeBaseline(authReq.user!.userId)
	return res.status(200).json(baseline)
}

export async function getContributorDetail(req: Request, res: Response) {
	const authReq = req as AuthenticatedRequest
	const date = req.query.date as string
	const key = req.query.key as string

	if (!date || !key) {
		return res.status(400).json({
			error: { code: 'VALIDATION_ERROR', message: 'date and key query params are required' },
			requestId: requestId(req),
		})
	}

	const validKeys = [
		'durationAdequacy',
		'consistency',
		'fragmentation',
		'recoveryPhysiology',
		'structure',
		'timingAlignment',
	]
	if (!validKeys.includes(key)) {
		return res.status(400).json({
			error: { code: 'VALIDATION_ERROR', message: `key must be one of: ${validKeys.join(', ')}` },
			requestId: requestId(req),
		})
	}

	const detail = await sleepService.getContributorDetailForDate(authReq.user!.userId, date, key)
	if (!detail) {
		return res.status(404).json({
			error: { code: 'NOT_FOUND', message: 'No metrics found for the given date or contributor unavailable' },
			requestId: requestId(req),
		})
	}

	return res.status(200).json(detail)
}

export async function getSyncStatus(req: Request, res: Response) {
	const authReq = req as AuthenticatedRequest
	const userId = authReq.user!.userId

	const baseline = await repository.findBaseline(userId)
	const metrics = await repository.findNightlyMetrics(userId, 90)
	const scores = await repository.findScores(userId, 90)

	return res.status(200).json({
		nightsSynced: metrics.length,
		scoresComputed: scores.length,
		calibrationPhase: baseline?.dataPointCount
			? baseline.dataPointCount < 7 ? 1 : baseline.dataPointCount < 21 ? 2 : 3
			: 0,
		dataPointCount: baseline?.dataPointCount ?? 0,
		hasBaseline: baseline !== null,
		baselineHasHrv: baseline?.hrv !== undefined && baseline?.hrv !== null,
		baselineHasRestingHr: baseline?.restingHr !== undefined && baseline?.restingHr !== null,
		baselineHasRespiratoryRate: baseline?.respiratoryRate !== undefined && baseline?.respiratoryRate !== null,
		baselineHasTempDeviation: baseline?.tempDeviation !== undefined && baseline?.tempDeviation !== null,
		lastUpdatedDate: baseline?.lastUpdatedDate ?? null,
		dateRange: metrics.length > 0
			? { earliest: metrics[0].date, latest: metrics[metrics.length - 1].date }
			: null,
	})
}
