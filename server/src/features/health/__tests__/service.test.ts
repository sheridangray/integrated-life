import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '../../../lib/errors'

vi.mock('../repository', () => ({
	findExercises: vi.fn(),
	findExerciseById: vi.fn(),
	findFavoriteExerciseIds: vi.fn(),
	toggleFavorite: vi.fn(),
	createExerciseLog: vi.fn(),
	findLastExerciseLog: vi.fn(),
	findExerciseLogsByExercise: vi.fn(),
	findExerciseLogById: vi.fn(),
	findWorkouts: vi.fn(),
	findWorkoutById: vi.fn(),
	createWorkout: vi.fn(),
	updateWorkout: vi.fn(),
	deleteWorkout: vi.fn(),
	createWorkoutLog: vi.fn(),
	findWorkoutLogById: vi.fn(),
	findHistory: vi.fn(),
	findRecentExerciseLogs: vi.fn(),
}))

import * as service from '../service'
import * as repo from '../repository'

// --- Helpers ---

function mockExerciseDoc(overrides: Record<string, unknown> = {}) {
	return {
		_id: { toString: () => 'ex-id-1' },
		name: 'Bench Press',
		slug: 'bench-press',
		muscles: ['Pectoralis'],
		bodyParts: ['Chest'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: ['Lie down', 'Press up'],
		videoUrl: 'https://youtube.com/watch?v=abc',
		category: null,
		isGlobal: true,
		...overrides,
	}
}

function mockExerciseLogDoc(overrides: Record<string, unknown> = {}) {
	return {
		_id: { toString: () => 'log-id-1' },
		userId: { toString: () => 'user-1' },
		exerciseId: { toString: () => 'ex-id-1' },
		date: '2026-02-16',
		startTime: '09:00',
		endTime: '09:30',
		resistanceType: 'Weights (Free)',
		sets: [{ setNumber: 1, weight: 135, reps: 10 }],
		notes: 'Good session',
		writtenToHealthKit: false,
		...overrides,
	}
}

function mockWorkoutDoc(overrides: Record<string, unknown> = {}) {
	return {
		_id: { toString: () => 'w-id-1' },
		name: 'Push Day',
		isGlobal: true,
		userId: null,
		exercises: [
			{
				exerciseId: {
					_id: { toString: () => 'ex-id-1' },
					name: 'Bench Press',
				},
				order: 0,
				defaultSets: 3,
				defaultReps: 10,
				defaultWeight: null,
			},
		],
		schedule: null,
		...overrides,
	}
}

function mockWorkoutLogDoc(overrides: Record<string, unknown> = {}) {
	return {
		_id: { toString: () => 'wlog-id-1' },
		userId: { toString: () => 'user-1' },
		workoutId: { toString: () => 'w-id-1', name: 'Push Day' },
		date: '2026-02-16',
		startTime: '09:00',
		endTime: '10:00',
		exerciseLogIds: [{
			_id: { toString: () => 'log-id-1' },
			exerciseId: { _id: { toString: () => 'ex-1' }, name: 'Bench Press' },
			date: '2026-02-16',
			resistanceType: 'Weights (Free)',
			sets: [{ setNumber: 1, weight: 135, reps: 10 }],
			notes: null,
			toString: () => 'log-id-1',
		}],
		completedAll: true,
		workoutInsight: null,
		...overrides,
	}
}

// --- Tests ---

describe('listExercises', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns mapped exercises without favorites when no userId', async () => {
		vi.mocked(repo.findExercises).mockResolvedValue([mockExerciseDoc()] as any)

		const result = await service.listExercises({})

		expect(repo.findExercises).toHaveBeenCalledWith({ bodyPart: undefined, muscle: undefined, search: undefined })
		expect(result).toHaveLength(1)
		expect(result[0]).toEqual(
			expect.objectContaining({
				id: 'ex-id-1',
				name: 'Bench Press',
				isFavorite: false,
			})
		)
	})

	it('attaches isFavorite when userId is provided', async () => {
		vi.mocked(repo.findExercises).mockResolvedValue([mockExerciseDoc()] as any)
		vi.mocked(repo.findFavoriteExerciseIds).mockResolvedValue(['ex-id-1'])

		const result = await service.listExercises({ userId: 'user-1' })

		expect(repo.findFavoriteExerciseIds).toHaveBeenCalledWith('user-1')
		expect(result[0].isFavorite).toBe(true)
	})

	it('filters to favorites only when favoritesOnly and userId are set', async () => {
		const ex1 = mockExerciseDoc()
		const ex2 = mockExerciseDoc({ _id: { toString: () => 'ex-id-2' }, name: 'Squat' })
		vi.mocked(repo.findExercises).mockResolvedValue([ex1, ex2] as any)
		vi.mocked(repo.findFavoriteExerciseIds).mockResolvedValue(['ex-id-1'])

		const result = await service.listExercises({ favoritesOnly: true, userId: 'user-1' })

		expect(result).toHaveLength(1)
		expect(result[0].name).toBe('Bench Press')
	})
})

