import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/asyncHandler'
import * as controller from './controller'

export const sleepRoutes = Router()

sleepRoutes.use(authMiddleware)

sleepRoutes.post('/nightly', asyncHandler(controller.submitNightly))
sleepRoutes.get('/today', asyncHandler(controller.getTodayScores))
sleepRoutes.get('/history', asyncHandler(controller.getHistory))
sleepRoutes.get('/contributor-detail/assessment', asyncHandler(controller.getContributorDetailAssessment))
sleepRoutes.get('/contributor-detail', asyncHandler(controller.getContributorDetail))
sleepRoutes.get('/baseline', asyncHandler(controller.getBaseline))
sleepRoutes.get('/metrics', asyncHandler(controller.getNightlyMetrics))
sleepRoutes.get('/sync-status', asyncHandler(controller.getSyncStatus))
sleepRoutes.post('/recompute-baseline', asyncHandler(controller.recomputeBaseline))
