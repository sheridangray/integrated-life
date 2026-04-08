import { z } from 'zod'

// --- Enums ---

export const MaintenanceFrequencyEnum = z.enum(['monthly', 'quarterly', 'biannual', 'annual'])

export type MaintenanceFrequency = z.infer<typeof MaintenanceFrequencyEnum>

export const MaintenanceCategoryEnum = z.enum([
	'hvac',
	'appliances',
	'plumbing',
	'surfaces',
	'safety',
	'cleaning'
])

export type MaintenanceCategory = z.infer<typeof MaintenanceCategoryEnum>

export const DiyVsHireEnum = z.enum(['diy', 'hire', 'optional'])

export type DiyVsHire = z.infer<typeof DiyVsHireEnum>

export const PropertyTypeEnum = z.enum(['condo', 'house', 'apartment'])

export type PropertyType = z.infer<typeof PropertyTypeEnum>

// --- Maintenance Task Template ---

export const MaintenanceTaskTemplateSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	frequency: MaintenanceFrequencyEnum,
	category: MaintenanceCategoryEnum,
	estimatedMinutes: z.number(),
	diyVsHire: DiyVsHireEnum,
	cost: z.number().optional(),
	notes: z.string().optional(),
	isActive: z.boolean().default(true)
})

export type MaintenanceTaskTemplate = z.infer<typeof MaintenanceTaskTemplateSchema>

export const CreateMaintenanceTemplateSchema = MaintenanceTaskTemplateSchema.omit({
	id: true,
	isActive: true
})

export type CreateMaintenanceTemplate = z.infer<typeof CreateMaintenanceTemplateSchema>

export const UpdateMaintenanceTemplateSchema = CreateMaintenanceTemplateSchema.partial().extend({
	isActive: z.boolean().optional()
})

export type UpdateMaintenanceTemplate = z.infer<typeof UpdateMaintenanceTemplateSchema>

// --- Household Task Instance ---

export const HouseholdTaskSchema = z.object({
	id: z.string(),
	userId: z.string(),
	templateId: z.string().optional(),
	title: z.string(),
	description: z.string(),
	category: MaintenanceCategoryEnum,
	dueDate: z.string(),
	completedAt: z.string().optional(),
	skippedAt: z.string().optional(),
	skippedReason: z.string().optional(),
	syncedToTimeTask: z.boolean().default(false),
	timeTaskId: z.string().optional(),
	createdAt: z.string(),
	updatedAt: z.string()
})

export type HouseholdTask = z.infer<typeof HouseholdTaskSchema>

export const CreateHouseholdTaskSchema = HouseholdTaskSchema.omit({
	id: true,
	userId: true,
	completedAt: true,
	skippedAt: true,
	skippedReason: true,
	syncedToTimeTask: true,
	timeTaskId: true,
	createdAt: true,
	updatedAt: true
})

export type CreateHouseholdTask = z.infer<typeof CreateHouseholdTaskSchema>

// --- Cleaner Rotation ---

export const CleanerRotationEntrySchema = z.object({
	index: z.number(),
	area: z.string(),
	details: z.string()
})

export type CleanerRotationEntry = z.infer<typeof CleanerRotationEntrySchema>

export const CleanerRotationStateSchema = z.object({
	nextRotationIndex: z.number(),
	nextRunDate: z.string(),
	rotation: z.array(CleanerRotationEntrySchema)
})

export type CleanerRotationState = z.infer<typeof CleanerRotationStateSchema>

export const UpdateCleanerRotationSchema = z.object({
	nextRotationIndex: z.number().optional(),
	nextRunDate: z.string().optional()
})

export type UpdateCleanerRotation = z.infer<typeof UpdateCleanerRotationSchema>

// --- Property Profile ---

export const PropertyProfileSchema = z.object({
	id: z.string(),
	userId: z.string(),
	name: z.string().default('Home'),
	type: PropertyTypeEnum,
	hasHOA: z.boolean().default(false),
	hoaCoversExterior: z.boolean().default(false),
	appliances: z.array(z.string()).optional(),
	systems: z.array(z.string()).optional(),
	lastUpdated: z.string()
})

export type PropertyProfile = z.infer<typeof PropertyProfileSchema>

export const UpdatePropertyProfileSchema = PropertyProfileSchema.omit({
	id: true,
	userId: true,
	lastUpdated: true
}).partial()

export type UpdatePropertyProfile = z.infer<typeof UpdatePropertyProfileSchema>

// --- Query Filters ---

export const HouseholdTaskFiltersSchema = z.object({
	category: MaintenanceCategoryEnum.optional(),
	status: z.enum(['pending', 'completed', 'skipped', 'overdue']).optional(),
	dueBefore: z.string().optional(),
	dueAfter: z.string().optional()
})

export type HouseholdTaskFilters = z.infer<typeof HouseholdTaskFiltersSchema>
