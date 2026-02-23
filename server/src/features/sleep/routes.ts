import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/asyncHandler'
import * as controller from './controller'

export const sleepRoutes = Router()

sleepRoutes.use(authMiddleware)

sleepRoutes.post('/nightly', asyncHandler(controller.submitNightly))
sleepRoutes.get('/today', asyncHandler(controller.getTodayScores))
sleepRoutes.get('/history', asyncHandler(controller.getHistory))
