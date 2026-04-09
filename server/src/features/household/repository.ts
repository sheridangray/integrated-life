import mongoose from 'mongoose'
import { HouseholdTask, HouseholdTaskDocument } from '../../models/HouseholdTask'
import { MaintenanceTemplate, MaintenanceTemplateDocument } from '../../models/MaintenanceTemplate'
import { PropertyProfile, PropertyProfileDocument } from '../../models/PropertyProfile'
import { CleanerRotation, CleanerRotationDocument } from '../../models/CleanerRotation'
import { Task, TaskDocument } from '../../models/Task'

// --- Maintenance Templates ---

export async function findAllTemplates(): Promise<MaintenanceTemplateDocument[]> {
	return MaintenanceTemplate.find().sort({ frequency: 1, title: 1 }).exec()
}

export async function findActiveTemplates(): Promise<MaintenanceTemplateDocument[]> {
	return MaintenanceTemplate.find({ isActive: true }).sort({ frequency: 1, title: 1 }).exec()
}

export async function findTemplateById(id: string): Promise<MaintenanceTemplateDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return MaintenanceTemplate.findById(id).exec()
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
}): Promise<MaintenanceTemplateDocument> {
	return MaintenanceTemplate.create(data)
}

export async function updateTemplate(
	id: string,
	data: Record<string, unknown>
): Promise<MaintenanceTemplateDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return MaintenanceTemplate.findByIdAndUpdate(
		id,
		{ $set: data },
		{ new: true }
	).exec()
}

export async function deleteTemplate(id: string): Promise<boolean> {
	if (!mongoose.isValidObjectId(id)) return false
	const result = await MaintenanceTemplate.deleteOne({ _id: id }).exec()
	return result.deletedCount > 0
}

export async function upsertTemplate(
	title: string,
	data: Record<string, unknown>
): Promise<MaintenanceTemplateDocument> {
	return MaintenanceTemplate.findOneAndUpdate(
		{ title },
		{ $set: { ...data, title } },
		{ upsert: true, new: true }
	).exec() as Promise<MaintenanceTemplateDocument>
}

// --- Household Tasks ---

export async function findTasksByUser(
	userId: string,
	filters: {
		category?: string
		status?: string
		dueBefore?: string
		dueAfter?: string
	} = {}
): Promise<HouseholdTaskDocument[]> {
	const query: Record<string, unknown> = { userId }

	if (filters.category) query.category = filters.category

	if (filters.status === 'completed') {
		query.completedAt = { $ne: null }
	} else if (filters.status === 'skipped') {
		query.skippedAt = { $ne: null }
	} else if (filters.status === 'pending') {
		query.completedAt = null
		query.skippedAt = null
	} else if (filters.status === 'overdue') {
		query.completedAt = null
		query.skippedAt = null
		query.dueDate = { $lt: new Date().toISOString().split('T')[0] }
	}

	if (filters.dueBefore) {
		query.dueDate = { ...(query.dueDate as Record<string, unknown> ?? {}), $lte: filters.dueBefore }
	}
	if (filters.dueAfter) {
		query.dueDate = { ...(query.dueDate as Record<string, unknown> ?? {}), $gte: filters.dueAfter }
	}

	return HouseholdTask.find(query).sort({ dueDate: 1 }).exec()
}

export async function findTaskById(id: string): Promise<HouseholdTaskDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return HouseholdTask.findById(id).exec()
}

export async function findTaskByUserAndId(
	userId: string,
	id: string
): Promise<HouseholdTaskDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return HouseholdTask.findOne({ _id: id, userId }).exec()
}

export async function createHouseholdTask(data: {
	userId: string
	templateId?: string
	title: string
	description: string
	category: string
	dueDate: string
}): Promise<HouseholdTaskDocument> {
	return HouseholdTask.create(data)
}

export async function updateHouseholdTask(
	id: string,
	userId: string,
	data: Record<string, unknown>
): Promise<HouseholdTaskDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return HouseholdTask.findOneAndUpdate(
		{ _id: id, userId },
		{ $set: data },
		{ new: true }
	).exec()
}

export async function findUpcomingTasks(
	userId: string,
	daysAhead: number
): Promise<HouseholdTaskDocument[]> {
	const today = new Date().toISOString().split('T')[0]
	const futureDate = new Date()
	futureDate.setDate(futureDate.getDate() + daysAhead)
	const futureDateStr = futureDate.toISOString().split('T')[0]

	return HouseholdTask.find({
		userId,
		completedAt: null,
		skippedAt: null,
		dueDate: { $gte: today, $lte: futureDateStr }
	}).sort({ dueDate: 1 }).exec()
}

export async function findLastCompletedByTemplate(
	userId: string,
	templateId: string
): Promise<HouseholdTaskDocument | null> {
	return HouseholdTask.findOne({
		userId,
		templateId,
		completedAt: { $ne: null }
	}).sort({ completedAt: -1 }).exec()
}

export async function findPendingByTemplate(
	userId: string,
	templateId: string
): Promise<HouseholdTaskDocument | null> {
	return HouseholdTask.findOne({
		userId,
		templateId,
		completedAt: null,
		skippedAt: null
	}).exec()
}

// --- Time Task Sync ---

export async function createTimeTask(data: {
	userId: string
	title: string
	date: string
	durationMinutes: number
	source: string
	color: string
	icon: string
}): Promise<TaskDocument> {
	return Task.create({
		...data,
		startTime: null,
		isRecurring: false
	})
}

export async function completeTimeTask(
	userId: string,
	taskId: string
): Promise<TaskDocument | null> {
	if (!mongoose.isValidObjectId(taskId)) return null
	return Task.findOneAndUpdate(
		{ _id: taskId, userId },
		{ $set: { completedAt: new Date() } },
		{ new: true }
	).exec()
}

// --- Property Profile ---

export async function findPropertyProfile(userId: string): Promise<PropertyProfileDocument | null> {
	return PropertyProfile.findOne({ userId }).exec()
}

export async function upsertPropertyProfile(
	userId: string,
	data: Record<string, unknown>
): Promise<PropertyProfileDocument> {
	return PropertyProfile.findOneAndUpdate(
		{ userId },
		{ $set: { ...data, userId } },
		{ upsert: true, new: true }
	).exec() as Promise<PropertyProfileDocument>
}

// --- Cleaner Rotation ---

export async function findCleanerRotation(userId: string): Promise<CleanerRotationDocument | null> {
	return CleanerRotation.findOne({ userId }).exec()
}

export async function upsertCleanerRotation(
	userId: string,
	data: Record<string, unknown>
): Promise<CleanerRotationDocument> {
	return CleanerRotation.findOneAndUpdate(
		{ userId },
		{ $set: { ...data, userId } },
		{ upsert: true, new: true }
	).exec() as Promise<CleanerRotationDocument>
}
