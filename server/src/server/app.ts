import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
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
	app.use(cors())
	app.use(express.json())

	// Health check
	app.get('/health', (_req, res) => {
		res.json({ status: 'ok', timestamp: new Date().toISOString() })
	})

	// Auth routes
	app.use('/v1/auth', authRoutes)

	// Health pillar routes
	app.use('/v1/exercises', exerciseRoutes)
	app.use('/v1/workouts', workoutRoutes)
	app.use('/v1/history', historyRoutes)
	app.use('/v1/health', healthInsightRoutes)

	// Sleep pillar routes
	app.use('/v1/sleep', sleepRoutes)

	// Time pillar routes
	app.use('/v1/time', timeRoutes)

	// Food pillar routes
	app.use('/v1/food/meal-plans', mealPlanRoutes)
	app.use('/v1/food/recipes', recipeRoutes)
	app.use('/v1/food/grocery-lists', groceryListRoutes)
	app.use('/v1/food/log', foodLogRoutes)

	// Household pillar routes
	app.use('/v1/household', householdRoutes)

	// OpenAPI spec
	app.get('/openapi.json', (_req, res) => {
		res.json(generateOpenAPIDocument())
	})

	// Error handling
	app.use(notFoundHandler)
	app.use(errorHandler)

	return app
}

function notFoundHandler(_req: express.Request, res: express.Response) {
	res.status(404).json({ error: 'Not found' })
}
