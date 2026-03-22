import { Request, Response } from 'express'

type RequestWithId = Request & { id?: string }

/**
 * Express does not JSON-404 unmatched routes by default (often HTML ~hundreds of bytes).
 * Mobile clients expect `{ error: { message } }` so errors parse consistently.
 */
export function notFoundHandler(req: RequestWithId, res: Response) {
	res.status(404).json({
		error: {
			code: 'NOT_FOUND',
			message: `Cannot ${req.method} ${req.originalUrl}`
		},
		requestId: req.id ?? 'unknown'
	})
}
