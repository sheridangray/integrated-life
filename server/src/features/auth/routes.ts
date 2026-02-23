import { Router } from 'express'
import { googleAuth, refresh, me } from './controller'
import { authMiddleware } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/asyncHandler'

export const authRoutes = Router()

authRoutes.post('/google', asyncHandler(googleAuth))
authRoutes.post('/refresh', asyncHandler(refresh))
authRoutes.get('/me', authMiddleware, asyncHandler(me))
