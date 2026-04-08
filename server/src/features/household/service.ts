import { AppError } from '../../lib/errors'
import * as repo from './repository'
import type { HouseholdTaskDocument } from '../../models/HouseholdTask'
import type { MaintenanceTemplateDocument } from '../../models/MaintenanceTemplate'
import type { PropertyProfileDocument } from '../../models/PropertyProfile'
import type { CleanerRotationDocument } from '../../models/CleanerRotation'
import type {
	HouseholdTaskResponse,
	MaintenanceTemplateResponse,
	PropertyProfileResponse,
	CleanerRotationResponse,
	GenerateTasksResult
} from './types'

// --- Formatters ---

function formatTask(doc: HouseholdTaskDocument): HouseholdTaskResponse {
	return {
		id: doc._id.toString(),
		userId: doc.userId.toString(),
		templateId: doc.templateId?.toString() ?? null,
		title: doc.title,
		description: doc.description,
		category: doc.category,
		dueDate: doc.dueDate,
		completedAt: doc.completedAt?.toISOString() ?? null,
		skippedAt: doc.skippedAt?.toISOString() ?? null,
		skippedReason: doc.skippedReason ?? null,
		syncedToTimeTask: doc.syncedToTimeTask,
		timeTaskId: doc.timeTaskId?.toString() ?? null,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	}
}

function formatTemplate(doc: MaintenanceTemplateDocument): MaintenanceTemplateResponse {
	return {
		id: doc._id.toString(),
		title: doc.title,
		description: doc.description,
		frequency: doc.frequency,
		category: doc.category,
		estimatedMinutes: doc.estimatedMinutes,
		diyVsHire: doc.diyVsHire,
		cost: doc.cost ?? null,
		notes: doc.notes ?? null,
		isActive: doc.isActive
	}
}

function formatPropertyProfile(doc: PropertyProfileDocument): PropertyProfileResponse {
	return {
		id: doc._id.toString(),
		userId: doc.userId.toString(),
		name: doc.name,
		type: doc.type,
		hasHOA: doc.hasHOA,
		hoaCoversExterior: doc.hoaCoversExterior,
		appliances: doc.appliances ?? [],
		systems: doc.systems ?? [],
		lastUpdated: doc.updatedAt.toISOString()
	}
}

function formatCleanerRotation(doc: CleanerRotationDocument): CleanerRotationResponse {
	return {
		nextRotationIndex: doc.nextRotationIndex,
		nextRunDate: doc.nextRunDate,
		rotation: doc.rotation.map((r) => ({
			index: r.index,
			area: r.area,
			details: r.details
		}))
	}
}

// --- Maintenance Templates ---

export async function listTemplates(): Promise<MaintenanceTemplateResponse[]> {
	const templates = await repo.findAllTemplates()
	return templates.map(formatTemplate)
}

export async function createTemplate(data: {
	title: string
	description: string
	frequency: string
	category: string
	estimatedMinutes: number
	diyVsHire: string
	cost?: number
	notes?: string
}): Promise<MaintenanceTemplateResponse> {
	const template = await repo.createTemplate(data)
	return formatTemplate(template)
}

export async function updateTemplate(
	id: string,
	data: Record<string, unknown>
): Promise<MaintenanceTemplateResponse> {
	const template = await repo.updateTemplate(id, data)
	if (!template) throw new AppError('Template not found', 404)
	return formatTemplate(template)
}

export async function deleteTemplate(id: string): Promise<void> {
	const deleted = await repo.deleteTemplate(id)
	if (!deleted) throw new AppError('Template not found', 404)
}

// --- Household Tasks ---

export async function listTasks(
	userId: string,
	filters: {
		category?: string
		status?: string
		dueBefore?: string
		dueAfter?: string
	} = {}
): Promise<HouseholdTaskResponse[]> {
	const tasks = await repo.findTasksByUser(userId, filters)
	return tasks.map(formatTask)
}

