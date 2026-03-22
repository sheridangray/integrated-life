import { AppError } from '../../lib/errors'
import * as apns from '../../integrations/apns'
import { logger } from '../../lib/logger'
import { User } from '../../models/User'
import * as repo from './repository'
import * as healthAI from './ai'
import type { PaginatedResult, HistoryItem } from './types'

// --- Exercises ---

export async function listExercises(filters: {
	bodyPart?: string
	muscle?: string
	search?: string
	favoritesOnly?: boolean
	userId?: string
}) {
	let exercises = await repo.findExercises({
		bodyPart: filters.bodyPart,
		muscle: filters.muscle,
		search: filters.search
	})

	let favoriteIds: string[] = []
	if (filters.userId) {
		favoriteIds = await repo.findFavoriteExerciseIds(filters.userId)
	}

	if (filters.favoritesOnly && filters.userId) {
		exercises = exercises.filter((e) => favoriteIds.includes(e._id.toString()))
	}

	return exercises.map((e) => ({
		id: e._id.toString(),
		name: e.name,
		slug: e.slug,
		muscles: e.muscles,
		bodyParts: e.bodyParts,
		resistanceType: e.resistanceType,
		measurementType: e.measurementType,
		steps: e.steps,
		videoUrl: e.videoUrl ?? null,
		category: e.category ?? null,
		isGlobal: e.isGlobal,
		isFavorite: favoriteIds.includes(e._id.toString())
	}))
}

export async function getExercise(id: string, userId?: string) {
	const exercise = await repo.findExerciseById(id)
	if (!exercise) throw new AppError('Exercise not found', 404)

	let isFavorite = false
	if (userId) {
		const favIds = await repo.findFavoriteExerciseIds(userId)
		isFavorite = favIds.includes(exercise._id.toString())
	}

	return {
		id: exercise._id.toString(),
		name: exercise.name,
		slug: exercise.slug,
		muscles: exercise.muscles,
		bodyParts: exercise.bodyParts,
		resistanceType: exercise.resistanceType,
		measurementType: exercise.measurementType,
		steps: exercise.steps,
		videoUrl: exercise.videoUrl ?? null,
		category: exercise.category ?? null,
		isGlobal: exercise.isGlobal,
		isFavorite
	}
}

export async function toggleFavorite(userId: string, exerciseId: string) {
	const exercise = await repo.findExerciseById(exerciseId)
	if (!exercise) throw new AppError('Exercise not found', 404)

	const isFavorite = await repo.toggleFavorite(userId, exerciseId)
	return { isFavorite }
}

// --- Exercise Logging ---

export async function logExercise(userId: string, exerciseId: string, data: {
	date: string
	startTime: string
	endTime: string
	resistanceType: string
	sets: Array<Record<string, unknown>>
	notes?: string
}) {
	const exercise = await repo.findExerciseById(exerciseId)
	if (!exercise) throw new AppError('Exercise not found', 404)

	const log = await repo.createExerciseLog({
		userId,
		exerciseId,
		...data
	})

	return {
		id: log._id.toString(),
		userId: log.userId.toString(),
		exerciseId: log.exerciseId.toString(),
		date: log.date,
		startTime: log.startTime,
		endTime: log.endTime,
		resistanceType: log.resistanceType,
		sets: log.sets,
		notes: log.notes ?? null,
		writtenToHealthKit: log.writtenToHealthKit
	}
}

export async function getLastExerciseLog(userId: string, exerciseId: string) {
	const log = await repo.findLastExerciseLog(userId, exerciseId)
	if (!log) return null

	return {
		id: log._id.toString(),
		userId: log.userId.toString(),
		exerciseId: log.exerciseId.toString(),
		date: log.date,
		startTime: log.startTime,
		endTime: log.endTime,
		resistanceType: log.resistanceType,
		sets: log.sets,
		notes: log.notes ?? null,
		writtenToHealthKit: log.writtenToHealthKit
	}
}

export async function getExerciseHistory(userId: string, exerciseId: string) {
	const logs = await repo.findExerciseLogsByExercise(userId, exerciseId)
	return logs.map((log) => ({
		id: log._id.toString(),
		date: log.date,
		startTime: log.startTime,
		endTime: log.endTime,
		resistanceType: log.resistanceType,
		sets: log.sets,
		notes: log.notes ?? null
	}))
}

