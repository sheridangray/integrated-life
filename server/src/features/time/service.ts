import { AppError } from '../../lib/errors'
import * as repo from './repository'
import type { TimeEntryResponse, TimeBudgetItem, TaskResponse, RoutineResponse } from './types'
import type { TaskDocument } from '../../models/Task'
import type { RoutineDocument } from '../../models/Routine'

// --- Tasks (day planning) ---

function formatTask(doc: TaskDocument): TaskResponse {
	return {
		id: doc._id.toString(),
		title: doc.title,
		date: doc.date,
		startTime: doc.startTime ?? null,
		durationMinutes: doc.durationMinutes,
		color: doc.color,
		icon: doc.icon,
		notes: doc.notes ?? null,
		source: doc.source,
		routineId: doc.routineId?.toString() ?? null,
		calendarEventId: doc.calendarEventId ?? null,
		completedAt: doc.completedAt?.toISOString() ?? null,
		isRecurring: doc.isRecurring,
		recurrenceRule: doc.recurrenceRule
			? {
					frequency: doc.recurrenceRule.frequency,
					interval: doc.recurrenceRule.interval,
					daysOfWeek: doc.recurrenceRule.daysOfWeek,
					dayOfMonth: doc.recurrenceRule.dayOfMonth
				}
			: null,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	}
}

function formatRoutine(doc: RoutineDocument): RoutineResponse {
	return {
		id: doc._id.toString(),
		title: doc.title,
		defaultTime: doc.defaultTime ?? null,
		defaultDuration: doc.defaultDuration,
		color: doc.color,
		icon: doc.icon,
		notes: doc.notes ?? null,
		recurrenceRule: {
			frequency: doc.recurrenceRule.frequency,
			interval: doc.recurrenceRule.interval,
			daysOfWeek: doc.recurrenceRule.daysOfWeek,
			dayOfMonth: doc.recurrenceRule.dayOfMonth
		},
		isActive: doc.isActive,
		skippedDates: doc.skippedDates,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	}
}

export async function getInboxTasks(userId: string): Promise<TaskResponse[]> {
	const docs = await repo.findInboxTasks(userId)
	return docs.map(formatTask)
}

/**
 * Returns tasks for a date, including auto-populated routine instances.
 * For each active routine whose recurrence matches the requested date,
 * a task is lazily created if one doesn't already exist.
 */
export async function getTasksByDate(userId: string, date: string): Promise<TaskResponse[]> {
	await ensureRoutineTasksForDate(userId, date)
	const docs = await repo.findTasksByDate(userId, date)
	return docs.map(formatTask)
}

async function ensureRoutineTasksForDate(userId: string, date: string): Promise<void> {
	const routines = await repo.findActiveRoutines(userId)
	if (routines.length === 0) return

	const requestedDate = new Date(date + 'T00:00:00Z')

	for (const routine of routines) {
		if (routine.skippedDates.includes(date)) continue
		if (!routineMatchesDate(routine, requestedDate)) continue

		const existing = await repo.findRoutineTaskByDate(userId, routine._id.toString(), date)
		if (existing) continue

		await repo.createTask({
			userId,
			title: routine.title,
			date,
			startTime: routine.defaultTime,
			durationMinutes: routine.defaultDuration,
			color: routine.color,
			icon: routine.icon,
			notes: routine.notes,
			source: 'routine',
			routineId: routine._id.toString(),
			isRecurring: true,
			recurrenceRule: {
				frequency: routine.recurrenceRule.frequency,
				interval: routine.recurrenceRule.interval,
				daysOfWeek: routine.recurrenceRule.daysOfWeek,
				dayOfMonth: routine.recurrenceRule.dayOfMonth
			}
		})
	}
}

function routineMatchesDate(routine: RoutineDocument, date: Date): boolean {
	const rule = routine.recurrenceRule
	const day = date.getUTCDay()

	switch (rule.frequency) {
		case 'daily':
			return true
		case 'weekly':
			if (!rule.daysOfWeek || rule.daysOfWeek.length === 0) return true
			return rule.daysOfWeek.includes(day)
		case 'monthly':
			if (!rule.dayOfMonth) return true
			return date.getUTCDate() === rule.dayOfMonth
		case 'yearly':
			return true
		default:
			return false
	}
}

export async function createTask(
	userId: string,
	data: {
		title: string
		date: string | null
		startTime: string | null
		durationMinutes: number
		color: string
		icon: string
		notes?: string
		isRecurring?: boolean
		recurrenceRule?: { frequency: string; interval: number; daysOfWeek?: number[]; dayOfMonth?: number }
	}
): Promise<TaskResponse> {
	const doc = await repo.createTask({ ...data, userId, source: 'manual' })
	return formatTask(doc)
}

