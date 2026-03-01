import { AppError } from '../../lib/errors'
import * as repo from './repository'
import type { TimeEntryResponse, TimeBudgetItem } from './types'

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
