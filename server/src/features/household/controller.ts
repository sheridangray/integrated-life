import { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../middleware/auth'
import * as householdService from './service'
import {
	createTemplateValidator,
	updateTemplateValidator,
	createHouseholdTaskValidator,
	householdTaskFiltersValidator,
	updateCleanerRotationValidator,
	updatePropertyProfileValidator
} from './validators'

function requestId(req: Request): string | undefined {
	return (req as Request & { id?: string }).id
}

function validationError(
	res: Response,
	req: Request,
	error: { issues: Array<{ message: string }>; flatten(): unknown }
) {
	return res.status(400).json({
		error: {
			code: 'VALIDATION_ERROR',
			message: error.issues[0]?.message ?? 'Invalid request',
			details: error.flatten()
		},
		requestId: requestId(req)
	})
}

// --- Household Tasks ---

export async function listTasks(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = householdTaskFiltersValidator.safeParse(req.query)
	const filters = parsed.success ? parsed.data : {}

	const tasks = await householdService.listTasks(req.user.userId, filters)
	return res.json(tasks)
}

export async function createTask(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = createHouseholdTaskValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const syncToTime = req.query.syncToTime === 'true'
	const task = await householdService.createTask(req.user.userId, parsed.data, syncToTime)
	return res.status(201).json(task)
}

export async function getUpcomingTasks(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const tasks = await householdService.getUpcomingTasks(req.user.userId)
	return res.json(tasks)
}

export async function completeTask(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const task = await householdService.completeTask(req.user.userId, req.params.id)
	return res.json(task)
}

export async function skipTask(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const { reason } = req.body as { reason?: string }
	const task = await householdService.skipTask(req.user.userId, req.params.id, reason)
	return res.json(task)
}

export async function generateTasks(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const syncToTime = req.query.syncToTime === 'true'
	const result = await householdService.generateUpcomingTasks(req.user.userId, syncToTime)
	return res.status(201).json(result)
}

// --- Maintenance Templates ---

export async function listTemplates(_req: AuthenticatedRequest, res: Response) {
	const templates = await householdService.listTemplates()
	return res.json(templates)
}

export async function createTemplate(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = createTemplateValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const template = await householdService.createTemplate(parsed.data)
	return res.status(201).json(template)
}

export async function updateTemplate(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = updateTemplateValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const template = await householdService.updateTemplate(req.params.id, parsed.data)
	return res.json(template)
}

export async function deleteTemplate(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	await householdService.deleteTemplate(req.params.id)
	return res.status(204).send()
}

// --- Cleaner Rotation ---

export async function getCleanerRotation(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const rotation = await householdService.getCleanerRotation(req.user.userId)
	if (!rotation) {
		return res.json(null)
	}
	return res.json(rotation)
}

export async function updateCleanerRotation(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = updateCleanerRotationValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const rotation = await householdService.updateCleanerRotation(req.user.userId, parsed.data)
	return res.json(rotation)
}

// --- Property Profile ---

export async function getPropertyProfile(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const profile = await householdService.getPropertyProfile(req.user.userId)
	if (!profile) {
		return res.json(null)
	}
	return res.json(profile)
}

export async function updatePropertyProfile(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = updatePropertyProfileValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const profile = await householdService.updatePropertyProfile(req.user.userId, parsed.data)
	return res.json(profile)
}
