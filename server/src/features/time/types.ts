export type TimeEntryResponse = {
	id: string
	categoryId: number
	startTime: string
	endTime: string | null
	notes: string | null
	createdAt: string
}

export type TimeBudgetItem = {
	categoryId: number
	period: 'daily' | 'weekly' | 'monthly'
	allocatedMinutes: number
}

export type TimeBudgetResponse = {
	budgets: TimeBudgetItem[]
}

// --- Task (day planning) ---

export type RecurrenceRule = {
	frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
	interval: number
	daysOfWeek?: number[]
	dayOfMonth?: number
}

export type TaskResponse = {
	id: string
	title: string
	date: string | null
	startTime: string | null
	durationMinutes: number
	color: string
	icon: string
	notes: string | null
	source: 'manual' | 'routine' | 'calendar'
	routineId: string | null
	calendarEventId: string | null
	completedAt: string | null
	isRecurring: boolean
	recurrenceRule: RecurrenceRule | null
	createdAt: string
	updatedAt: string
}

// --- Routine ---

export type RoutineResponse = {
	id: string
	title: string
	defaultTime: string | null
	defaultDuration: number
	color: string
	icon: string
	notes: string | null
	recurrenceRule: RecurrenceRule
	isActive: boolean
	skippedDates: string[]
	createdAt: string
	updatedAt: string
}
