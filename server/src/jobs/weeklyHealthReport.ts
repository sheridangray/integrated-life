import { logger } from '../lib/logger'
import * as healthService from '../features/health/service'
import * as repo from '../features/health/repository'

export async function generateWeeklyReports(): Promise<void> {
	const since = new Date()
	since.setDate(since.getDate() - 7)

	const userIds = await repo.findUsersWithRecentSamples(since)
	logger.info('Weekly health report: found users with recent data', { count: userIds.length })

	for (const userId of userIds) {
		try {
			await healthService.generateReport(userId, 'weekly')
			logger.info('Weekly health report generated', { userId })
		} catch (err) {
			logger.error('Weekly health report failed', {
				userId,
				error: (err as Error).message
			})
		}
	}

	logger.info('Weekly health report job complete', { usersProcessed: userIds.length })
}
