import { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../middleware/auth'
import * as timeService from './service'
import { startTimeEntrySchema, timeEntryQuerySchema, timeBudgetSchema } from './validators'
import { TIME_CATEGORIES, META_BUCKETS } from './constants'

function requestId(req: Request): string | undefined {
	return (req as Request & { id?: string }).id
}

function validationError(res: Response, req: Request, error: { issues: Array<{ message: string }>; flatten(): unknown }) {
	return res.status(400).json({
		error: {
			code: 'VALIDATION_ERROR',
			message: error.issues[0]?.message ?? 'Invalid request',
			details: error.flatten()
		},
		requestId: requestId(req)
	})
}

function unauthorizedError(res: Response, req: Request) {
	return res.status(401).json({
		error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
		requestId: requestId(req)
	})
}

// --- Categories (static) ---

export async function getCategories(_req: Request, res: Response) {
	return res.json({ categories: TIME_CATEGORIES, metaBuckets: META_BUCKETS })
}

// --- Time Entries ---

export async function startEntry(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const parsed = startTimeEntrySchema.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const entry = await timeService.startEntry(req.user.userId, parsed.data)
	return res.status(201).json(entry)
}

export async function stopEntry(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const entry = await timeService.stopEntry(req.user.userId, req.params.id)
	return res.json(entry)
}

export async function getActiveEntries(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const entries = await timeService.getActiveEntries(req.user.userId)
	return res.json(entries)
}

export async function getEntries(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const parsed = timeEntryQuerySchema.safeParse(req.query)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const entries = await timeService.getEntries(req.user.userId, parsed.data.from, parsed.data.to)
	return res.json(entries)
}

export async function deleteEntry(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	await timeService.deleteEntry(req.user.userId, req.params.id)
	return res.status(204).send()
}

// --- Time Budget ---

export async function getBudget(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const budgets = await timeService.getBudget(req.user.userId)
	return res.json({ budgets })
}

export async function saveBudget(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const parsed = timeBudgetSchema.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const budgets = await timeService.saveBudget(req.user.userId, parsed.data.budgets)
	return res.json({ budgets })
}
