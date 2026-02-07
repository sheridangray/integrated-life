import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

export function requestId(req: Request, _res: Response, next: NextFunction) {
	;(req as Request & { id?: string }).id = uuidv4()
	next()
}
