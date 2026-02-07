import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { env } from '../config'
import { requestId } from '../middleware/requestId'
import { errorHandler } from '../middleware/errorHandler'
import { authRoutes } from '../features/auth/routes'
import { generateOpenAPIDocument } from '../lib/openapi'

export function createApp() {
	const app = express()

	app.use(helmet())
	app.use(express.json())
	app.use(requestId)

	app.use(
		cors({
			origin: [env.WEB_URL, env.API_URL].filter(Boolean),
			credentials: true
		})
	)

	app.get('/health', (_req, res) => {
		res.json({ status: 'ok', timestamp: new Date().toISOString() })
	})

	const openApiSpec = generateOpenAPIDocument(env.API_URL)
	app.get('/v1/openapi.json', (_req, res) => {
		res.json(openApiSpec)
	})
	app.use('/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec))

	const authLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 100,
		message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
	})

	app.use('/v1/auth', authLimiter, authRoutes)

	return app
}
