import { z } from 'zod'

export const startTimeEntrySchema = z.object({
	categoryId: z.number().int().min(1).max(15),
	notes: z.string().optional()
})

export const timeEntryQuerySchema = z.object({
	from: z.string(),
	to: z.string()
})

export const timeBudgetSchema = z.object({
	budgets: z.array(
		z.object({
			categoryId: z.number().int().min(1).max(15),
			period: z.enum(['daily', 'weekly', 'monthly']),
			allocatedMinutes: z.number().min(0)
		})
	)
})