// --- Delete History ---

export async function deleteHistoryItem(userId: string, type: string, id: string) {
	if (type === 'exercise') {
		const deleted = await repo.deleteExerciseLog(userId, id)
		if (!deleted) throw new AppError('Exercise log not found or not owned by user', 404)
		return
	}
	if (type === 'workout') {
		const deleted = await repo.deleteWorkoutLog(userId, id)
		if (!deleted) throw new AppError('Workout log not found or not owned by user', 404)
		return
	}
	throw new AppError('Invalid history type', 400)
}

// --- Workouts ---

export async function listWorkouts(filters: {
	visibility?: string
	userId?: string
}) {
	const workouts = await repo.findWorkouts({
		visibility: filters.visibility,
		userId: filters.userId
	})

	return workouts.map((w) => ({
		id: w._id.toString(),
		name: w.name,
		isGlobal: w.isGlobal,
		userId: w.userId?.toString() ?? null,
		exerciseCount: w.exercises.length,
		schedule: w.schedule ?? null
	}))
}

export async function getWorkout(id: string) {
	const workout = await repo.findWorkoutById(id)
	if (!workout) throw new AppError('Workout not found', 404)

	return {
		id: workout._id.toString(),
		name: workout.name,
		isGlobal: workout.isGlobal,
		userId: workout.userId?.toString() ?? null,
		exercises: workout.exercises.map((e) => {
			const ex = e.exerciseId as unknown as { _id: { toString(): string }; name: string }
			return {
				exerciseId: ex._id.toString(),
				name: ex.name,
				order: e.order,
				defaultSets: e.defaultSets ?? null,
				defaultReps: e.defaultReps ?? null,
				defaultWeight: e.defaultWeight ?? null
			}
		}),
		schedule: workout.schedule ?? null
	}
}

export async function createWorkout(userId: string, data: {
	name: string
	exercises: Array<{ exerciseId: string; order: number; defaultSets?: number; defaultReps?: number; defaultWeight?: number }>
	schedule?: Record<string, unknown> | null
}) {
	const workout = await repo.createWorkout({ ...data, userId, schedule: data.schedule ?? undefined })
	return {
		id: workout._id.toString(),
		name: workout.name,
		isGlobal: workout.isGlobal,
		userId: workout.userId?.toString() ?? null,
		exercises: workout.exercises,
		schedule: workout.schedule ?? null
	}
}

export async function updateWorkout(id: string, userId: string, data: Record<string, unknown>) {
	const workout = await repo.updateWorkout(id, userId, data)
	if (!workout) throw new AppError('Workout not found or not owned by user', 404)

	return {
		id: workout._id.toString(),
		name: workout.name,
		isGlobal: workout.isGlobal,
		exercises: workout.exercises,
		schedule: workout.schedule ?? null
	}
}

export async function deleteWorkout(id: string, userId: string) {
	const deleted = await repo.deleteWorkout(id, userId)
	if (!deleted) throw new AppError('Workout not found or not owned by user', 404)
}

// --- Workout Logging ---

export async function logWorkout(userId: string, data: {
	workoutId: string
	date: string
	startTime: string
	endTime: string
	exerciseLogIds: string[]
	completedAll: boolean
}) {
	const log = await repo.createWorkoutLog({ ...data, userId })
	return {
		id: log._id.toString(),
		userId: log.userId.toString(),
		workoutId: log.workoutId.toString(),
		date: log.date,
		startTime: log.startTime,
		endTime: log.endTime,
		exerciseLogIds: log.exerciseLogIds.map((id) => id.toString()),
		completedAll: log.completedAll
	}
}

// --- History ---

