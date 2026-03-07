import { AppError } from '../../lib/errors'
import * as repo from './repository'
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
