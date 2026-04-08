import mongoose, { Schema, Document, Model } from 'mongoose'

export type PropertyProfileDocument = Document & {
	userId: mongoose.Types.ObjectId
	name: string
	type: 'condo' | 'house' | 'apartment'
	hasHOA: boolean
	hoaCoversExterior: boolean
	appliances?: string[]
	systems?: string[]
	createdAt: Date
	updatedAt: Date
}

const propertyProfileSchema = new Schema<PropertyProfileDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
		name: { type: String, default: 'Home' },
		type: { type: String, required: true, enum: ['condo', 'house', 'apartment'] },
		hasHOA: { type: Boolean, default: false },
		hoaCoversExterior: { type: Boolean, default: false },
		appliances: { type: [String] },
		systems: { type: [String] }
	},
	{ timestamps: true }
)

export const PropertyProfile: Model<PropertyProfileDocument> =
	mongoose.models.PropertyProfile ??
	mongoose.model<PropertyProfileDocument>('PropertyProfile', propertyProfileSchema)
