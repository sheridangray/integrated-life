import mongoose from 'mongoose'
import { env } from '../config'
import { logger } from '../lib/logger'
import { createApp } from './app'
import { errorHandler } from '../middleware/errorHandler'
import { seedHealthData } from '../seeds/health'
import { seedHouseholdData } from '../seeds/household'
import { initializeJobs } from '../jobs'

async function start() {
	await mongoose.connect(env.MONGODB_URI)
	logger.info('Connected to MongoDB')

	await seedHealthData()
	await seedHouseholdData()

	const app = createApp()
	app.use(errorHandler)

	initializeJobs()

	app.listen(env.PORT, () => {
		logger.info(`Server listening on port ${env.PORT}`)
	})
}

start().catch((err) => {
	logger.error('Failed to start server', { error: err.message })
	process.exit(1)
})