export async function getHistory(
	userId: string,
	filters: { page: number; limit: number; type?: string }
): Promise<PaginatedResult<HistoryItem>> {
	const { items, total } = await repo.findHistory(userId, filters)
	const totalPages = Math.ceil(total / filters.limit)

	const mapped: HistoryItem[] = items.map((item) => {
		const doc = item.doc as unknown as {
			_id: { toString(): string }
			date: string
			startTime: string
			endTime: string
			exerciseId?: { name: string }
			workoutId?: { name: string }
			exerciseLogIds?: Array<{ toString(): string }>
		}
		const base = {
			type: item.type as 'exercise' | 'workout',
			id: doc._id.toString(),
			name: item.type === 'exercise'
				? (doc.exerciseId?.name ?? 'Unknown exercise')
				: (doc.workoutId?.name ?? 'Unknown workout'),
			date: doc.date,
			startTime: doc.startTime,
			endTime: doc.endTime
		}
		if (item.type === 'workout' && doc.exerciseLogIds) {
			return { ...base, exerciseLogIds: doc.exerciseLogIds.map((eid) => eid.toString()) }
		}
		return base
	})

	return {
		items: mapped,
		total,
		page: filters.page,
		limit: filters.limit,
		totalPages
	}
}

export async function saveWorkoutInsight(
	userId: string,
	workoutLogId: string,
	insight: Record<string, unknown>
) {
	await repo.updateWorkoutLogInsight(userId, workoutLogId, insight)
}

export async function getHistoryDetail(userId: string, type: string, id: string) {
	if (type === 'exercise') {
		const log = await repo.findExerciseLogById(userId, id)
		if (!log) throw new AppError('Exercise log not found', 404)
		return {
			type: 'exercise',
			id: log._id.toString(),
			exerciseId: log.exerciseId.toString(),
			date: log.date,
			startTime: log.startTime,
			endTime: log.endTime,
			resistanceType: log.resistanceType,
			sets: log.sets,
			notes: log.notes ?? null
		}
	}

	if (type === 'workout') {
		const log = await repo.findWorkoutLogById(userId, id)
		if (!log) throw new AppError('Workout log not found', 404)

		const populatedLogs = log.exerciseLogIds as unknown as Array<{
			_id: { toString(): string }
			exerciseId: { _id: { toString(): string }; name: string } | string
			date: string
			resistanceType: string
			sets: unknown[]
			notes?: string
		}>

		return {
			type: 'workout',
			id: log._id.toString(),
			workoutName: (log.workoutId as unknown as { name: string })?.name ?? 'Workout',
			date: log.date,
			startTime: log.startTime,
			endTime: log.endTime,
			completedAll: log.completedAll,
			exercises: populatedLogs.map((el) => ({
				id: el._id.toString(),
				exerciseName: typeof el.exerciseId === 'object' ? el.exerciseId.name : 'Exercise',
				date: el.date,
				resistanceType: el.resistanceType,
				sets: el.sets,
				notes: el.notes ?? null
			})),
			workoutInsight: log.workoutInsight ?? null
		}
	}

	throw new AppError('Invalid history type', 400)
}

// --- Health Samples ---

export async function syncHealthSamples(
	userId: string,
	samples: Array<{ sampleType: string; date: string; value: number; unit: string; source?: string }>
) {
	const count = await repo.upsertHealthSamples(userId, samples)
	return { synced: count }
}

export async function getHealthSamples(
	userId: string,
	sampleType: string,
	start: string,
	end: string
) {
	const samples = await repo.findHealthSamples(
		userId,
		sampleType,
		new Date(start),
		new Date(end)
	)
	return samples.map((s) => ({
		id: s._id.toString(),
		sampleType: s.sampleType,
		date: s.date.toISOString(),
		value: s.value,
		unit: s.unit,
		source: s.source ?? null
	}))
}

export async function getLatestHealthSamples(userId: string) {
	const samples = await repo.findLatestHealthSamples(userId)
	return samples.map((s) => ({
		sampleType: s.sampleType,
		date: s.date.toISOString(),
		value: s.value,
		unit: s.unit
	}))
}

// --- Push (APNs) ---

