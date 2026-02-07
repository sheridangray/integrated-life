import { Request, Response } from 'express'
import * as authService from './service'
import { googleAuthValidator, refreshValidator } from './validators'
import type { AuthenticatedRequest } from '../../middleware/auth'
import { User } from '../../models/User'

export async function googleAuth(req: Request, res: Response) {
	const parsed = googleAuthValidator.safeParse(req.body)
	if (!parsed.success) {
		return res.status(400).json({
			error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request', details: parsed.error.flatten() },
			requestId: (req as Request & { id?: string }).id
		})
	}

	const result = await authService.authenticateWithGoogle(parsed.data.idToken)
	return res.json(result)
}

export async function refresh(req: Request, res: Response) {
	const parsed = refreshValidator.safeParse(req.body)
	if (!parsed.success) {
		return res.status(400).json({
			error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request' },
			requestId: (req as Request & { id?: string }).id
		})
	}

	const result = await authService.refreshAccessToken(parsed.data.refreshToken)
	return res.json(result)
}

export async function me(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: (req as Request & { id?: string }).id
		})
	}

	const user = await User.findById(req.user.userId).exec()
	if (!user) {
		return res.status(404).json({
			error: { code: 'NOT_FOUND', message: 'User not found' },
			requestId: (req as Request & { id?: string }).id
		})
	}

	return res.json({
		id: user._id.toString(),
		email: user.email,
		name: user.name,
		avatarUrl: user.avatarUrl ?? null
	})
}
