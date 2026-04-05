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

// --- Task (day planning) ---

const recurrenceRuleSchema = z.object({
	frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
	interval: z.number().int().min(1).default(1),
	daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
	dayOfMonth: z.number().int().min(1).max(31).optional()
})

export const createTaskSchema = z.object({
	title: z.string().min(1).max(200),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
	startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
	durationMinutes: z.number().int().min(1).max(1440),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FF6B6B'),
	icon: z.string().min(1).default('circle.fill'),
	notes: z.string().max(2000).optional(),
	isRecurring: z.boolean().default(false),
	recurrenceRule: recurrenceRuleSchema.optional()
})

export const updateTaskSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
	startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
	durationMinutes: z.number().int().min(1).max(1440).optional(),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
	icon: z.string().min(1).optional(),
	notes: z.string().max(2000).nullable().optional(),
	completedAt: z.string().datetime().nullable().optional(),
	isRecurring: z.boolean().optional(),
	recurrenceRule: recurrenceRuleSchema.nullable().optional()
})

export const taskQuerySchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	inbox: z.enum(['true', 'false']).optional()
}).refine(data => data.date || data.inbox === 'true', {
	message: 'Either date or inbox=true must be provided'
})

// --- Routine ---

export const createRoutineSchema = z.object({
	title: z.string().min(1).max(200),
	defaultTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
	defaultDuration: z.number().int().min(1).max(1440).default(30),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#4DABF7'),
	icon: z.string().min(1).default('arrow.triangle.2.circlepath'),
	notes: z.string().max(2000).optional(),
	recurrenceRule: recurrenceRuleSchema
})

export const updateRoutineSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	defaultTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
	defaultDuration: z.number().int().min(1).max(1440).optional(),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
	icon: z.string().min(1).optional(),
	notes: z.string().max(2000).nullable().optional(),
	recurrenceRule: recurrenceRuleSchema.optional(),
	isActive: z.boolean().optional()
})
