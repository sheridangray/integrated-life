import cron from 'node-cron'
import { logger } from '../lib/logger'
import { generateWeeklyReports } from './weeklyHealthReport'

export function initializeJobs(): void {
	cron.schedule('0 9 * * 0', async () => {
		logger.info('Running weekly health report job')
		try {
			await generateWeeklyReports()
		} catch (err) {
			logger.error('Weekly health report job failed', {
				error: (err as Error).message
			})
		}
	})

	logger.info('Scheduled jobs initialized (weekly health report: Sundays 9 AM)')
}
