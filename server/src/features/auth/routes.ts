import { Router } from 'express'
import { googleAuth, refresh, me } from './controller'
import { authMiddleware } from '../../middleware/auth'

export const authRoutes = Router()

authRoutes.post('/google', googleAuth)
authRoutes.post('/refresh', refresh)
authRoutes.get('/me', authMiddleware, me)