export async function createTask(
	userId: string,
	data: {
		templateId?: string
		title: string
		description: string
		category: string
		dueDate: string
	},
	syncToTime = false
): Promise<HouseholdTaskResponse> {
	const task = await repo.createHouseholdTask({ ...data, userId })

	if (syncToTime) {
		const template = data.templateId ? await repo.findTemplateById(data.templateId) : null
		const timeTask = await repo.createTimeTask({
			userId,
			title: data.title,
			date: data.dueDate,
			durationMinutes: template?.estimatedMinutes ?? 30,
			source: 'household',
			color: '#8B5CF6',
			icon: 'house.fill'
		})
		await repo.updateHouseholdTask(task._id.toString(), userId, {
			syncedToTimeTask: true,
			timeTaskId: timeTask._id
		})
		const updated = await repo.findTaskByUserAndId(userId, task._id.toString())
		if (updated) return formatTask(updated)
	}

	return formatTask(task)
}

export async function getUpcomingTasks(userId: string): Promise<HouseholdTaskResponse[]> {
	const tasks = await repo.findUpcomingTasks(userId, 7)
	return tasks.map(formatTask)
}

export async function completeTask(userId: string, id: string): Promise<HouseholdTaskResponse> {
	const task = await repo.updateHouseholdTask(id, userId, {
		completedAt: new Date()
	})
	if (!task) throw new AppError('Task not found or not owned by user', 404)

	if (task.syncedToTimeTask && task.timeTaskId) {
		await repo.completeTimeTask(userId, task.timeTaskId.toString())
	}

	return formatTask(task)
}

export async function skipTask(
	userId: string,
	id: string,
	reason?: string
): Promise<HouseholdTaskResponse> {
	const task = await repo.updateHouseholdTask(id, userId, {
		skippedAt: new Date(),
		skippedReason: reason
	})
	if (!task) throw new AppError('Task not found or not owned by user', 404)
	return formatTask(task)
}

// --- Generate Upcoming Tasks ---

function getNextDueDate(frequency: string, lastCompleted: Date | null): string {
	const now = new Date()
	const base = lastCompleted ?? now

	const monthsMap: Record<string, number> = {
		monthly: 1,
		quarterly: 3,
		biannual: 6,
		annual: 12
	}

	const months = monthsMap[frequency] ?? 1
	const next = new Date(base)
	next.setMonth(next.getMonth() + months)

	if (next < now) {
		const catchUp = new Date(now)
		catchUp.setDate(catchUp.getDate() + 7)
		return catchUp.toISOString().split('T')[0]
	}

	return next.toISOString().split('T')[0]
}

export async function generateUpcomingTasks(
	userId: string,
	syncToTime = false
): Promise<GenerateTasksResult> {
	const templates = await repo.findActiveTemplates()
	const generated: HouseholdTaskResponse[] = []

	for (const template of templates) {
		const pending = await repo.findPendingByTemplate(userId, template._id.toString())
		if (pending) continue

		const lastCompleted = await repo.findLastCompletedByTemplate(userId, template._id.toString())
		const dueDate = getNextDueDate(
			template.frequency,
			lastCompleted?.completedAt ?? null
		)

		const task = await createTask(
			userId,
			{
				templateId: template._id.toString(),
				title: template.title,
				description: template.description,
				category: template.category,
				dueDate
			},
			syncToTime
		)
		generated.push(task)
	}

	return { generated: generated.length, tasks: generated }
}

// --- Property Profile ---

export async function getPropertyProfile(userId: string): Promise<PropertyProfileResponse | null> {
	const profile = await repo.findPropertyProfile(userId)
	if (!profile) return null
	return formatPropertyProfile(profile)
}

export async function updatePropertyProfile(
	userId: string,
	data: Record<string, unknown>
): Promise<PropertyProfileResponse> {
	const profile = await repo.upsertPropertyProfile(userId, data)
	return formatPropertyProfile(profile)
}

// --- Cleaner Rotation ---

export async function getCleanerRotation(userId: string): Promise<CleanerRotationResponse | null> {
	const rotation = await repo.findCleanerRotation(userId)
	if (!rotation) return null
	return formatCleanerRotation(rotation)
}

export async function updateCleanerRotation(
	userId: string,
	data: { nextRotationIndex?: number; nextRunDate?: string }
): Promise<CleanerRotationResponse> {
	const rotation = await repo.upsertCleanerRotation(userId, data)
	return formatCleanerRotation(rotation)
}
