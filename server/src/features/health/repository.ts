import mongoose from 'mongoose'
import { Exercise, ExerciseDocument } from '../../models/Exercise'
import { Workout, WorkoutDocument } from '../../models/Workout'
import { ExerciseLog, ExerciseLogDocument } from '../../models/ExerciseLog'
import { WorkoutLog, WorkoutLogDocument } from '../../models/WorkoutLog'
import { UserFavoriteExercise } from '../../models/UserFavoriteExercise'

// --- Exercises ---

export async function findExercises(filters: {
	bodyPart?: string
	muscle?: string
	search?: string
}): Promise<ExerciseDocument[]> {
	const query: Record<string, unknown> = {}

	if (filters.bodyPart) query.bodyParts = filters.bodyPart
	if (filters.muscle) query.muscles = filters.muscle
	if (filters.search) query.name = { $regex: filters.search, $options: 'i' }

	return Exercise.find(query).sort({ name: 1 }).exec()
}

export async function findExerciseById(id: string): Promise<ExerciseDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return Exercise.findById(id).exec()
}

// --- Favorites ---

export async function findFavoriteExerciseIds(userId: string): Promise<string[]> {
	const favs = await UserFavoriteExercise.find({ userId }).select('exerciseId').exec()
	return favs.map((f) => f.exerciseId.toString())
}

export async function toggleFavorite(userId: string, exerciseId: string): Promise<boolean> {
	const existing = await UserFavoriteExercise.findOne({ userId, exerciseId }).exec()
	if (existing) {
		await existing.deleteOne()
		return false
	}
	await UserFavoriteExercise.create({ userId, exerciseId })
	return true
}

// --- Exercise Logs ---

export async function createExerciseLog(data: {
	userId: string
	exerciseId: string
	date: string
	startTime: string
	endTime: string
	resistanceType: string
	sets: Array<Record<string, unknown>>
	notes?: string
}): Promise<ExerciseLogDocument> {
	return ExerciseLog.create(data)
}

export async function findExerciseLogsByExercise(
	userId: string,
	exerciseId: string,
	limit = 20
): Promise<ExerciseLogDocument[]> {
	return ExerciseLog.find({ userId, exerciseId }).sort({ date: -1 }).limit(limit).exec()
}

export async function findLastExerciseLog(
	userId: string,
	exerciseId: string
): Promise<ExerciseLogDocument | null> {
	return ExerciseLog.findOne({ userId, exerciseId }).sort({ date: -1 }).exec()
}

export async function findExerciseLogById(
	userId: string,
	logId: string
): Promise<ExerciseLogDocument | null> {
	if (!mongoose.isValidObjectId(logId)) return null
	return ExerciseLog.findOne({ _id: logId, userId }).exec()
}

// --- Workouts ---

export async function findWorkouts(filters: {
	difficulty?: string
	visibility?: string
	userId?: string
}): Promise<WorkoutDocument[]> {
	const query: Record<string, unknown> = {}

	if (filters.difficulty) query.difficulty = filters.difficulty
	if (filters.visibility === 'Global') {
		query.isGlobal = true
	} else if (filters.visibility === 'User' && filters.userId) {
		query.userId = filters.userId
		query.isGlobal = false
	}

	return Workout.find(query).sort({ name: 1 }).exec()
}

export async function findWorkoutById(id: string): Promise<WorkoutDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return Workout.findById(id).populate('exercises.exerciseId').exec()
}

export async function createWorkout(data: {
	name: string
	difficulty: string
	userId: string
	exercises: Array<{ exerciseId: string; order: number; defaultSets?: number; defaultReps?: number; defaultWeight?: number }>
	schedule?: Record<string, unknown>
}): Promise<WorkoutDocument> {
	return Workout.create({ ...data, isGlobal: false })
}

export async function updateWorkout(
	id: string,
	userId: string,
	data: Record<string, unknown>
): Promise<WorkoutDocument | null> {
	return Workout.findOneAndUpdate(
		{ _id: id, userId, isGlobal: false },
		{ $set: data },
		{ new: true }
	).exec()
}

export async function deleteWorkout(id: string, userId: string): Promise<boolean> {
	const result = await Workout.deleteOne({ _id: id, userId, isGlobal: false }).exec()
	return result.deletedCount > 0
}

// --- Workout Logs ---

export async function createWorkoutLog(data: {
	userId: string
	workoutId: string
	date: string
	startTime: string
	endTime: string
	exerciseLogIds: string[]
	completedAll: boolean
}): Promise<WorkoutLogDocument> {
	return WorkoutLog.create(data)
}

export async function findWorkoutLogById(
	userId: string,
	logId: string
): Promise<WorkoutLogDocument | null> {
	if (!mongoose.isValidObjectId(logId)) return null
	return WorkoutLog.findOne({ _id: logId, userId })
		.populate('exerciseLogIds')
		.populate('workoutId')
		.exec()
}

// --- History ---

export async function findHistory(
	userId: string,
	options: { page: number; limit: number; type?: string }
): Promise<{ items: Array<{ type: string; doc: ExerciseLogDocument | WorkoutLogDocument }>; total: number }> {
	const { page, limit, type } = options
	const skip = (page - 1) * limit

	if (type === 'workout') {
		const [items, total] = await Promise.all([
			WorkoutLog.find({ userId }).sort({ date: -1 }).skip(skip).limit(limit).populate('workoutId').exec(),
			WorkoutLog.countDocuments({ userId })
		])
		return {
			items: items.map((doc) => ({ type: 'workout' as const, doc })),
			total
		}
	}

	if (type === 'exercise') {
		const [items, total] = await Promise.all([
			ExerciseLog.find({ userId }).sort({ date: -1 }).skip(skip).limit(limit).populate('exerciseId').exec(),
			ExerciseLog.countDocuments({ userId })
		])
		return {
			items: items.map((doc) => ({ type: 'exercise' as const, doc })),
			total
		}
	}

	const [exerciseLogs, workoutLogs, exerciseTotal, workoutTotal] = await Promise.all([
		ExerciseLog.find({ userId }).sort({ date: -1 }).populate('exerciseId').exec(),
		WorkoutLog.find({ userId }).sort({ date: -1 }).populate('workoutId').exec(),
		ExerciseLog.countDocuments({ userId }),
		WorkoutLog.countDocuments({ userId })
	])

	const combined = [
		...exerciseLogs.map((doc) => ({ type: 'exercise' as const, doc, date: doc.date })),
		...workoutLogs.map((doc) => ({ type: 'workout' as const, doc, date: doc.date }))
	]
		.sort((a, b) => (b.date > a.date ? 1 : -1))
		.slice(skip, skip + limit)

	return {
		items: combined.map(({ type: t, doc }) => ({ type: t, doc })),
		total: exerciseTotal + workoutTotal
	}
}

export async function findRecentExerciseLogs(userId: string, days: number): Promise<ExerciseLogDocument[]> {
	const since = new Date()
	since.setDate(since.getDate() - days)
	return ExerciseLog.find({ userId, createdAt: { $gte: since } })
		.sort({ date: -1 })
		.populate('exerciseId')
		.exec()
}
