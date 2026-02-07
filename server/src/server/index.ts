import mongoose from 'mongoose'
import { env } from '../config'
import { logger } from '../lib/logger'
import { createApp } from './app'
import { errorHandler } from '../middleware/errorHandler'

async function start() {
	await mongoose.connect(env.MONGODB_URI)
	logger.info('Connected to MongoDB')

	const app = createApp()
	app.use(errorHandler)

	app.listen(env.PORT, () => {
		logger.info(`Server listening on port ${env.PORT}`)
	})
}

start().catch((err) => {
	logger.error('Failed to start server', { error: err.message })
	process.exit(1)
})
