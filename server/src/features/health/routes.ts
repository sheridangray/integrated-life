import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/asyncHandler'
import * as controller from './controller'

export const exerciseRoutes = Router()
export const workoutRoutes = Router()
export const historyRoutes = Router()
export const healthInsightRoutes = Router()

// --- Exercises ---
// List and detail are accessible with optional auth (for favorites)
exerciseRoutes.get('/', optionalAuth, asyncHandler(controller.listExercises))
exerciseRoutes.get('/:id', optionalAuth, asyncHandler(controller.getExercise))
exerciseRoutes.post('/:id/favorite', authMiddleware, asyncHandler(controller.toggleFavorite))
exerciseRoutes.get('/:id/history', authMiddleware, asyncHandler(controller.getExerciseHistory))
exerciseRoutes.post('/:id/log', authMiddleware, asyncHandler(controller.logExercise))
exerciseRoutes.get('/:id/last-log', authMiddleware, asyncHandler(controller.getLastExerciseLog))

// --- Workouts ---
workoutRoutes.get('/', optionalAuth, asyncHandler(controller.listWorkouts))
workoutRoutes.get('/:id', optionalAuth, asyncHandler(controller.getWorkout))
workoutRoutes.post('/', authMiddleware, asyncHandler(controller.createWorkout))
workoutRoutes.put('/:id', authMiddleware, asyncHandler(controller.updateWorkout))
workoutRoutes.delete('/:id', authMiddleware, asyncHandler(controller.deleteWorkout))
workoutRoutes.post('/:id/log', authMiddleware, asyncHandler(controller.logWorkout))

// --- History ---
historyRoutes.use(authMiddleware)
historyRoutes.get('/', asyncHandler(controller.getHistory))
historyRoutes.get('/export', asyncHandler(controller.exportHistory))
historyRoutes.get('/:type/:id', asyncHandler(controller.getHistoryDetail))
historyRoutes.delete('/:type/:id', asyncHandler(controller.deleteHistoryItem))

// --- Health Sample Sync ---
healthInsightRoutes.use(authMiddleware)
healthInsightRoutes.post('/push/register', asyncHandler(controller.registerIosPushDevice))
healthInsightRoutes.post('/monitor/sync', asyncHandler(controller.syncMonitorData))
healthInsightRoutes.get('/monitor/samples', asyncHandler(controller.getMonitorSamples))
healthInsightRoutes.get('/monitor/latest', asyncHandler(controller.getMonitorLatest))

// --- Health Reports ---
healthInsightRoutes.post('/insights/report', asyncHandler(controller.generateReport))
healthInsightRoutes.get('/insights/reports', asyncHandler(controller.listReports))
healthInsightRoutes.get('/insights/reports/:id', asyncHandler(controller.getReport))

// --- AI Insights ---
healthInsightRoutes.get('/insights/exercise/:exerciseId', asyncHandler(controller.getExerciseInsight))
healthInsightRoutes.get('/insights/summary', asyncHandler(controller.getHistorySummary))
healthInsightRoutes.post('/insights/monitor/:sampleType', asyncHandler(controller.getMonitorInsight))
healthInsightRoutes.post('/insights/monitor/:sampleType/analyze', asyncHandler(controller.getMonitorAnalysis))
healthInsightRoutes.post('/insights/workout', asyncHandler(controller.getWorkoutInsight))

// Optional auth: attaches user if token present, continues without error if absent
function optionalAuth(req: Parameters<typeof authMiddleware>[0], res: Parameters<typeof authMiddleware>[1], next: Parameters<typeof authMiddleware>[2]) {
	const authHeader = req.headers.authorization
	if (!authHeader?.startsWith('Bearer ')) {
		return next()
	}
	return authMiddleware(req, res, next)
}