export async function registerIosPushDeviceToken(userId: string, deviceTokenHex: string) {
	const normalized = deviceTokenHex.trim().toLowerCase().replace(/\s/g, '')
	if (!/^[0-9a-f]{64,256}$/.test(normalized)) {
		throw new AppError('Invalid device token', 400)
	}

	const found = await User.findById(userId).exec()
	if (!found) throw new AppError('User not found', 404)

	const existing = found.iosPushDeviceTokens ?? []
	const merged = [normalized, ...existing.filter((t) => t !== normalized)].slice(0, 8)
	await User.findByIdAndUpdate(userId, { $set: { iosPushDeviceTokens: merged } })
	return { registered: true as const }
}

/** Debug / iterative testing: send an alert push to all tokens for this user. */
export async function sendTestApnsPushToUser(userId: string) {
	if (!apns.isApnsConfigured()) {
		throw new AppError(
			'APNs is not configured (set APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_PATH on the server)',
			503
		)
	}

	const u = await User.findById(userId).select('iosPushDeviceTokens').lean()
	const tokens = u?.iosPushDeviceTokens ?? []
	if (tokens.length === 0) {
		throw new AppError(
			'No device tokens on file. Open the app signed in, allow notifications, bring app to foreground once, then try again.',
			400
		)
	}

	const sent = await apns.sendApnsAlertToMany(tokens, {
		title: 'Integrated Life — test push',
		body: 'APNs path is working. This was sent from the debug API.',
		data: { type: 'debug_push_test' }
	})

	logger.info('Test APNs push', { userId, sent, attempted: tokens.length })
	return { sent, attempted: tokens.length }
}

async function sendHealthReportPushNotification(
	userId: string,
	reportId: string,
	type: 'weekly' | 'on_demand',
	periodStart: Date,
	periodEnd: Date
) {
	if (!apns.isApnsConfigured()) return

	const u = await User.findById(userId).select('iosPushDeviceTokens').lean()
	const tokens = u?.iosPushDeviceTokens ?? []
	if (tokens.length === 0) return

	const fmt = (d: Date) => d.toISOString().split('T')[0]
	await apns.sendApnsAlertToMany(tokens, {
		title: type === 'weekly' ? 'Weekly Health Report Ready' : 'Health Report Ready',
		body: `Your health report for ${fmt(periodStart)} to ${fmt(periodEnd)} is ready to view.`,
		data: { reportId, reportType: type }
	})
}

// --- Health Reports ---

