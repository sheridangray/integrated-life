import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { env } from '../config'
import { requestId } from '../middleware/requestId'
import { notFoundHandler } from '../middleware/notFound'
import { errorHandler } from '../middleware/errorHandler'
import { authRoutes } from '../features/auth/routes'
import { exerciseRoutes, workoutRoutes, historyRoutes, healthInsightRoutes } from '../features/health/routes'
import { sleepRoutes } from '../features/sleep/routes'
import { timeRoutes } from '../features/time/routes'
import { mealPlanRoutes, recipeRoutes, groceryListRoutes, foodLogRoutes } from '../features/food/routes'
import { householdRoutes } from '../features/household/routes'
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
	app.use('/v1/exercises', exerciseRoutes)
	app.use('/v1/workouts', workoutRoutes)
	app.use('/v1/history', historyRoutes)
	app.use('/v1/health', healthInsightRoutes)
	app.use('/v1/sleep', sleepRoutes)
	app.use('/v1/time', timeRoutes)
	app.use('/v1/food/meal-plans', mealPlanRoutes)
	app.use('/v1/food/recipes', recipeRoutes)
	app.use('/v1/food/grocery-lists', groceryListRoutes)
	app.use('/v1/food/log', foodLogRoutes)
	app.use('/v1/household', householdRoutes)

	app.use(notFoundHandler)

	return app
}
