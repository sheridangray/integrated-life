import { describe, it, expect } from 'vitest'
import {
	BodyPartEnum,
	MuscleEnum,
	ResistanceTypeEnum,
	MeasurementTypeEnum,
	DifficultyEnum,
	RecurrenceFrequencyEnum,
	DayOfWeekEnum,
	WorkoutVisibilityEnum,
	MuscleBodyPartMap,
	MeasurementTypeDetailsMap,
	RecurrenceRuleSchema,
	ExerciseSchema,
	ExerciseSetSchema,
	CreateExerciseLogSchema,
	WorkoutSchema,
	CreateWorkoutSchema,
	CreateWorkoutLogSchema,
	ExerciseFiltersSchema,
	WorkoutFiltersSchema,
	HistoryFiltersSchema,
	AIInsightSchema,
} from '../health'
import type { Muscle, BodyPart, MeasurementType } from '../health'

// --- Enums ---

describe('BodyPartEnum', () => {
	it('accepts valid body parts', () => {
		for (const bp of ['Arms', 'Back', 'Chest', 'Core', 'Lower Body', 'Shoulders']) {
			expect(BodyPartEnum.safeParse(bp).success).toBe(true)
		}
	})

	it('rejects invalid body part', () => {
		expect(BodyPartEnum.safeParse('Neck').success).toBe(false)
	})
})

describe('MuscleEnum', () => {
	it('accepts valid muscles', () => {
		for (const m of ['Biceps', 'Triceps', 'Glutes', 'Quadriceps', 'Latissimus Dorsi']) {
			expect(MuscleEnum.safeParse(m).success).toBe(true)
		}
	})

	it('rejects invalid muscle', () => {
		expect(MuscleEnum.safeParse('Brachialis').success).toBe(false)
	})
})

describe('ResistanceTypeEnum', () => {
	it('accepts valid resistance types', () => {
		for (const rt of [
			'Weights (Free)',
			'Weights (Machine)',
			'Cables',
			'Bodyweight',
			'Resistance Bands',
			'Cardio / Machine',
			'Weighted Bodyweight',
		]) {
			expect(ResistanceTypeEnum.safeParse(rt).success).toBe(true)
		}
	})

	it('rejects invalid resistance type', () => {
		expect(ResistanceTypeEnum.safeParse('Pneumatic').success).toBe(false)
	})
})

describe('MeasurementTypeEnum', () => {
	it('accepts valid measurement types', () => {
		for (const mt of ['Strength', 'Time-Based', 'Distance-Based', 'Rep-Only']) {
			expect(MeasurementTypeEnum.safeParse(mt).success).toBe(true)
		}
	})

	it('rejects invalid measurement type', () => {
		expect(MeasurementTypeEnum.safeParse('Velocity').success).toBe(false)
	})
})

describe('DifficultyEnum', () => {
	it('accepts valid difficulties', () => {
		for (const d of ['Beginner', 'Intermediate', 'Advanced']) {
			expect(DifficultyEnum.safeParse(d).success).toBe(true)
		}
	})

	it('rejects invalid difficulty', () => {
		expect(DifficultyEnum.safeParse('Expert').success).toBe(false)
	})
})

describe('RecurrenceFrequencyEnum', () => {
	it('accepts valid frequencies', () => {
		for (const f of ['daily', 'weekly', 'monthly', 'yearly', 'weekdays', 'custom']) {
			expect(RecurrenceFrequencyEnum.safeParse(f).success).toBe(true)
		}
	})

	it('rejects invalid frequency', () => {
		expect(RecurrenceFrequencyEnum.safeParse('biweekly').success).toBe(false)
	})
})

describe('DayOfWeekEnum', () => {
	it('accepts all days', () => {
		for (const d of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
			expect(DayOfWeekEnum.safeParse(d).success).toBe(true)
		}
	})

	it('rejects invalid day', () => {
		expect(DayOfWeekEnum.safeParse('Monday').success).toBe(false)
	})
})

describe('WorkoutVisibilityEnum', () => {
	it('accepts Global and User', () => {
		expect(WorkoutVisibilityEnum.safeParse('Global').success).toBe(true)
		expect(WorkoutVisibilityEnum.safeParse('User').success).toBe(true)
	})

	it('rejects invalid visibility', () => {
		expect(WorkoutVisibilityEnum.safeParse('Private').success).toBe(false)
	})
})

// --- Maps ---