describe('getExercise', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns mapped exercise', async () => {
		vi.mocked(repo.findExerciseById).mockResolvedValue(mockExerciseDoc() as any)

		const result = await service.getExercise('ex-id-1')

		expect(result).toEqual(
			expect.objectContaining({ id: 'ex-id-1', name: 'Bench Press' })
		)
	})

	it('throws 404 when exercise not found', async () => {
		vi.mocked(repo.findExerciseById).mockResolvedValue(null)

		await expect(service.getExercise('nonexistent')).rejects.toThrow(AppError)
		await expect(service.getExercise('nonexistent')).rejects.toThrow('Exercise not found')
	})

	it('sets isFavorite when userId is provided', async () => {
		vi.mocked(repo.findExerciseById).mockResolvedValue(mockExerciseDoc() as any)
		vi.mocked(repo.findFavoriteExerciseIds).mockResolvedValue(['ex-id-1'])

		const result = await service.getExercise('ex-id-1', 'user-1')
		expect(result.isFavorite).toBe(true)
	})
})

describe('toggleFavorite', () => {
	beforeEach(() => vi.clearAllMocks())

	it('delegates to repo and returns result', async () => {
		vi.mocked(repo.findExerciseById).mockResolvedValue(mockExerciseDoc() as any)
		vi.mocked(repo.toggleFavorite).mockResolvedValue(true)

		const result = await service.toggleFavorite('user-1', 'ex-id-1')

		expect(result).toEqual({ isFavorite: true })
		expect(repo.toggleFavorite).toHaveBeenCalledWith('user-1', 'ex-id-1')
	})

	it('throws 404 when exercise not found', async () => {
		vi.mocked(repo.findExerciseById).mockResolvedValue(null)

		await expect(service.toggleFavorite('user-1', 'nonexistent')).rejects.toThrow(AppError)
	})
})

describe('logExercise', () => {
	beforeEach(() => vi.clearAllMocks())

	it('creates and returns mapped log', async () => {
		vi.mocked(repo.findExerciseById).mockResolvedValue(mockExerciseDoc() as any)
		vi.mocked(repo.createExerciseLog).mockResolvedValue(mockExerciseLogDoc() as any)

		const result = await service.logExercise('user-1', 'ex-id-1', {
			date: '2026-02-16',
			startTime: '09:00',
			endTime: '09:30',
			resistanceType: 'Weights (Free)',
			sets: [{ setNumber: 1, weight: 135, reps: 10 }],
		})

		expect(result).toEqual(
			expect.objectContaining({ id: 'log-id-1', exerciseId: 'ex-id-1' })
		)
	})

	it('throws 404 when exercise not found', async () => {
		vi.mocked(repo.findExerciseById).mockResolvedValue(null)

		await expect(
			service.logExercise('user-1', 'nonexistent', {
				date: '2026-02-16',
				startTime: '09:00',
				endTime: '09:30',
				resistanceType: 'Weights (Free)',
				sets: [],
			})
		).rejects.toThrow(AppError)
	})
})

describe('getLastExerciseLog', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns mapped log when found', async () => {
		vi.mocked(repo.findLastExerciseLog).mockResolvedValue(mockExerciseLogDoc() as any)

		const result = await service.getLastExerciseLog('user-1', 'ex-id-1')

		expect(result).toEqual(expect.objectContaining({ id: 'log-id-1' }))
	})

	it('returns null when no log exists', async () => {
		vi.mocked(repo.findLastExerciseLog).mockResolvedValue(null)

		const result = await service.getLastExerciseLog('user-1', 'ex-id-1')
		expect(result).toBeNull()
	})
})

