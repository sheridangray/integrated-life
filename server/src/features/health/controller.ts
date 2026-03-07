import { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../middleware/auth'
import { logger } from '../../lib/logger'
import { User } from '../../models/User'
import * as healthService from './service'
import * as healthAI from './ai'
import {
	exerciseFiltersValidator,
	workoutFiltersValidator,
	historyFiltersValidator,
	createExerciseLogValidator,
	createWorkoutValidator,
	updateWorkoutValidator,
	createWorkoutLogValidator
} from './validators'

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

// --- Exercises ---

export async function listExercises(req: AuthenticatedRequest, res: Response) {
	const parsed = exerciseFiltersValidator.safeParse(req.query)
	const filters = parsed.success ? parsed.data : {}

	const exercises = await healthService.listExercises({
		...filters,
		userId: req.user?.userId
	})
	return res.json(exercises)
}

export async function getExercise(req: AuthenticatedRequest, res: Response) {
	const exercise = await healthService.getExercise(req.params.id, req.user?.userId)
	return res.json(exercise)
}

export async function toggleFavorite(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}
	const result = await healthService.toggleFavorite(req.user.userId, req.params.id)
	return res.json(result)
}

export async function getExerciseHistory(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}
	const history = await healthService.getExerciseHistory(req.user.userId, req.params.id)
	return res.json(history)
}

// --- Exercise Logging ---

export async function logExercise(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = createExerciseLogValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const log = await healthService.logExercise(req.user.userId, req.params.id, parsed.data)
	return res.status(201).json(log)
}

export async function getLastExerciseLog(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const log = await healthService.getLastExerciseLog(req.user.userId, req.params.id)
	if (!log) {
		return res.status(404).json({
			error: { code: 'NOT_FOUND', message: 'No previous log found' },
			requestId: requestId(req)
		})
	}
	return res.json(log)
}

// --- Workouts ---

export async function listWorkouts(req: AuthenticatedRequest, res: Response) {
	const parsed = workoutFiltersValidator.safeParse(req.query)
	const filters = parsed.success ? parsed.data : {}

	const workouts = await healthService.listWorkouts({
		...filters,
		userId: req.user?.userId
	})
	return res.json(workouts)
}

export async function getWorkout(req: AuthenticatedRequest, res: Response) {
	const workout = await healthService.getWorkout(req.params.id)
	return res.json(workout)
}

export async function createWorkout(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = createWorkoutValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const workout = await healthService.createWorkout(req.user.userId, {
		...parsed.data,
		schedule: parsed.data.schedule ?? undefined
	})
	return res.status(201).json(workout)
}

export async function updateWorkout(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = updateWorkoutValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const workout = await healthService.updateWorkout(req.params.id, req.user.userId, parsed.data)
	return res.json(workout)
}

export async function deleteWorkout(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	await healthService.deleteWorkout(req.params.id, req.user.userId)
	return res.status(204).send()
}

// --- Workout Logging ---

export async function logWorkout(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = createWorkoutLogValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const log = await healthService.logWorkout(req.user.userId, parsed.data)
	return res.status(201).json(log)
}

// --- History ---

export async function getHistory(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = historyFiltersValidator.safeParse(req.query)
	const filters = parsed.success ? parsed.data : { page: 1, limit: 20 }

	const history = await healthService.getHistory(req.user.userId, filters)
	return res.json(history)
}

export async function getHistoryDetail(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const detail = await healthService.getHistoryDetail(req.user.userId, req.params.type, req.params.id)
	return res.json(detail)
}

export async function deleteHistoryItem(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	await healthService.deleteHistoryItem(req.user.userId, req.params.type, req.params.id)
	return res.status(204).send()
}

export async function exportHistory(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const csv = await healthService.exportHistoryCsv(req.user.userId)
	res.setHeader('Content-Type', 'text/csv')
	res.setHeader('Content-Disposition', 'attachment; filename="exercise-history.csv"')
	return res.send(csv)
}

// --- AI Insights ---

export async function getExerciseInsight(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const insight = await healthAI.getExerciseInsight(req.user.userId, req.params.exerciseId)
	if (!insight) {
		return res.json({ insight: null, generatedAt: null })
	}
	return res.json(insight)
}

export async function getHistorySummary(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const insight = await healthAI.getHistorySummary(req.user.userId)
	if (!insight) {
		return res.json({ insight: null, generatedAt: null })
	}
	return res.json(insight)
}

export async function getMonitorInsight(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const data = req.body?.data as Array<{ date: string; value: number }> | undefined
	const insight = await healthAI.getMonitorInsight(req.params.sampleType, data ?? [])
	if (!insight) {
		return res.json({ insight: null, generatedAt: null })
	}
	return res.json(insight)
}

export async function getWorkoutInsight(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const { exerciseLogIds } = req.body as { exerciseLogIds?: string[] }
	if (!exerciseLogIds || !Array.isArray(exerciseLogIds) || exerciseLogIds.length === 0) {
		logger.warn('Workout insight request missing exerciseLogIds', {
			body: JSON.stringify(req.body),
			requestId: requestId(req)
		})
		return res.status(400).json({
			error: { code: 'VALIDATION_ERROR', message: 'exerciseLogIds array is required' },
			requestId: requestId(req)
		})
	}

	const insight = await healthAI.getWorkoutInsight(req.user.userId, exerciseLogIds)
	if (!insight) {
		logger.warn('Workout insight returned null', {
			exerciseLogCount: exerciseLogIds.length,
			requestId: requestId(req)
		})
		return res.json({ exerciseInsights: [], overallInsight: null, generatedAt: null })
	}
	return res.json(insight)
}

export async function getMonitorAnalysis(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const { data, timeRange } = req.body as {
		data?: Array<{ date: string; value: number }>
		timeRange?: string
	}

	const user = await User.findById(req.user.userId).exec()
	const userProfile = user ? { gender: user.gender, dateOfBirth: user.dateOfBirth } : undefined

	const insight = await healthAI.getMonitorAnalysis(
		req.params.sampleType,
		data ?? [],
		timeRange ?? '7D',
		userProfile
	)
	if (!insight) {
		return res.json({ insight: null, generatedAt: null })
	}
	return res.json(insight)
}