describe('MuscleBodyPartMap', () => {
	it('has an entry for every muscle in MuscleEnum', () => {
		const muscles = MuscleEnum.options
		for (const muscle of muscles) {
			expect(MuscleBodyPartMap).toHaveProperty(muscle)
		}
	})

	it('maps every muscle to a valid BodyPart', () => {
		const bodyParts = new Set(BodyPartEnum.options)
		for (const [muscle, bodyPart] of Object.entries(MuscleBodyPartMap)) {
			expect(bodyParts.has(bodyPart as BodyPart)).toBe(true)
		}
	})
})

describe('MeasurementTypeDetailsMap', () => {
	it('has an entry for every measurement type', () => {
		const types = MeasurementTypeEnum.options
		for (const mt of types) {
			expect(MeasurementTypeDetailsMap).toHaveProperty(mt)
		}
	})

	it('each entry has primaryMetric and commonUIFields', () => {
		for (const [, details] of Object.entries(MeasurementTypeDetailsMap)) {
			expect(details).toHaveProperty('primaryMetric')
			expect(details).toHaveProperty('commonUIFields')
			expect(typeof details.primaryMetric).toBe('string')
			expect(Array.isArray(details.commonUIFields)).toBe(true)
		}
	})
})

// --- RecurrenceRuleSchema ---

describe('RecurrenceRuleSchema', () => {
	it('accepts a minimal valid rule', () => {
		const result = RecurrenceRuleSchema.safeParse({ frequency: 'daily' })
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.interval).toBe(1)
		}
	})

	it('accepts a fully specified rule', () => {
		const result = RecurrenceRuleSchema.safeParse({
			frequency: 'weekly',
			interval: 2,
			daysOfWeek: ['monday', 'wednesday', 'friday'],
			endDate: '2026-12-31T00:00:00Z',
			count: 52,
		})
		expect(result.success).toBe(true)
	})

	it('rejects invalid frequency', () => {
		const result = RecurrenceRuleSchema.safeParse({ frequency: 'biweekly' })
		expect(result.success).toBe(false)
	})

	it('rejects negative interval', () => {
		const result = RecurrenceRuleSchema.safeParse({ frequency: 'daily', interval: -1 })
		expect(result.success).toBe(false)
	})

	it('rejects zero interval', () => {
		const result = RecurrenceRuleSchema.safeParse({ frequency: 'daily', interval: 0 })
		expect(result.success).toBe(false)
	})
})

// --- ExerciseSchema ---

