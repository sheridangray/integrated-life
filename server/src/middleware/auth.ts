import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config'
import { logger } from '../lib/logger'

export type JwtPayload = {
	userId: string
	email: string
	iat?: number
	exp?: number
}

export type AuthenticatedRequest = Request & { user?: JwtPayload }

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization
	const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

	if (!token) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization' },
			requestId: (req as Request & { id?: string }).id
		})
	}

	try {
		const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
		req.user = payload
		next()
	} catch (err) {
		logger.warn('Invalid or expired token', { path: req.path })
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
			requestId: (req as Request & { id?: string }).id
		})
	}
}
