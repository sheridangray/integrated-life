import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../integrations/together', () => ({
	chatCompletion: vi.fn(),
}))

vi.mock('../repository', () => ({
	findExerciseLogsByExercise: vi.fn(),
	findExerciseById: vi.fn(),
	findRecentExerciseLogs: vi.fn(),
}))

import { getExerciseInsight, getHistorySummary, getMonitorInsight } from '../ai'
import { chatCompletion } from '../../../integrations/together'
import * as repo from '../repository'

// --- getExerciseInsight ---

describe('getExerciseInsight', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns null when no logs exist', async () => {
		vi.mocked(repo.findExerciseLogsByExercise).mockResolvedValue([])

		const result = await getExerciseInsight('user-1', 'ex-1')

		expect(result).toBeNull()
		expect(chatCompletion).not.toHaveBeenCalled()
	})

	it('returns null when exercise not found', async () => {
		vi.mocked(repo.findExerciseLogsByExercise).mockResolvedValue([
			{ sets: [{ weight: 100, reps: 10 }], date: '2026-02-16', notes: null },
		] as any)
		vi.mocked(repo.findExerciseById).mockResolvedValue(null)

		const result = await getExerciseInsight('user-1', 'ex-1')

		expect(result).toBeNull()
		expect(chatCompletion).not.toHaveBeenCalled()
	})

	it('returns insight on success', async () => {
		vi.mocked(repo.findExerciseLogsByExercise).mockResolvedValue([
			{
				date: '2026-02-16',
				sets: [{ weight: 135, reps: 10 }],
				notes: 'Felt strong',
			},
		] as any)
		vi.mocked(repo.findExerciseById).mockResolvedValue({
			name: 'Bench Press',
			measurementType: 'Strength',
		} as any)
		vi.mocked(chatCompletion).mockResolvedValue('You are progressing well!')

		const result = await getExerciseInsight('user-1', 'ex-1')

		expect(result).not.toBeNull()
		expect(result!.insight).toBe('You are progressing well!')
		expect(result!.generatedAt).toBeDefined()
		expect(chatCompletion).toHaveBeenCalledWith(
			expect.stringContaining('AI Health Coach'),
			expect.stringContaining('Bench Press')
		)
	})

	it('returns null when chatCompletion returns null', async () => {
		vi.mocked(repo.findExerciseLogsByExercise).mockResolvedValue([
			{ date: '2026-02-16', sets: [{ weight: 100, reps: 8 }], notes: null },
		] as any)
		vi.mocked(repo.findExerciseById).mockResolvedValue({
			name: 'Squat',
			measurementType: 'Strength',
		} as any)
		vi.mocked(chatCompletion).mockResolvedValue(null)

		const result = await getExerciseInsight('user-1', 'ex-1')

		expect(result).toBeNull()
	})

	it('includes notes in the prompt when present', async () => {
		vi.mocked(repo.findExerciseLogsByExercise).mockResolvedValue([
			{
				date: '2026-02-16',
				sets: [{ weight: 200, reps: 5 }],
				notes: 'Left shoulder tight',
			},
		] as any)
		vi.mocked(repo.findExerciseById).mockResolvedValue({
			name: 'Overhead Press',
			measurementType: 'Strength',
		} as any)
		vi.mocked(chatCompletion).mockResolvedValue('Watch your shoulder.')

		await getExerciseInsight('user-1', 'ex-1')

		expect(chatCompletion).toHaveBeenCalledWith(
			expect.any(String),
			expect.stringContaining('Left shoulder tight')
		)
	})
})

// --- getHistorySummary ---

describe('getHistorySummary', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns null when no recent logs', async () => {
		vi.mocked(repo.findRecentExerciseLogs).mockResolvedValue([])

		const result = await getHistorySummary('user-1')

		expect(result).toBeNull()
		expect(chatCompletion).not.toHaveBeenCalled()
	})

	it('returns insight with aggregated data', async () => {
		vi.mocked(repo.findRecentExerciseLogs).mockResolvedValue([
			{ exerciseId: { name: 'Bench Press', bodyParts: ['Chest'] } },
			{ exerciseId: { name: 'Bench Press', bodyParts: ['Chest'] } },
			{ exerciseId: { name: 'Squat', bodyParts: ['Lower Body'] } },
		] as any)
		vi.mocked(chatCompletion).mockResolvedValue('Good balance!')

		const result = await getHistorySummary('user-1')

		expect(result).not.toBeNull()
		expect(result!.insight).toBe('Good balance!')
		expect(chatCompletion).toHaveBeenCalledWith(
			expect.any(String),
			expect.stringContaining('Total sessions: 3')
		)
		expect(chatCompletion).toHaveBeenCalledWith(
			expect.any(String),
			expect.stringContaining('Bench Press (2x)')
		)
	})

	it('returns null when chatCompletion returns null', async () => {
		vi.mocked(repo.findRecentExerciseLogs).mockResolvedValue([
			{ exerciseId: { name: 'Squat', bodyParts: ['Lower Body'] } },
		] as any)
		vi.mocked(chatCompletion).mockResolvedValue(null)

		const result = await getHistorySummary('user-1')

		expect(result).toBeNull()
	})
})

// --- getMonitorInsight ---

describe('getMonitorInsight', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns null when data array is empty', async () => {
		const result = await getMonitorInsight('steps', [])

		expect(result).toBeNull()
		expect(chatCompletion).not.toHaveBeenCalled()
	})

	it('returns insight with sample type and data', async () => {
		vi.mocked(chatCompletion).mockResolvedValue('Steps are trending up!')

		const data = [
			{ date: '2026-02-16', value: 8000 },
			{ date: '2026-02-15', value: 7500 },
		]
		const result = await getMonitorInsight('steps', data)

		expect(result).not.toBeNull()
		expect(result!.insight).toBe('Steps are trending up!')
		expect(chatCompletion).toHaveBeenCalledWith(
			expect.any(String),
			expect.stringContaining('steps')
		)
		expect(chatCompletion).toHaveBeenCalledWith(
			expect.any(String),
			expect.stringContaining('8000')
		)
	})

	it('returns null when chatCompletion returns null', async () => {
		vi.mocked(chatCompletion).mockResolvedValue(null)

		const result = await getMonitorInsight('heartRate', [{ date: '2026-02-16', value: 72 }])

		expect(result).toBeNull()
	})
})
