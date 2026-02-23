import { z } from 'zod'

// --- Enums ---

export const BodyPartEnum = z.enum([
	'Arms',
	'Back',
	'Chest',
	'Core',
	'Lower Body',
	'Shoulders'
])

export type BodyPart = z.infer<typeof BodyPartEnum>

export const MuscleEnum = z.enum([
	'Abdominals',
	'Abductors',
	'Adductors',
	'Biceps',
	'Brachioradialis',
	'Calves',
	'Deltoids',
	'Glutes',
	'Hamstrings',
	'Hip Flexors',
	'Latissimus Dorsi',
	'Obliques',
	'Pectoralis',
	'Quadriceps',
	'Rotator Cuff',
	'Serratus',
	'Tibialis Anterior',
	'Trapezius',
	'Triceps',
	'Wrist Flexors'
])

export type Muscle = z.infer<typeof MuscleEnum>

export const MuscleBodyPartMap: Record<Muscle, BodyPart> = {
	Abdominals: 'Core',
	Abductors: 'Lower Body',
	Adductors: 'Lower Body',
	Biceps: 'Arms',
	Brachioradialis: 'Arms',
	Calves: 'Lower Body',
	Deltoids: 'Shoulders',
	Glutes: 'Lower Body',
	Hamstrings: 'Lower Body',
	'Hip Flexors': 'Core',
	'Latissimus Dorsi': 'Back',
	Obliques: 'Core',
	Pectoralis: 'Chest',
	Quadriceps: 'Lower Body',
	'Rotator Cuff': 'Shoulders',
	Serratus: 'Chest',
	'Tibialis Anterior': 'Lower Body',
	Trapezius: 'Back',
	Triceps: 'Arms',
	'Wrist Flexors': 'Arms'
}

export const ResistanceTypeEnum = z.enum([
	'Weights (Free)',
	'Weights (Machine)',
	'Cables',
	'Bodyweight',
	'Resistance Bands',
	'Cardio / Machine',
	'Weighted Bodyweight'
])

export type ResistanceType = z.infer<typeof ResistanceTypeEnum>

export const MeasurementTypeEnum = z.enum([
	'Strength',
	'Time-Based',
	'Distance-Based',
	'Rep-Only'
])

export type MeasurementType = z.infer<typeof MeasurementTypeEnum>

export const MeasurementTypeDetailsMap: Record<
	MeasurementType,
	{ primaryMetric: string; commonUIFields: string[] }
> = {
	Strength: { primaryMetric: 'Weight + Repetitions', commonUIFields: ['weight', 'reps'] },
	'Time-Based': {
		primaryMetric: 'Duration of the hold or movement',
		commonUIFields: ['minutes', 'seconds']
	},
	'Distance-Based': { primaryMetric: 'Length of travel', commonUIFields: ['miles', 'kilometers', 'meters'] },
	'Rep-Only': {
		primaryMetric: 'High volume or bodyweight where weight is constant',
		commonUIFields: ['reps', 'sets']
	}
}

export const DifficultyEnum = z.enum(['Beginner', 'Intermediate', 'Advanced'])

export type Difficulty = z.infer<typeof DifficultyEnum>

export const WorkoutVisibilityEnum = z.enum(['Global', 'User'])

export type WorkoutVisibility = z.infer<typeof WorkoutVisibilityEnum>

// --- Recurrence Rule (mirrors Google Calendar) ---

export const RecurrenceFrequencyEnum = z.enum([
	'daily',
	'weekly',
	'monthly',
	'yearly',
	'weekdays',
	'custom'
])

export type RecurrenceFrequency = z.infer<typeof RecurrenceFrequencyEnum>

export const DayOfWeekEnum = z.enum([
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday'
])

export type DayOfWeek = z.infer<typeof DayOfWeekEnum>

export const RecurrenceRuleSchema = z.object({
	frequency: RecurrenceFrequencyEnum,
	interval: z.number().int().positive().default(1),
	daysOfWeek: z.array(DayOfWeekEnum).optional(),
	dayOfMonth: z.number().int().min(1).max(31).optional(),
	endDate: z.string().datetime().optional(),
	count: z.number().int().positive().optional()
})

export type RecurrenceRule = z.infer<typeof RecurrenceRuleSchema>

// --- Exercise ---

export const ExerciseSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	muscles: z.array(MuscleEnum),
	bodyParts: z.array(BodyPartEnum),
	resistanceType: ResistanceTypeEnum,
	measurementType: MeasurementTypeEnum,
	steps: z.array(z.string()),
	videoUrl: z.string().url().optional().nullable(),
	category: z.string().optional(),
	isGlobal: z.boolean()
})