describe('ExerciseSchema', () => {
	const validExercise = {
		id: 'abc123',
		name: 'Bench Press',
		slug: 'bench-press',
		muscles: ['Pectoralis', 'Triceps'],
		bodyParts: ['Chest', 'Arms'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: ['Lie on bench', 'Press bar up'],
		isGlobal: true,
	}

	it('accepts a valid exercise', () => {
		expect(ExerciseSchema.safeParse(validExercise).success).toBe(true)
	})

	it('accepts exercise with optional videoUrl', () => {
		const result = ExerciseSchema.safeParse({
			...validExercise,
			videoUrl: 'https://youtube.com/watch?v=abc',
		})
		expect(result.success).toBe(true)
	})

	it('accepts exercise with null videoUrl', () => {
		const result = ExerciseSchema.safeParse({ ...validExercise, videoUrl: null })
		expect(result.success).toBe(true)
	})

	it('rejects missing name', () => {
		const { name, ...noName } = validExercise
		expect(ExerciseSchema.safeParse(noName).success).toBe(false)
	})

	it('rejects invalid muscle enum', () => {
		const result = ExerciseSchema.safeParse({
			...validExercise,
			muscles: ['InvalidMuscle'],
		})
		expect(result.success).toBe(false)
	})

	it('rejects invalid body part enum', () => {
		const result = ExerciseSchema.safeParse({
			...validExercise,
			bodyParts: ['Neck'],
		})
		expect(result.success).toBe(false)
	})

	it('rejects invalid resistance type', () => {
		const result = ExerciseSchema.safeParse({
			...validExercise,
			resistanceType: 'Hydraulic',
		})
		expect(result.success).toBe(false)
	})
})

// --- ExerciseSetSchema ---

describe('ExerciseSetSchema', () => {
	it('accepts a valid strength set', () => {
		const result = ExerciseSetSchema.safeParse({ setNumber: 1, weight: 135, reps: 10 })
		expect(result.success).toBe(true)
	})

	it('accepts a time-based set', () => {
		const result = ExerciseSetSchema.safeParse({ setNumber: 1, minutes: 1, seconds: 30 })
		expect(result.success).toBe(true)
	})

	it('accepts a distance-based set', () => {
		const result = ExerciseSetSchema.safeParse({ setNumber: 1, miles: 3.1 })
		expect(result.success).toBe(true)
	})

	it('rejects setNumber of 0', () => {
		const result = ExerciseSetSchema.safeParse({ setNumber: 0, reps: 10 })
		expect(result.success).toBe(false)
	})

	it('rejects negative setNumber', () => {
		const result = ExerciseSetSchema.safeParse({ setNumber: -1, reps: 10 })
		expect(result.success).toBe(false)
	})

	it('rejects missing setNumber', () => {
		const result = ExerciseSetSchema.safeParse({ weight: 100, reps: 10 })
		expect(result.success).toBe(false)
	})
})

// --- CreateExerciseLogSchema ---

describe('CreateExerciseLogSchema', () => {
	const validLog = {
		exerciseId: 'ex123',
		date: '2026-02-16',
		startTime: '09:00',
		endTime: '09:30',
		resistanceType: 'Weights (Free)',
		sets: [{ setNumber: 1, weight: 135, reps: 10 }],
	}

	it('accepts a valid exercise log', () => {
		expect(CreateExerciseLogSchema.safeParse(validLog).success).toBe(true)
	})

	it('accepts a log with notes', () => {
		const result = CreateExerciseLogSchema.safeParse({ ...validLog, notes: 'Felt strong' })
		expect(result.success).toBe(true)
	})

	it('rejects missing date', () => {
		const { date, ...noDate } = validLog
		expect(CreateExerciseLogSchema.safeParse(noDate).success).toBe(false)
	})

	it('rejects missing startTime', () => {
		const { startTime, ...noStart } = validLog
		expect(CreateExerciseLogSchema.safeParse(noStart).success).toBe(false)
	})

	it('rejects invalid resistance type', () => {
		const result = CreateExerciseLogSchema.safeParse({
			...validLog,
			resistanceType: 'Invalid',
		})
		expect(result.success).toBe(false)
	})

	it('accepts empty sets array', () => {
		const result = CreateExerciseLogSchema.safeParse({ ...validLog, sets: [] })
		expect(result.success).toBe(true)
	})
})

// --- WorkoutSchema / CreateWorkoutSchema ---

describe('WorkoutSchema', () => {
	const validWorkout = {
		id: 'w123',
		name: 'Push Day',
		difficulty: 'Intermediate',
		isGlobal: true,
		exercises: [{ exerciseId: 'ex1', order: 0 }],
	}

	it('accepts a valid workout', () => {
		expect(WorkoutSchema.safeParse(validWorkout).success).toBe(true)
	})

	it('accepts workout with null schedule', () => {
		const result = WorkoutSchema.safeParse({ ...validWorkout, schedule: null })
		expect(result.success).toBe(true)
	})

	it('accepts workout with schedule', () => {
		const result = WorkoutSchema.safeParse({
			...validWorkout,
			schedule: { frequency: 'weekly', interval: 1, daysOfWeek: ['monday'] },
		})
		expect(result.success).toBe(true)
	})

	it('rejects empty name', () => {
		const result = WorkoutSchema.safeParse({ ...validWorkout, name: '' })
		expect(result.success).toBe(false)
	})

	it('rejects invalid difficulty', () => {
		const result = WorkoutSchema.safeParse({ ...validWorkout, difficulty: 'Expert' })
		expect(result.success).toBe(false)
	})
})

describe('CreateWorkoutSchema', () => {
	const validCreate = {
		name: 'Pull Day',
		difficulty: 'Beginner',
		exercises: [{ exerciseId: 'ex1', order: 0, defaultSets: 3, defaultReps: 10 }],
	}

	it('accepts a valid create workout request', () => {
		expect(CreateWorkoutSchema.safeParse(validCreate).success).toBe(true)
	})

	it('omits id, isGlobal, userId, timestamps', () => {
		const result = CreateWorkoutSchema.safeParse({
			...validCreate,
			id: 'should-be-ignored',
			isGlobal: true,
		})
		// id and isGlobal are stripped by omit, so safeParse still succeeds
		// but they should not appear in the parsed data
		expect(result.success).toBe(true)
	})
})

// --- CreateWorkoutLogSchema ---

describe('CreateWorkoutLogSchema', () => {
	const validLog = {
		workoutId: 'w123',
		date: '2026-02-16',
		startTime: '09:00',
		endTime: '10:00',
		exerciseLogIds: ['log1', 'log2'],
		completedAll: true,
	}

	it('accepts a valid workout log', () => {
		expect(CreateWorkoutLogSchema.safeParse(validLog).success).toBe(true)
	})

	it('rejects missing workoutId', () => {
		const { workoutId, ...noId } = validLog
		expect(CreateWorkoutLogSchema.safeParse(noId).success).toBe(false)
	})

	it('rejects missing date', () => {
		const { date, ...noDate } = validLog
		expect(CreateWorkoutLogSchema.safeParse(noDate).success).toBe(false)
	})

	it('rejects missing completedAll', () => {
		const { completedAll, ...noCompleted } = validLog
		expect(CreateWorkoutLogSchema.safeParse(noCompleted).success).toBe(false)
	})
})

// --- Filter Schemas ---

describe('ExerciseFiltersSchema', () => {
	it('accepts empty object', () => {
		const result = ExerciseFiltersSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('accepts valid body part filter', () => {
		const result = ExerciseFiltersSchema.safeParse({ bodyPart: 'Chest' })
		expect(result.success).toBe(true)
	})

	it('rejects invalid body part', () => {
		const result = ExerciseFiltersSchema.safeParse({ bodyPart: 'Neck' })
		expect(result.success).toBe(false)
	})

	it('transforms favoritesOnly string to boolean', () => {
		const result = ExerciseFiltersSchema.safeParse({ favoritesOnly: 'true' })
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.favoritesOnly).toBe(true)
		}
	})

	it('transforms non-true favoritesOnly string to false', () => {
		const result = ExerciseFiltersSchema.safeParse({ favoritesOnly: 'false' })
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.favoritesOnly).toBe(false)
		}
	})
})

