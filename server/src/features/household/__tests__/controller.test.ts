import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../../middleware/auth'

vi.mock('../service', () => ({
	listTasks: vi.fn(),
	createTask: vi.fn(),
	getUpcomingTasks: vi.fn(),
	completeTask: vi.fn(),
	skipTask: vi.fn(),
	generateUpcomingTasks: vi.fn(),
	listTemplates: vi.fn(),
	createTemplate: vi.fn(),
	updateTemplate: vi.fn(),
	deleteTemplate: vi.fn(),
	getCleanerRotation: vi.fn(),
	updateCleanerRotation: vi.fn(),
	getPropertyProfile: vi.fn(),
	updatePropertyProfile: vi.fn(),
}))

import * as controller from '../controller'
import * as householdService from '../service'

// --- Helpers ---

function createMockReq(
	overrides: {
		body?: unknown
		params?: Record<string, string>
		query?: Record<string, string>
		user?: { userId: string; email: string }
	} = {}
): AuthenticatedRequest {
	return {
		body: overrides.body ?? {},
		params: overrides.params ?? {},
		query: overrides.query ?? {},
		headers: {},
		id: 'req-test-123',
		user: overrides.user,
	} as unknown as AuthenticatedRequest
}

function createMockRes() {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		send: vi.fn().mockReturnThis(),
	}
	return res as unknown as Response
}

const testUser = { userId: 'user-1', email: 'test@example.com' }

// --- Tasks ---

describe('listTasks', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.listTasks(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: expect.objectContaining({ code: 'UNAUTHORIZED' }) })
		)
	})

	it('returns tasks from service', async () => {
		const tasks = [{ id: 't1', title: 'HVAC Filter' }]
		vi.mocked(householdService.listTasks).mockResolvedValue(tasks as any)

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.listTasks(req, res)

		expect(householdService.listTasks).toHaveBeenCalledWith('user-1', {})
		expect(res.json).toHaveBeenCalledWith(tasks)
	})

	it('passes filter params to service', async () => {
		vi.mocked(householdService.listTasks).mockResolvedValue([])

		const req = createMockReq({
			user: testUser,
			query: { category: 'hvac', status: 'pending' },
		})
		const res = createMockRes()

		await controller.listTasks(req, res)

		expect(householdService.listTasks).toHaveBeenCalledWith(
			'user-1',
			expect.objectContaining({ category: 'hvac', status: 'pending' })
		)
	})
})

describe('createTask', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.createTask(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns 400 on invalid body', async () => {
		const req = createMockReq({ user: testUser, body: {} })
		const res = createMockRes()

		await controller.createTask(req, res)

		expect(res.status).toHaveBeenCalledWith(400)
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: expect.objectContaining({ code: 'VALIDATION_ERROR' }) })
		)
	})

	it('returns 201 on success', async () => {
		const taskData = {
			title: 'Clean filter',
			description: 'Check and clean HVAC filter',
			category: 'hvac',
			dueDate: '2026-05-01',
		}
		vi.mocked(householdService.createTask).mockResolvedValue({ id: 't-new', ...taskData } as any)

		const req = createMockReq({ user: testUser, body: taskData })
		const res = createMockRes()

		await controller.createTask(req, res)

		expect(res.status).toHaveBeenCalledWith(201)
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 't-new' }))
	})
})

describe('getUpcomingTasks', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.getUpcomingTasks(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns upcoming tasks', async () => {
		vi.mocked(householdService.getUpcomingTasks).mockResolvedValue([])

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.getUpcomingTasks(req, res)

		expect(householdService.getUpcomingTasks).toHaveBeenCalledWith('user-1')
		expect(res.json).toHaveBeenCalledWith([])
	})
})

describe('completeTask', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { id: 't1' } })
		const res = createMockRes()

		await controller.completeTask(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns completed task', async () => {
		const task = { id: 't1', completedAt: '2026-04-08T12:00:00Z' }
		vi.mocked(householdService.completeTask).mockResolvedValue(task as any)

		const req = createMockReq({ params: { id: 't1' }, user: testUser })
		const res = createMockRes()

		await controller.completeTask(req, res)

		expect(householdService.completeTask).toHaveBeenCalledWith('user-1', 't1')
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ completedAt: expect.any(String) }))
	})
})

describe('skipTask', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { id: 't1' } })
		const res = createMockRes()

		await controller.skipTask(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('passes reason to service', async () => {
		const task = { id: 't1', skippedAt: '2026-04-08T12:00:00Z', skippedReason: 'Not needed' }
		vi.mocked(householdService.skipTask).mockResolvedValue(task as any)

		const req = createMockReq({
			params: { id: 't1' },
			user: testUser,
			body: { reason: 'Not needed' },
		})
		const res = createMockRes()

		await controller.skipTask(req, res)

		expect(householdService.skipTask).toHaveBeenCalledWith('user-1', 't1', 'Not needed')
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ skippedReason: 'Not needed' }))
	})
})

describe('generateTasks', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.generateTasks(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns 201 with generated tasks', async () => {
		const result = { generated: 3, tasks: [] }
		vi.mocked(householdService.generateUpcomingTasks).mockResolvedValue(result as any)

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.generateTasks(req, res)

		expect(res.status).toHaveBeenCalledWith(201)
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ generated: 3 }))
	})
})

