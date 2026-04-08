import mongoose, { Schema, Document, Model } from 'mongoose'

export type HouseholdTaskDocument = Document & {
	userId: mongoose.Types.ObjectId
	templateId?: mongoose.Types.ObjectId
	title: string
	description: string
	category: 'hvac' | 'appliances' | 'plumbing' | 'surfaces' | 'safety' | 'cleaning'
	dueDate: string
	completedAt?: Date
	skippedAt?: Date
	skippedReason?: string
	syncedToTimeTask: boolean
	timeTaskId?: mongoose.Types.ObjectId
	createdAt: Date
	updatedAt: Date
}

const householdTaskSchema = new Schema<HouseholdTaskDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		templateId: { type: Schema.Types.ObjectId, ref: 'MaintenanceTemplate' },
		title: { type: String, required: true, trim: true },
		description: { type: String, required: true },
		category: {
			type: String,
			required: true,
			enum: ['hvac', 'appliances', 'plumbing', 'surfaces', 'safety', 'cleaning']
		},
		dueDate: { type: String, required: true },
		completedAt: { type: Date, default: null },
		skippedAt: { type: Date, default: null },
		skippedReason: { type: String },
		syncedToTimeTask: { type: Boolean, default: false },
		timeTaskId: { type: Schema.Types.ObjectId, ref: 'Task' }
	},
	{ timestamps: true }
)

householdTaskSchema.index({ userId: 1, dueDate: 1 })
householdTaskSchema.index({ userId: 1, category: 1 })
householdTaskSchema.index({ userId: 1, templateId: 1 })
householdTaskSchema.index({ userId: 1, completedAt: 1, skippedAt: 1 })

export const HouseholdTask: Model<HouseholdTaskDocument> =
	mongoose.models.HouseholdTask ??
	mongoose.model<HouseholdTaskDocument>('HouseholdTask', householdTaskSchema)
