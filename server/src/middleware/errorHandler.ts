import { Request, Response, NextFunction } from 'express'
import type { ApiError } from '@integrated-life/shared'
import { logger } from '../lib/logger'

type RequestWithId = Request & { id?: string }

export function errorHandler(err: Error, req: RequestWithId, res: Response, _next: NextFunction) {
	const requestId = req.id ?? 'unknown'

	logger.error(err.message, {
		requestId,
		stack: err.stack,
		path: req.path,
		method: req.method
	})

	const status = 'statusCode' in err && typeof (err as { statusCode?: number }).statusCode === 'number'
		? (err as { statusCode: number }).statusCode
		: 500

	const apiError: ApiError = {
		error: {
			code: status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
			message: status >= 500 ? 'An unexpected error occurred' : err.message
		},
		requestId
	}

	res.status(status).json(apiError)
}
