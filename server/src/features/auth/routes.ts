import { Router } from 'express'
import { googleAuth, refresh, me, updateProfile } from './controller'
import { authMiddleware } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/asyncHandler'

export const authRoutes = Router()

authRoutes.post('/google', asyncHandler(googleAuth))
authRoutes.post('/refresh', asyncHandler(refresh))
authRoutes.get('/me', authMiddleware, asyncHandler(me))
authRoutes.put('/me', authMiddleware, asyncHandler(updateProfile))
