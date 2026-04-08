import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../repository', () => ({
	findAllTemplates: vi.fn(),
	findActiveTemplates: vi.fn(),
	findTemplateById: vi.fn(),
	createTemplate: vi.fn(),
	updateTemplate: vi.fn(),
	deleteTemplate: vi.fn(),
	findTasksByUser: vi.fn(),
	findTaskByUserAndId: vi.fn(),
	createHouseholdTask: vi.fn(),
	updateHouseholdTask: vi.fn(),
	findUpcomingTasks: vi.fn(),
	findLastCompletedByTemplate: vi.fn(),
	findPendingByTemplate: vi.fn(),
	createTimeTask: vi.fn(),
	completeTimeTask: vi.fn(),
	findPropertyProfile: vi.fn(),
	upsertPropertyProfile: vi.fn(),
	findCleanerRotation: vi.fn(),
	upsertCleanerRotation: vi.fn(),
}))

import * as service from '../service'
import * as repo from '../repository'
import { AppError } from '../../../lib/errors'

function mockDoc(data: Record<string, unknown>) {
	return {
		_id: { toString: () => data.id ?? 'mock-id' },
		...data,
		createdAt: data.createdAt ?? new Date('2026-04-01T00:00:00Z'),
		updatedAt: data.updatedAt ?? new Date('2026-04-01T00:00:00Z'),
	}
}

// --- Templates ---

describe('listTemplates', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns formatted templates', async () => {
		vi.mocked(repo.findAllTemplates).mockResolvedValue([
			mockDoc({
				id: 'tpl1',
				title: 'HVAC Filter',
				description: 'Check HVAC filter',
				frequency: 'monthly',
				category: 'hvac',
				estimatedMinutes: 15,
				diyVsHire: 'diy',
				isActive: true,
			}),
		] as any)

		const result = await service.listTemplates()

		expect(result).toHaveLength(1)
		expect(result[0]).toEqual(expect.objectContaining({
			id: 'tpl1',
			title: 'HVAC Filter',
			frequency: 'monthly',
		}))
	})
})

describe('createTemplate', () => {
	beforeEach(() => vi.clearAllMocks())

	it('creates and formats template', async () => {
		const data = {
			title: 'Custom',
			description: 'Custom task',
			frequency: 'monthly',
			category: 'cleaning',
			estimatedMinutes: 20,
			diyVsHire: 'diy',
		}
		vi.mocked(repo.createTemplate).mockResolvedValue(mockDoc({ id: 'tpl-new', ...data, isActive: true }) as any)

		const result = await service.createTemplate(data)

		expect(result.id).toBe('tpl-new')
		expect(result.title).toBe('Custom')
	})
})

describe('updateTemplate', () => {
	beforeEach(() => vi.clearAllMocks())

	it('throws 404 when not found', async () => {
		vi.mocked(repo.updateTemplate).mockResolvedValue(null)

		await expect(service.updateTemplate('bad-id', { title: 'x' }))
			.rejects.toThrow(AppError)
	})

	it('returns formatted template on success', async () => {
		vi.mocked(repo.updateTemplate).mockResolvedValue(
			mockDoc({ id: 'tpl1', title: 'Updated', description: 'desc', frequency: 'monthly', category: 'hvac', estimatedMinutes: 15, diyVsHire: 'diy', isActive: true }) as any
		)

		const result = await service.updateTemplate('tpl1', { title: 'Updated' })
		expect(result.title).toBe('Updated')
	})
})

describe('deleteTemplate', () => {
	beforeEach(() => vi.clearAllMocks())

	it('throws 404 when not found', async () => {
		vi.mocked(repo.deleteTemplate).mockResolvedValue(false)

		await expect(service.deleteTemplate('bad-id')).rejects.toThrow(AppError)
	})

	it('succeeds when found', async () => {
		vi.mocked(repo.deleteTemplate).mockResolvedValue(true)

		await expect(service.deleteTemplate('tpl1')).resolves.toBeUndefined()
	})
})

// --- Tasks ---

describe('listTasks', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns formatted tasks', async () => {
		vi.mocked(repo.findTasksByUser).mockResolvedValue([
			mockDoc({
				id: 't1',
				userId: { toString: () => 'user-1' },
				title: 'HVAC Filter',
				description: 'Check filter',
				category: 'hvac',
				dueDate: '2026-05-01',
				completedAt: null,
				skippedAt: null,
				syncedToTimeTask: false,
			}),
		] as any)

		const result = await service.listTasks('user-1')

		expect(result).toHaveLength(1)
		expect(result[0]).toEqual(expect.objectContaining({
			id: 't1',
			title: 'HVAC Filter',
			completedAt: null,
		}))
	})
})

