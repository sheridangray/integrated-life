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
