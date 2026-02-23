import {
	ExerciseFiltersSchema,
	WorkoutFiltersSchema,
	HistoryFiltersSchema,
	CreateExerciseLogSchema,
	CreateWorkoutSchema,
	UpdateWorkoutSchema,
	CreateWorkoutLogSchema
} from '@integrated-life/shared'

export const exerciseFiltersValidator = ExerciseFiltersSchema
export const workoutFiltersValidator = WorkoutFiltersSchema
export const historyFiltersValidator = HistoryFiltersSchema
export const createExerciseLogValidator = CreateExerciseLogSchema
export const createWorkoutValidator = CreateWorkoutSchema
export const updateWorkoutValidator = UpdateWorkoutSchema
export const createWorkoutLogValidator = CreateWorkoutLogSchema