describe('completeTask', () => {
	beforeEach(() => vi.clearAllMocks())

	it('throws 404 when not found', async () => {
		vi.mocked(repo.updateHouseholdTask).mockResolvedValue(null)

		await expect(service.completeTask('user-1', 'bad-id')).rejects.toThrow(AppError)
	})

	it('completes task and syncs time task', async () => {
		const doc = mockDoc({
			id: 't1',
			userId: { toString: () => 'user-1' },
			title: 'HVAC Filter',
			description: 'Check filter',
			category: 'hvac',
			dueDate: '2026-05-01',
			completedAt: new Date(),
			skippedAt: null,
			syncedToTimeTask: true,
			timeTaskId: { toString: () => 'time-1' },
		})
		vi.mocked(repo.updateHouseholdTask).mockResolvedValue(doc as any)
		vi.mocked(repo.completeTimeTask).mockResolvedValue({} as any)

		const result = await service.completeTask('user-1', 't1')

		expect(result.completedAt).toBeTruthy()
		expect(repo.completeTimeTask).toHaveBeenCalledWith('user-1', 'time-1')
	})
})

describe('skipTask', () => {
	beforeEach(() => vi.clearAllMocks())

	it('throws 404 when not found', async () => {
		vi.mocked(repo.updateHouseholdTask).mockResolvedValue(null)

		await expect(service.skipTask('user-1', 'bad-id')).rejects.toThrow(AppError)
	})

	it('skips task with reason', async () => {
		const doc = mockDoc({
			id: 't1',
			userId: { toString: () => 'user-1' },
			title: 'HVAC Filter',
			description: 'Check filter',
			category: 'hvac',
			dueDate: '2026-05-01',
			completedAt: null,
			skippedAt: new Date(),
			skippedReason: 'Not applicable',
			syncedToTimeTask: false,
		})
		vi.mocked(repo.updateHouseholdTask).mockResolvedValue(doc as any)

		const result = await service.skipTask('user-1', 't1', 'Not applicable')

		expect(result.skippedAt).toBeTruthy()
		expect(result.skippedReason).toBe('Not applicable')
	})
})

// --- Generate Tasks ---

describe('generateUpcomingTasks', () => {
	beforeEach(() => vi.clearAllMocks())

	it('skips templates with pending tasks', async () => {
		vi.mocked(repo.findActiveTemplates).mockResolvedValue([
			mockDoc({ id: 'tpl1', title: 'HVAC', description: 'desc', frequency: 'monthly', category: 'hvac', estimatedMinutes: 15, diyVsHire: 'diy', isActive: true }),
		] as any)
		vi.mocked(repo.findPendingByTemplate).mockResolvedValue({} as any)

		const result = await service.generateUpcomingTasks('user-1')

		expect(result.generated).toBe(0)
		expect(result.tasks).toHaveLength(0)
	})

	it('generates tasks for templates without pending tasks', async () => {
		const template = mockDoc({
			id: 'tpl1',
			title: 'HVAC Filter',
			description: 'Check filter',
			frequency: 'monthly',
			category: 'hvac',
			estimatedMinutes: 15,
			diyVsHire: 'diy',
			isActive: true,
		})
		vi.mocked(repo.findActiveTemplates).mockResolvedValue([template] as any)
		vi.mocked(repo.findPendingByTemplate).mockResolvedValue(null)
		vi.mocked(repo.findLastCompletedByTemplate).mockResolvedValue(null)

		const createdDoc = mockDoc({
			id: 't-new',
			userId: { toString: () => 'user-1' },
			title: 'HVAC Filter',
			description: 'Check filter',
			category: 'hvac',
			dueDate: '2026-04-15',
			completedAt: null,
			skippedAt: null,
			syncedToTimeTask: false,
		})
		vi.mocked(repo.createHouseholdTask).mockResolvedValue(createdDoc as any)

		const result = await service.generateUpcomingTasks('user-1')

		expect(result.generated).toBe(1)
		expect(result.tasks[0].title).toBe('HVAC Filter')
	})
})

// --- Property Profile ---

describe('getPropertyProfile', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns null when no profile', async () => {
		vi.mocked(repo.findPropertyProfile).mockResolvedValue(null)

		const result = await service.getPropertyProfile('user-1')
		expect(result).toBeNull()
	})

	it('returns formatted profile', async () => {
		vi.mocked(repo.findPropertyProfile).mockResolvedValue(
			mockDoc({
				id: 'p1',
				userId: { toString: () => 'user-1' },
				name: 'Home',
				type: 'condo',
				hasHOA: true,
				hoaCoversExterior: true,
				appliances: ['dishwasher'],
				systems: ['central air'],
			}) as any
		)

		const result = await service.getPropertyProfile('user-1')
		expect(result).toEqual(expect.objectContaining({
			id: 'p1',
			type: 'condo',
			hasHOA: true,
		}))
	})
})

// --- Cleaner Rotation ---

describe('getCleanerRotation', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns null when no rotation', async () => {
		vi.mocked(repo.findCleanerRotation).mockResolvedValue(null)

		const result = await service.getCleanerRotation('user-1')
		expect(result).toBeNull()
	})

	it('returns formatted rotation', async () => {
		vi.mocked(repo.findCleanerRotation).mockResolvedValue(
			mockDoc({
				nextRotationIndex: 3,
				nextRunDate: '2026-04-11',
				rotation: [{ index: 1, area: 'Oven', details: 'Deep clean' }],
			}) as any
		)

		const result = await service.getCleanerRotation('user-1')
		expect(result).toEqual(expect.objectContaining({
			nextRotationIndex: 3,
			nextRunDate: '2026-04-11',
		}))
		expect(result!.rotation).toHaveLength(1)
	})
})
