import type {
	Exercise,
	ExerciseLog,
	Workout,
	WorkoutLog,
	ExerciseFilters,
	WorkoutFilters,
	HistoryFilters,
	CreateExerciseLog,
	CreateWorkout,
	UpdateWorkout,
	CreateWorkoutLog,
	AIInsight
} from '@integrated-life/shared'

export type {
	Exercise,
	ExerciseLog,
	Workout,
	WorkoutLog,
	ExerciseFilters,
	WorkoutFilters,
	HistoryFilters,
	CreateExerciseLog,
	CreateWorkout,
	UpdateWorkout,
	CreateWorkoutLog,
	AIInsight
}

export type WorkoutInsight = {
	exerciseInsights: Array<{
		exerciseId: string
		exerciseName: string
		insight: string
	}>
	overallInsight: string
	generatedAt: string
}

export type PaginatedResult<T> = {
	items: T[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export type HistoryItem = {
	type: 'exercise' | 'workout'
	id: string
	name: string
	date: string
	startTime: string
	endTime: string
	exerciseLogIds?: string[]
}
