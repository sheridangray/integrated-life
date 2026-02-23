import { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../middleware/auth'
import * as sleepService from './service'
import { submitNightlyValidator } from './validators'

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