describe('getExerciseHistory', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns mapped array of logs', async () => {
		vi.mocked(repo.findExerciseLogsByExercise).mockResolvedValue([mockExerciseLogDoc()] as any)

		const result = await service.getExerciseHistory('user-1', 'ex-id-1')

		expect(result).toHaveLength(1)
		expect(result[0]).toEqual(
			expect.objectContaining({ id: 'log-id-1', date: '2026-02-16' })
		)
	})
})

describe('listWorkouts', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns mapped workouts with exercise count', async () => {
		const doc = {
			_id: { toString: () => 'w-id-1' },
			name: 'Push Day',
			isGlobal: true,
			userId: null,
			exercises: [{ exerciseId: 'ex1' }, { exerciseId: 'ex2' }],
			schedule: null,
		}
		vi.mocked(repo.findWorkouts).mockResolvedValue([doc] as any)

		const result = await service.listWorkouts({})

		expect(result).toHaveLength(1)
		expect(result[0].exerciseCount).toBe(2)
	})
})

describe('getWorkout', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns populated workout', async () => {
		vi.mocked(repo.findWorkoutById).mockResolvedValue(mockWorkoutDoc() as any)

		const result = await service.getWorkout('w-id-1')

		expect(result.exercises[0]).toEqual(
			expect.objectContaining({ exerciseId: 'ex-id-1', name: 'Bench Press' })
		)
	})

	it('throws 404 when not found', async () => {
		vi.mocked(repo.findWorkoutById).mockResolvedValue(null)

		await expect(service.getWorkout('nonexistent')).rejects.toThrow(AppError)
	})
})

describe('createWorkout', () => {
	beforeEach(() => vi.clearAllMocks())

	it('creates and returns workout', async () => {
		const created = {
			_id: { toString: () => 'w-new' },
			name: 'Leg Day',
			isGlobal: false,
			userId: { toString: () => 'user-1' },
			exercises: [],
			schedule: null,
		}
		vi.mocked(repo.createWorkout).mockResolvedValue(created as any)

		const result = await service.createWorkout('user-1', {
			name: 'Leg Day',
			exercises: [],
		})

		expect(result.id).toBe('w-new')
		expect(repo.createWorkout).toHaveBeenCalledWith(
			expect.objectContaining({ userId: 'user-1', name: 'Leg Day' })
		)
	})

	it('normalizes null schedule to undefined', async () => {
		vi.mocked(repo.createWorkout).mockResolvedValue({
			_id: { toString: () => 'w-new' },
			name: 'Test',
			isGlobal: false,
			userId: null,
			exercises: [],
			schedule: null,
		} as any)

		await service.createWorkout('user-1', {
			name: 'Test',
			exercises: [],
			schedule: null,
		})

		expect(repo.createWorkout).toHaveBeenCalledWith(
			expect.objectContaining({ schedule: undefined })
		)
	})
})

describe('updateWorkout', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns updated workout', async () => {
		const updated = {
			_id: { toString: () => 'w-id-1' },
			name: 'Updated Push Day',
			isGlobal: false,
			exercises: [],
			schedule: null,
		}
		vi.mocked(repo.updateWorkout).mockResolvedValue(updated as any)

		const result = await service.updateWorkout('w-id-1', 'user-1', { name: 'Updated Push Day' })

		expect(result.name).toBe('Updated Push Day')
	})

	it('throws 404 when not found or not owned', async () => {
		vi.mocked(repo.updateWorkout).mockResolvedValue(null)

		await expect(service.updateWorkout('w-id-1', 'user-1', {})).rejects.toThrow(AppError)
	})
})

describe('deleteWorkout', () => {
	beforeEach(() => vi.clearAllMocks())

	it('succeeds silently when workout is deleted', async () => {
		vi.mocked(repo.deleteWorkout).mockResolvedValue(true)

		await expect(service.deleteWorkout('w-id-1', 'user-1')).resolves.toBeUndefined()
	})

	it('throws 404 when not found or not owned', async () => {
		vi.mocked(repo.deleteWorkout).mockResolvedValue(false)

		await expect(service.deleteWorkout('w-id-1', 'user-1')).rejects.toThrow(AppError)
	})
})

