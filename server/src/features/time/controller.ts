import { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../middleware/auth'
import * as timeService from './service'
import {
	startTimeEntrySchema,
	timeEntryQuerySchema,
	timeBudgetSchema,
	createTaskSchema,
	updateTaskSchema,
	taskQuerySchema,
	createRoutineSchema,
	updateRoutineSchema
} from './validators'
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

// --- Tasks (day planning) ---

export async function getTasks(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const parsed = taskQuerySchema.safeParse(req.query)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const tasks = parsed.data.inbox === 'true'
		? await timeService.getInboxTasks(req.user.userId)
		: await timeService.getTasksByDate(req.user.userId, parsed.data.date!)
	return res.json(tasks)
}

export async function createTask(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const parsed = createTaskSchema.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const task = await timeService.createTask(req.user.userId, parsed.data)
	return res.status(201).json(task)
}

export async function updateTask(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const parsed = updateTaskSchema.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const task = await timeService.updateTask(req.user.userId, req.params.id, parsed.data)
	return res.json(task)
}

export async function deleteTask(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	await timeService.deleteTask(req.user.userId, req.params.id)
	return res.status(204).send()
}

// --- Routines ---

export async function getRoutines(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const routines = await timeService.getRoutines(req.user.userId)
	return res.json(routines)
}

export async function createRoutine(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const parsed = createRoutineSchema.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const routine = await timeService.createRoutine(req.user.userId, parsed.data)
	return res.status(201).json(routine)
}

export async function updateRoutine(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const parsed = updateRoutineSchema.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const routine = await timeService.updateRoutine(req.user.userId, req.params.id, parsed.data)
	return res.json(routine)
}

export async function deleteRoutine(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	await timeService.deleteRoutine(req.user.userId, req.params.id)
	return res.status(204).send()
}

// --- Calendar settings ---

export async function getCalendarSettings(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const settings = await timeService.getCalendarSettings(req.user.userId)
	return res.json(settings)
}

export async function updateCalendarSettings(req: AuthenticatedRequest, res: Response) {
	if (!req.user) return unauthorizedError(res, req)

	const { enabled } = req.body as { enabled?: boolean }
	if (typeof enabled !== 'boolean') {
		return res.status(400).json({
			error: { code: 'VALIDATION_ERROR', message: '"enabled" must be a boolean' },
			requestId: requestId(req)
		})
	}

	const settings = await timeService.setCalendarEnabled(req.user.userId, enabled)
	return res.json(settings)
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
