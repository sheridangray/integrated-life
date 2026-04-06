import mongoose from 'mongoose'
import { TimeEntry, TimeEntryDocument } from '../../models/TimeEntry'
import { TimeBudget, TimeBudgetDocument } from '../../models/TimeBudget'
import { Task, TaskDocument } from '../../models/Task'
import { Routine, RoutineDocument } from '../../models/Routine'

// --- Routines ---

export async function createRoutine(data: {
	userId: string
	title: string
	defaultTime: string | null
	defaultDuration: number
	color: string
	icon: string
	notes?: string
	recurrenceRule: { frequency: string; interval: number; daysOfWeek?: number[]; dayOfMonth?: number }
}): Promise<RoutineDocument> {
	return Routine.create(data)
}

export async function findRoutines(userId: string): Promise<RoutineDocument[]> {
	return Routine.find({ userId }).sort({ createdAt: -1 }).exec()
}

export async function findActiveRoutines(userId: string): Promise<RoutineDocument[]> {
	return Routine.find({ userId, isActive: true }).exec()
}

export async function findRoutineById(userId: string, id: string): Promise<RoutineDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return Routine.findOne({ _id: id, userId }).exec()
}

export async function updateRoutine(
	userId: string,
	id: string,
	updates: Partial<{
		title: string
		defaultTime: string | null
		defaultDuration: number
		color: string
		icon: string
		notes: string | null
		recurrenceRule: { frequency: string; interval: number; daysOfWeek?: number[]; dayOfMonth?: number }
		isActive: boolean
	}>
): Promise<RoutineDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return Routine.findOneAndUpdate(
		{ _id: id, userId },
		{ $set: updates },
		{ new: true }
	).exec()
}

export async function deleteRoutine(userId: string, id: string): Promise<boolean> {
	if (!mongoose.isValidObjectId(id)) return false
	const result = await Routine.deleteOne({ _id: id, userId }).exec()
	return result.deletedCount > 0
}

export async function addSkippedDate(userId: string, routineId: string, date: string): Promise<RoutineDocument | null> {
	if (!mongoose.isValidObjectId(routineId)) return null
	return Routine.findOneAndUpdate(
		{ _id: routineId, userId },
		{ $addToSet: { skippedDates: date } },
		{ new: true }
	).exec()
}

export async function findRoutineTaskByDate(userId: string, routineId: string, date: string): Promise<TaskDocument | null> {
	return Task.findOne({ userId, routineId, date, source: 'routine' }).exec()
}

// --- Tasks (day planning) ---

export async function findInboxTasks(userId: string): Promise<TaskDocument[]> {
	return Task.find({ userId, date: null }).sort({ createdAt: -1 }).exec()
}

export async function createTask(data: {
	userId: string
	title: string
	date: string | null
	startTime: string | null
	durationMinutes: number
	color: string
	icon: string
	notes?: string
	source?: 'manual' | 'routine' | 'calendar'
	routineId?: string
	isRecurring?: boolean
	recurrenceRule?: { frequency: string; interval: number; daysOfWeek?: number[]; dayOfMonth?: number }
}): Promise<TaskDocument> {
	return Task.create(data)
}

export async function findTasksByDate(userId: string, date: string): Promise<TaskDocument[]> {
	return Task.find({ userId, date }).sort({ startTime: 1, createdAt: 1 }).exec()
}

export async function findTaskById(userId: string, id: string): Promise<TaskDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return Task.findOne({ _id: id, userId }).exec()
}

export async function updateTask(
	userId: string,
	id: string,
	updates: Partial<{
		title: string
		date: string | null
		startTime: string | null
		durationMinutes: number
		color: string
		icon: string
		notes: string | null
		completedAt: Date | null
		isRecurring: boolean
		recurrenceRule: { frequency: string; interval: number; daysOfWeek?: number[]; dayOfMonth?: number } | null
	}>
): Promise<TaskDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return Task.findOneAndUpdate(
		{ _id: id, userId, source: { $ne: 'calendar' } },
		{ $set: updates },
		{ new: true }
	).exec()
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
	if (!mongoose.isValidObjectId(id)) return false
	const result = await Task.deleteOne({ _id: id, userId, source: { $ne: 'calendar' } }).exec()
	return result.deletedCount > 0
}

// --- Calendar tasks ---

export async function upsertCalendarTask(
	userId: string,
	calendarEventId: string,
	data: {
		title: string
		date: string
		startTime: string | null
		durationMinutes: number
		color: string
		icon: string
	}
): Promise<TaskDocument> {
	return Task.findOneAndUpdate(
		{ userId, calendarEventId, source: 'calendar' },
		{ $set: { ...data, userId } },
		{ new: true, upsert: true, runValidators: true }
	).exec() as Promise<TaskDocument>
}

export async function deleteStaleCalendarTasks(
	userId: string,
	date: string,
	activeEventIds: string[]
): Promise<number> {
	const result = await Task.deleteMany({
		userId,
		date,
		source: 'calendar',
		calendarEventId: { $nin: activeEventIds }
	}).exec()
	return result.deletedCount
}

// --- Time Entries (legacy) ---

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
