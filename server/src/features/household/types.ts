import type {
	MaintenanceTaskTemplate,
	CreateMaintenanceTemplate,
	UpdateMaintenanceTemplate,
	HouseholdTask,
	CreateHouseholdTask,
	HouseholdTaskFilters,
	CleanerRotationState,
	UpdateCleanerRotation,
	PropertyProfile,
	UpdatePropertyProfile
} from '@integrated-life/shared'

export type {
	MaintenanceTaskTemplate,
	CreateMaintenanceTemplate,
	UpdateMaintenanceTemplate,
	HouseholdTask,
	CreateHouseholdTask,
	HouseholdTaskFilters,
	CleanerRotationState,
	UpdateCleanerRotation,
	PropertyProfile,
	UpdatePropertyProfile
}

export type HouseholdTaskResponse = {
	id: string
	userId: string
	templateId: string | null
	title: string
	description: string
	category: string
	dueDate: string
	completedAt: string | null
	skippedAt: string | null
	skippedReason: string | null
	syncedToTimeTask: boolean
	timeTaskId: string | null
	createdAt: string
	updatedAt: string
}

export type MaintenanceTemplateResponse = {
	id: string
	title: string
	description: string
	frequency: string
	category: string
	estimatedMinutes: number
	diyVsHire: string
	cost: number | null
	notes: string | null
	isActive: boolean
}

export type PropertyProfileResponse = {
	id: string
	userId: string
	name: string
	type: string
	hasHOA: boolean
	hoaCoversExterior: boolean
	appliances: string[]
	systems: string[]
	lastUpdated: string
}

export type CleanerRotationResponse = {
	nextRotationIndex: number
	nextRunDate: string
	rotation: Array<{
		index: number
		area: string
		details: string
	}>
}

export type GenerateTasksResult = {
	generated: number
	tasks: HouseholdTaskResponse[]
}
