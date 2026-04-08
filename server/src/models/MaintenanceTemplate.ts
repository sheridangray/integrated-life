import mongoose, { Schema, Document, Model } from 'mongoose'

export type MaintenanceTemplateDocument = Document & {
	title: string
	description: string
	frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual'
	category: 'hvac' | 'appliances' | 'plumbing' | 'surfaces' | 'safety' | 'cleaning'
	estimatedMinutes: number
	diyVsHire: 'diy' | 'hire' | 'optional'
	cost?: number
	notes?: string
	isActive: boolean
	createdAt: Date
	updatedAt: Date
}

const maintenanceTemplateSchema = new Schema<MaintenanceTemplateDocument>(
	{
		title: { type: String, required: true, trim: true },
		description: { type: String, required: true },
		frequency: {
			type: String,
			required: true,
			enum: ['monthly', 'quarterly', 'biannual', 'annual']
		},
		category: {
			type: String,
			required: true,
			enum: ['hvac', 'appliances', 'plumbing', 'surfaces', 'safety', 'cleaning']
		},
		estimatedMinutes: { type: Number, required: true, min: 1 },
		diyVsHire: {
			type: String,
			required: true,
			enum: ['diy', 'hire', 'optional']
		},
		cost: { type: Number },
		notes: { type: String },
		isActive: { type: Boolean, default: true }
	},
	{ timestamps: true }
)

maintenanceTemplateSchema.index({ frequency: 1 })
maintenanceTemplateSchema.index({ category: 1 })
maintenanceTemplateSchema.index({ isActive: 1 })

export const MaintenanceTemplate: Model<MaintenanceTemplateDocument> =
	mongoose.models.MaintenanceTemplate ??
	mongoose.model<MaintenanceTemplateDocument>('MaintenanceTemplate', maintenanceTemplateSchema)
