import mongoose, { Schema, Document, Model } from 'mongoose'

export type FoodLogEntryDocument = Document & {
	userId: mongoose.Types.ObjectId
	date: Date
	mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
	source: 'barcode' | 'photo' | 'manual' | 'recipe'
	food: {
		name: string
		brand?: string
		nutrition: {
			calories: number
			protein: number
			carbs: number
			fat: number
			fiber: number
		}
	}
	servingSize: string
	servings: number
	notes?: string
	createdAt: Date
	updatedAt: Date
}

const nutritionSchema = new Schema<FoodLogEntryDocument['food']['nutrition']>(
	{
		calories: { type: Number, required: true },
		protein: { type: Number, required: true },
		carbs: { type: Number, required: true },
		fat: { type: Number, required: true },
		fiber: { type: Number, required: true }
	},
	{ _id: false }
)

const foodSchema = new Schema<FoodLogEntryDocument['food']>(
	{
		name: { type: String, required: true },
		brand: { type: String },
		nutrition: { type: nutritionSchema, required: true }
	},
	{ _id: false }
)

const foodLogEntrySchema = new Schema<FoodLogEntryDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		date: { type: Date, required: true },
		mealType: { type: String, required: true },
		source: { type: String, required: true, default: 'manual' },
		food: { type: foodSchema, required: true },
		servingSize: { type: String, required: true },
		servings: { type: Number, required: true },
		notes: { type: String }
	},
	{ timestamps: true }
)

foodLogEntrySchema.index({ userId: 1, date: -1 })
foodLogEntrySchema.index({ userId: 1, mealType: 1 })

export const FoodLogEntry: Model<FoodLogEntryDocument> =
	mongoose.models.FoodLogEntry ?? mongoose.model<FoodLogEntryDocument>('FoodLogEntry', foodLogEntrySchema)