export async function updateTask(
	userId: string,
	taskId: string,
	updates: {
		title?: string
		date?: string | null
		startTime?: string | null
		durationMinutes?: number
		color?: string
		icon?: string
		notes?: string | null
		completedAt?: string | null
		isRecurring?: boolean
		recurrenceRule?: { frequency: string; interval: number; daysOfWeek?: number[]; dayOfMonth?: number } | null
	}
): Promise<TaskResponse> {
	const updateData: Record<string, unknown> = { ...updates }
	if (updates.completedAt !== undefined) {
		updateData.completedAt = updates.completedAt ? new Date(updates.completedAt) : null
	}
	const doc = await repo.updateTask(userId, taskId, updateData as Parameters<typeof repo.updateTask>[2])
	if (!doc) throw new AppError('Task not found or not editable', 404)
	return formatTask(doc)
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
	const deleted = await repo.deleteTask(userId, taskId)
	if (!deleted) throw new AppError('Task not found or not deletable', 404)
}

// --- Routines ---

export async function getRoutines(userId: string): Promise<RoutineResponse[]> {
	const docs = await repo.findRoutines(userId)
	return docs.map(formatRoutine)
}

export async function createRoutine(
	userId: string,
	data: {
		title: string
		defaultTime: string | null
		defaultDuration: number
		color: string
		icon: string
		notes?: string
		recurrenceRule: { frequency: string; interval: number; daysOfWeek?: number[]; dayOfMonth?: number }
	}
): Promise<RoutineResponse> {
	const doc = await repo.createRoutine({ ...data, userId })
	return formatRoutine(doc)
}

export async function updateRoutine(
	userId: string,
	routineId: string,
	updates: {
		title?: string
		defaultTime?: string | null
		defaultDuration?: number
		color?: string
		icon?: string
		notes?: string | null
		recurrenceRule?: { frequency: string; interval: number; daysOfWeek?: number[]; dayOfMonth?: number }
		isActive?: boolean
	}
): Promise<RoutineResponse> {
	const doc = await repo.updateRoutine(userId, routineId, updates)
	if (!doc) throw new AppError('Routine not found', 404)
	return formatRoutine(doc)
}

export async function deleteRoutine(userId: string, routineId: string): Promise<void> {
	const deleted = await repo.deleteRoutine(userId, routineId)
	if (!deleted) throw new AppError('Routine not found', 404)
}

export async function skipRoutineForDate(userId: string, routineId: string, date: string): Promise<RoutineResponse> {
	const doc = await repo.addSkippedDate(userId, routineId, date)
	if (!doc) throw new AppError('Routine not found', 404)
	return formatRoutine(doc)
}

// --- Time Entries (legacy) ---

function formatEntry(doc: { _id: { toString(): string }; categoryId: number; startTime: Date; endTime?: Date | null; notes?: string; createdAt: Date }): TimeEntryResponse {
	return {
		id: doc._id.toString(),
		categoryId: doc.categoryId,
		startTime: doc.startTime.toISOString(),
		endTime: doc.endTime?.toISOString() ?? null,
		notes: doc.notes ?? null,
		createdAt: doc.createdAt.toISOString()
	}
}

// --- Time Entries ---

export async function startEntry(userId: string, data: { categoryId: number; notes?: string }): Promise<TimeEntryResponse> {
	const entry = await repo.createTimeEntry({
		userId,
		categoryId: data.categoryId,
		startTime: new Date(),
		notes: data.notes
	})
	return formatEntry(entry)
}

export async function stopEntry(userId: string, entryId: string): Promise<TimeEntryResponse> {
	const entry = await repo.stopTimeEntry(userId, entryId)
	if (!entry) throw new AppError('Time entry not found or already stopped', 404)
	return formatEntry(entry)
}

export async function getActiveEntries(userId: string): Promise<TimeEntryResponse[]> {
	const entries = await repo.findActiveEntries(userId)
	return entries.map(formatEntry)
}

export async function getEntries(userId: string, from: string, to: string): Promise<TimeEntryResponse[]> {
	const entries = await repo.findEntriesInRange(userId, new Date(from), new Date(to))
	return entries.map(formatEntry)
}

export async function deleteEntry(userId: string, entryId: string): Promise<void> {
	const deleted = await repo.deleteTimeEntry(userId, entryId)
	if (!deleted) throw new AppError('Time entry not found', 404)
}

// --- Time Budget ---

export async function getBudget(userId: string): Promise<TimeBudgetItem[]> {
	const docs = await repo.findBudgets(userId)
	return docs.map((d) => ({
		categoryId: d.categoryId,
		period: d.period,
		allocatedMinutes: d.allocatedMinutes
	}))
}

export async function saveBudget(
	userId: string,
	budgets: Array<{ categoryId: number; period: string; allocatedMinutes: number }>
): Promise<TimeBudgetItem[]> {
	const docs = await repo.upsertBudgets(userId, budgets)
	return docs.map((d) => ({
		categoryId: d.categoryId,
		period: d.period,
		allocatedMinutes: d.allocatedMinutes
	}))
}
