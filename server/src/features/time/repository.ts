import mongoose from 'mongoose'
import { TimeEntry, TimeEntryDocument } from '../../models/TimeEntry'
import { TimeBudget, TimeBudgetDocument } from '../../models/TimeBudget'

// --- Time Entries ---

export async function createTimeEntry(data: {
	userId: string
	categoryId: number
	startTime: Date
	notes?: string
}): Promise<TimeEntryDocument> {
	return TimeEntry.create(data)
}

export async function findActiveEntries(userId: string): Promise<TimeEntryDocument[]> {
	return TimeEntry.find({ userId, endTime: null }).sort({ startTime: -1 }).exec()
}

export async function findTimeEntryById(userId: string, id: string): Promise<TimeEntryDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return TimeEntry.findOne({ _id: id, userId }).exec()
}

export async function stopTimeEntry(userId: string, id: string): Promise<TimeEntryDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return TimeEntry.findOneAndUpdate(
		{ _id: id, userId, endTime: null },
		{ $set: { endTime: new Date() } },
		{ new: true }
	).exec()
}

export async function findEntriesInRange(
	userId: string,
	from: Date,
	to: Date
): Promise<TimeEntryDocument[]> {
	return TimeEntry.find({
		userId,
		startTime: { $gte: from, $lte: to }
	}).sort({ startTime: -1 }).exec()
}

export async function deleteTimeEntry(userId: string, id: string): Promise<boolean> {
	if (!mongoose.isValidObjectId(id)) return false
	const result = await TimeEntry.deleteOne({ _id: id, userId }).exec()
	return result.deletedCount > 0
}

// --- Time Budget ---

export async function findBudgets(userId: string): Promise<TimeBudgetDocument[]> {
	return TimeBudget.find({ userId }).exec()
}

export async function upsertBudgets(
	userId: string,
	budgets: Array<{ categoryId: number; period: string; allocatedMinutes: number }>
): Promise<TimeBudgetDocument[]> {
	const userOid = new mongoose.Types.ObjectId(userId)

	const ops = budgets.map((b) => ({
		updateOne: {
			filter: { userId: userOid, categoryId: b.categoryId, period: b.period },
			update: { $set: { allocatedMinutes: b.allocatedMinutes, userId: userOid } },
			upsert: true
		}
	}))

	if (ops.length > 0) {
		await TimeBudget.bulkWrite(ops)
	}

	return findBudgets(userId)
}