describe('logWorkout', () => {
	beforeEach(() => vi.clearAllMocks())

	it('creates and returns mapped log', async () => {
		vi.mocked(repo.createWorkoutLog).mockResolvedValue(mockWorkoutLogDoc() as any)

		const result = await service.logWorkout('user-1', {
			workoutId: 'w-id-1',
			date: '2026-02-16',
			startTime: '09:00',
			endTime: '10:00',
			exerciseLogIds: ['log-id-1'],
			completedAll: true,
		})

		expect(result).toEqual(
			expect.objectContaining({ id: 'wlog-id-1', completedAll: true })
		)
	})
})

describe('getHistory', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns paginated result with correct totalPages', async () => {
		const exerciseLogDoc = {
			_id: { toString: () => 'log-id-1' },
			date: '2026-02-16',
			startTime: '09:00',
			endTime: '09:30',
			exerciseId: { name: 'Bench Press' },
		}
		vi.mocked(repo.findHistory).mockResolvedValue({
			items: [{ type: 'exercise', doc: exerciseLogDoc }],
			total: 25,
		} as any)

		const result = await service.getHistory('user-1', { page: 1, limit: 10 })

		expect(result.totalPages).toBe(3)
		expect(result.items).toHaveLength(1)
		expect(result.items[0].name).toBe('Bench Press')
	})
})

describe('getHistoryDetail', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns exercise log detail', async () => {
		vi.mocked(repo.findExerciseLogById).mockResolvedValue(mockExerciseLogDoc() as any)

		const result = await service.getHistoryDetail('user-1', 'exercise', 'log-id-1')

		expect(result).toEqual(expect.objectContaining({ type: 'exercise', id: 'log-id-1' }))
	})

	it('returns workout log detail', async () => {
		vi.mocked(repo.findWorkoutLogById).mockResolvedValue(mockWorkoutLogDoc() as any)

		const result = await service.getHistoryDetail('user-1', 'workout', 'wlog-id-1')

		expect(result).toEqual(expect.objectContaining({
			type: 'workout',
			id: 'wlog-id-1',
			workoutName: 'Push Day',
			completedAll: true,
			exercises: expect.arrayContaining([
				expect.objectContaining({ id: 'log-id-1', exerciseName: 'Bench Press' })
			]),
		}))
	})

	it('throws 404 when exercise log not found', async () => {
		vi.mocked(repo.findExerciseLogById).mockResolvedValue(null)

		await expect(service.getHistoryDetail('user-1', 'exercise', 'bad')).rejects.toThrow(AppError)
	})

	it('throws 404 when workout log not found', async () => {
		vi.mocked(repo.findWorkoutLogById).mockResolvedValue(null)

		await expect(service.getHistoryDetail('user-1', 'workout', 'bad')).rejects.toThrow(AppError)
	})

	it('throws 400 on invalid type', async () => {
		await expect(service.getHistoryDetail('user-1', 'cardio', 'id')).rejects.toThrow(AppError)
		await expect(service.getHistoryDetail('user-1', 'cardio', 'id')).rejects.toThrow(
			'Invalid history type'
		)
	})
})

describe('exportHistoryCsv', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns CSV with header and data rows', async () => {
		const logDoc = {
			...mockExerciseLogDoc(),
			exerciseId: { name: 'Bench Press' },
		}
		vi.mocked(repo.findRecentExerciseLogs).mockResolvedValue([logDoc] as any)

		const csv = await service.exportHistoryCsv('user-1')

		const lines = csv.split('\n')
		expect(lines[0]).toBe(
			'Date,Exercise,Resistance Type,Set,Weight,Reps,Minutes,Seconds,Notes'
		)
		expect(lines).toHaveLength(2) // header + 1 set row
		expect(lines[1]).toContain('Bench Press')
		expect(lines[1]).toContain('135')
	})

	it('escapes quotes in notes', async () => {
		const logDoc = {
			...mockExerciseLogDoc({ notes: 'He said "heavy"' }),
			exerciseId: { name: 'Bench Press' },
		}
		vi.mocked(repo.findRecentExerciseLogs).mockResolvedValue([logDoc] as any)

		const csv = await service.exportHistoryCsv('user-1')

		expect(csv).toContain('""heavy""')
	})

	it('returns header only when no logs', async () => {
		vi.mocked(repo.findRecentExerciseLogs).mockResolvedValue([])

		const csv = await service.exportHistoryCsv('user-1')

		expect(csv.split('\n')).toHaveLength(1)
	})
})