// --- Templates ---

describe('listTemplates', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns templates from service', async () => {
		const templates = [{ id: 'tpl1', title: 'HVAC Filter' }]
		vi.mocked(householdService.listTemplates).mockResolvedValue(templates as any)

		const req = createMockReq()
		const res = createMockRes()

		await controller.listTemplates(req, res)

		expect(res.json).toHaveBeenCalledWith(templates)
	})
})

describe('createTemplate', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.createTemplate(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns 400 on invalid body', async () => {
		const req = createMockReq({ user: testUser, body: {} })
		const res = createMockRes()

		await controller.createTemplate(req, res)

		expect(res.status).toHaveBeenCalledWith(400)
	})

	it('returns 201 on success', async () => {
		const templateData = {
			title: 'Custom Task',
			description: 'A custom maintenance task',
			frequency: 'monthly',
			category: 'cleaning',
			estimatedMinutes: 30,
			diyVsHire: 'diy',
		}
		vi.mocked(householdService.createTemplate).mockResolvedValue({ id: 'tpl-new', ...templateData } as any)

		const req = createMockReq({ user: testUser, body: templateData })
		const res = createMockRes()

		await controller.createTemplate(req, res)

		expect(res.status).toHaveBeenCalledWith(201)
	})
})

describe('updateTemplate', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { id: 'tpl1' } })
		const res = createMockRes()

		await controller.updateTemplate(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns updated template', async () => {
		vi.mocked(householdService.updateTemplate).mockResolvedValue({ id: 'tpl1', title: 'Updated' } as any)

		const req = createMockReq({
			params: { id: 'tpl1' },
			user: testUser,
			body: { title: 'Updated' },
		})
		const res = createMockRes()

		await controller.updateTemplate(req, res)

		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated' }))
	})
})

describe('deleteTemplate', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq({ params: { id: 'tpl1' } })
		const res = createMockRes()

		await controller.deleteTemplate(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns 204 on success', async () => {
		vi.mocked(householdService.deleteTemplate).mockResolvedValue(undefined)

		const req = createMockReq({ params: { id: 'tpl1' }, user: testUser })
		const res = createMockRes()

		await controller.deleteTemplate(req, res)

		expect(res.status).toHaveBeenCalledWith(204)
		expect(res.send).toHaveBeenCalled()
	})
})

// --- Cleaner Rotation ---

describe('getCleanerRotation', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.getCleanerRotation(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns null when no rotation exists', async () => {
		vi.mocked(householdService.getCleanerRotation).mockResolvedValue(null)

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.getCleanerRotation(req, res)

		expect(res.json).toHaveBeenCalledWith(null)
	})

	it('returns rotation when found', async () => {
		const rotation = { nextRotationIndex: 3, nextRunDate: '2026-04-11', rotation: [] }
		vi.mocked(householdService.getCleanerRotation).mockResolvedValue(rotation as any)

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.getCleanerRotation(req, res)

		expect(res.json).toHaveBeenCalledWith(rotation)
	})
})

describe('updateCleanerRotation', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.updateCleanerRotation(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns updated rotation', async () => {
		const rotation = { nextRotationIndex: 4, nextRunDate: '2026-04-25', rotation: [] }
		vi.mocked(householdService.updateCleanerRotation).mockResolvedValue(rotation as any)

		const req = createMockReq({
			user: testUser,
			body: { nextRotationIndex: 4, nextRunDate: '2026-04-25' },
		})
		const res = createMockRes()

		await controller.updateCleanerRotation(req, res)

		expect(res.json).toHaveBeenCalledWith(rotation)
	})
})

// --- Property Profile ---

describe('getPropertyProfile', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.getPropertyProfile(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns null when no profile exists', async () => {
		vi.mocked(householdService.getPropertyProfile).mockResolvedValue(null)

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.getPropertyProfile(req, res)

		expect(res.json).toHaveBeenCalledWith(null)
	})

	it('returns profile when found', async () => {
		const profile = { id: 'p1', type: 'condo', name: 'Home' }
		vi.mocked(householdService.getPropertyProfile).mockResolvedValue(profile as any)

		const req = createMockReq({ user: testUser })
		const res = createMockRes()

		await controller.getPropertyProfile(req, res)

		expect(res.json).toHaveBeenCalledWith(profile)
	})
})

describe('updatePropertyProfile', () => {
	beforeEach(() => vi.clearAllMocks())

	it('returns 401 when not authenticated', async () => {
		const req = createMockReq()
		const res = createMockRes()

		await controller.updatePropertyProfile(req, res)

		expect(res.status).toHaveBeenCalledWith(401)
	})

	it('returns updated profile', async () => {
		const profile = { id: 'p1', type: 'condo', name: 'My Condo' }
		vi.mocked(householdService.updatePropertyProfile).mockResolvedValue(profile as any)

		const req = createMockReq({
			user: testUser,
			body: { type: 'condo', name: 'My Condo' },
		})
		const res = createMockRes()

		await controller.updatePropertyProfile(req, res)

		expect(res.json).toHaveBeenCalledWith(profile)
	})
})