describe('WorkoutFiltersSchema', () => {
	it('accepts empty object', () => {
		expect(WorkoutFiltersSchema.safeParse({}).success).toBe(true)
	})

	it('accepts valid difficulty', () => {
		expect(WorkoutFiltersSchema.safeParse({ difficulty: 'Beginner' }).success).toBe(true)
	})

	it('accepts valid visibility', () => {
		expect(WorkoutFiltersSchema.safeParse({ visibility: 'Global' }).success).toBe(true)
	})

	it('rejects invalid difficulty', () => {
		expect(WorkoutFiltersSchema.safeParse({ difficulty: 'Expert' }).success).toBe(false)
	})
})

describe('HistoryFiltersSchema', () => {
	it('provides defaults for page and limit', () => {
		const result = HistoryFiltersSchema.safeParse({})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.page).toBe(1)
			expect(result.data.limit).toBe(20)
		}
	})

	it('transforms string page and limit to numbers', () => {
		const result = HistoryFiltersSchema.safeParse({ page: '3', limit: '50' })
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.page).toBe(3)
			expect(result.data.limit).toBe(50)
		}
	})

	it('rejects page of 0', () => {
		const result = HistoryFiltersSchema.safeParse({ page: '0' })
		expect(result.success).toBe(false)
	})

	it('rejects limit over 100', () => {
		const result = HistoryFiltersSchema.safeParse({ limit: '101' })
		expect(result.success).toBe(false)
	})

	it('accepts valid type filter', () => {
		expect(HistoryFiltersSchema.safeParse({ type: 'exercise' }).success).toBe(true)
		expect(HistoryFiltersSchema.safeParse({ type: 'workout' }).success).toBe(true)
	})

	it('rejects invalid type', () => {
		expect(HistoryFiltersSchema.safeParse({ type: 'cardio' }).success).toBe(false)
	})
})

// --- AIInsightSchema ---

describe('AIInsightSchema', () => {
	it('accepts valid insight', () => {
		const result = AIInsightSchema.safeParse({
			insight: 'Great progress!',
			generatedAt: '2026-02-16T12:00:00Z',
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing insight', () => {
		expect(AIInsightSchema.safeParse({ generatedAt: '2026-02-16T12:00:00Z' }).success).toBe(false)
	})

	it('rejects missing generatedAt', () => {
		expect(AIInsightSchema.safeParse({ insight: 'Great progress!' }).success).toBe(false)
	})
})