export type Exercise = z.infer<typeof ExerciseSchema>

export const CreateExerciseSchema = ExerciseSchema.omit({ id: true, slug: true, isGlobal: true })

export type CreateExercise = z.infer<typeof CreateExerciseSchema>

// --- Exercise Set (measurement fields per set) ---

export const ExerciseSetSchema = z.object({
	setNumber: z.number().int().positive(),
	weight: z.number().optional(),
	reps: z.number().int().optional(),
	minutes: z.number().optional(),
	seconds: z.number().optional(),
	miles: z.number().optional(),
	kilometers: z.number().optional(),
	meters: z.number().optional()
})

export type ExerciseSet = z.infer<typeof ExerciseSetSchema>

// --- Exercise Log ---

export const ExerciseLogSchema = z.object({
	id: z.string(),
	userId: z.string(),
	exerciseId: z.string(),
	date: z.string(),
	startTime: z.string(),
	endTime: z.string(),
	resistanceType: ResistanceTypeEnum,
	sets: z.array(ExerciseSetSchema),
	notes: z.string().optional(),
	writtenToHealthKit: z.boolean().default(false)
})

export type ExerciseLog = z.infer<typeof ExerciseLogSchema>

export const CreateExerciseLogSchema = ExerciseLogSchema.omit({
	id: true,
	userId: true,
	writtenToHealthKit: true
})

export type CreateExerciseLog = z.infer<typeof CreateExerciseLogSchema>

// --- Workout ---

export const WorkoutExerciseSchema = z.object({
	exerciseId: z.string(),
	order: z.number().int().min(0),
	defaultSets: z.number().int().positive().optional(),
	defaultReps: z.number().int().positive().optional(),
	defaultWeight: z.number().optional()
})

export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>

export const WorkoutSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	difficulty: DifficultyEnum,
	isGlobal: z.boolean(),
	userId: z.string().optional().nullable(),
	exercises: z.array(WorkoutExerciseSchema),
	schedule: RecurrenceRuleSchema.optional().nullable(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional()
})

export type Workout = z.infer<typeof WorkoutSchema>

export const CreateWorkoutSchema = WorkoutSchema.omit({
	id: true,
	isGlobal: true,
	userId: true,
	createdAt: true,
	updatedAt: true
})

export type CreateWorkout = z.infer<typeof CreateWorkoutSchema>

export const UpdateWorkoutSchema = CreateWorkoutSchema.partial()

export type UpdateWorkout = z.infer<typeof UpdateWorkoutSchema>

// --- Workout Log ---

export const WorkoutLogSchema = z.object({
	id: z.string(),
	userId: z.string(),
	workoutId: z.string(),
	date: z.string(),
	startTime: z.string(),
	endTime: z.string(),
	exerciseLogIds: z.array(z.string()),
	completedAll: z.boolean()
})

export type WorkoutLog = z.infer<typeof WorkoutLogSchema>

export const CreateWorkoutLogSchema = WorkoutLogSchema.omit({ id: true, userId: true })

export type CreateWorkoutLog = z.infer<typeof CreateWorkoutLogSchema>

// --- Query Filters ---

export const ExerciseFiltersSchema = z.object({
	bodyPart: BodyPartEnum.optional(),
	muscle: MuscleEnum.optional(),
	search: z.string().optional(),
	favoritesOnly: z
		.string()
		.transform((v) => v === 'true')
		.optional()
})

export type ExerciseFilters = z.infer<typeof ExerciseFiltersSchema>

export const WorkoutFiltersSchema = z.object({
	difficulty: DifficultyEnum.optional(),
	visibility: WorkoutVisibilityEnum.optional()
})

export type WorkoutFilters = z.infer<typeof WorkoutFiltersSchema>

export const HistoryFiltersSchema = z.object({
	page: z
		.string()
		.transform(Number)
		.pipe(z.number().int().positive())
		.optional()
		.default('1'),
	limit: z
		.string()
		.transform(Number)
		.pipe(z.number().int().positive().max(100))
		.optional()
		.default('20'),
	type: z.enum(['exercise', 'workout']).optional()
})

export type HistoryFilters = z.infer<typeof HistoryFiltersSchema>

// --- AI Insight ---

export const AIInsightSchema = z.object({
	insight: z.string(),
	generatedAt: z.string()
})

export type AIInsight = z.infer<typeof AIInsightSchema>