export async function generateReport(
	userId: string,
	type: 'weekly' | 'on_demand',
	periodStart?: string,
	periodEnd?: string
) {
	const end = periodEnd ? new Date(periodEnd) : new Date()
	const start = periodStart ? new Date(periodStart) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
	const priorStart = new Date(start.getTime() - (end.getTime() - start.getTime()))

	const [currentSamples, priorSamples, workoutLogs, allExerciseLogs] = await Promise.all([
		repo.findHealthSamplesByUser(userId, start, end),
		repo.findHealthSamplesByUser(userId, priorStart, start),
		repo.findWorkoutLogsByDateRange(userId, start, end),
		repo.findExerciseLogsByDateRange(userId, start, end)
	])

	const hasData = currentSamples.length > 0 || workoutLogs.length > 0 || allExerciseLogs.length > 0
	if (!hasData) {
		throw new AppError('No health data available for the selected period', 400)
	}

	const groupByType = (samples: typeof currentSamples) => {
		const grouped: Record<string, Array<{ date: string; value: number }>> = {}
		for (const s of samples) {
			if (!grouped[s.sampleType]) grouped[s.sampleType] = []
			grouped[s.sampleType].push({ date: s.date.toISOString(), value: s.value })
		}
		return grouped
	}

	const workoutExerciseLogIds = new Set(
		workoutLogs.flatMap((wl) => wl.exerciseLogIds.map((id) => id.toString()))
	)

	const workouts: healthAI.WorkoutSummaryForReport[] = workoutLogs.map((wl) => {
		const populated = wl.exerciseLogIds as unknown as Array<{
			exerciseId: { name: string; bodyParts: string[] } | string
			sets: Array<{ weight?: number; reps?: number; minutes?: number; seconds?: number }>
		}>

		return {
			date: wl.date,
			workoutName: (wl.workoutId as unknown as { name: string })?.name ?? 'Workout',
			startTime: wl.startTime,
			endTime: wl.endTime,
			completedAll: wl.completedAll,
			exercises: populated.map((el) => {
				const exercise = typeof el.exerciseId === 'object' ? el.exerciseId : null
				return {
					exerciseName: exercise?.name ?? 'Exercise',
					bodyParts: exercise?.bodyParts ?? [],
					sets: el.sets.map((s) => ({
						weight: s.weight, reps: s.reps,
						minutes: s.minutes, seconds: s.seconds
					}))
				}
			})
		}
	})

	const standaloneExercises: healthAI.StandaloneExerciseForReport[] = allExerciseLogs
		.filter((el) => !workoutExerciseLogIds.has(el._id.toString()))
		.map((el) => {
			const exercise = el.exerciseId as unknown as { name: string; bodyParts: string[] } | null
			return {
				date: el.date,
				exerciseName: exercise?.name ?? 'Exercise',
				bodyParts: exercise?.bodyParts ?? [],
				resistanceType: el.resistanceType,
				sets: el.sets.map((s) => ({
					weight: s.weight, reps: s.reps,
					minutes: s.minutes, seconds: s.seconds
				}))
			}
		})

	const user = await User.findById(userId).exec()
	const userProfile = user ? { gender: user.gender, dateOfBirth: user.dateOfBirth } : undefined

	const reportText = await healthAI.getComprehensiveReport(
		groupByType(currentSamples),
		groupByType(priorSamples),
		start.toISOString().split('T')[0],
		end.toISOString().split('T')[0],
		userProfile,
		workouts,
		standaloneExercises
	)

	if (!reportText) {
		throw new AppError('Failed to generate report', 500)
	}

	const metrics = [...new Set(currentSamples.map((s) => s.sampleType))]
	if (workouts.length > 0) metrics.push('workouts')
	if (standaloneExercises.length > 0) metrics.push('standalone_exercises')

	const report = await repo.createHealthReport({
		userId,
		type,
		periodStart: start,
		periodEnd: end,
		report: reportText,
		metrics
	})

	const reportId = report._id.toString()
	void sendHealthReportPushNotification(userId, reportId, type, start, end).catch((err) => {
		logger.error('Health report APNs failed', { error: (err as Error).message, userId })
	})

	return {
		id: reportId,
		type: report.type,
		periodStart: report.periodStart.toISOString(),
		periodEnd: report.periodEnd.toISOString(),
		report: report.report,
		metrics: report.metrics,
		generatedAt: report.generatedAt.toISOString()
	}
}

export async function listReports(userId: string, since?: string) {
	const sinceDate = since ? new Date(since) : undefined
	const reports = await repo.findHealthReports(userId, sinceDate)
	return reports.map((r) => ({
		id: r._id.toString(),
		type: r.type,
		periodStart: r.periodStart.toISOString(),
		periodEnd: r.periodEnd.toISOString(),
		report: r.report,
		metrics: r.metrics,
		generatedAt: r.generatedAt.toISOString()
	}))
}

export async function getReport(userId: string, reportId: string) {
	const report = await repo.findHealthReportById(userId, reportId)
	if (!report) throw new AppError('Report not found', 404)

	return {
		id: report._id.toString(),
		type: report.type,
		periodStart: report.periodStart.toISOString(),
		periodEnd: report.periodEnd.toISOString(),
		report: report.report,
		metrics: report.metrics,
		generatedAt: report.generatedAt.toISOString()
	}
}

export async function exportHistoryCsv(userId: string): Promise<string> {
	const logs = await repo.findRecentExerciseLogs(userId, 365)

	const header = 'Date,Exercise,Resistance Type,Set,Weight,Reps,Minutes,Seconds,Notes'
	const rows = logs.flatMap((log) => {
		const exerciseName = (log.exerciseId as unknown as { name: string })?.name ?? 'Unknown'
		return log.sets.map((set) =>
			[
				log.date,
				`"${exerciseName}"`,
				log.resistanceType,
				set.setNumber,
				set.weight ?? '',
				set.reps ?? '',
				set.minutes ?? '',
				set.seconds ?? '',
				`"${(log.notes ?? '').replace(/"/g, '""')}"`
			].join(',')
		)
	})

	return [header, ...rows].join('\n')
}
