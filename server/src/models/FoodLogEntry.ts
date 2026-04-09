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
			sugar?: number
			water?: number
			saturatedFat?: number
			monounsaturatedFat?: number
			polyunsaturatedFat?: number
			cholesterol?: number
			transFat?: number
			vitaminA?: number
			vitaminB6?: number
			vitaminB12?: number
			vitaminC?: number
			vitaminD?: number
			vitaminE?: number
			vitaminK?: number
			thiamin?: number
			riboflavin?: number
			niacin?: number
			folate?: number
			pantothenicAcid?: number
			biotin?: number
			calcium?: number
			iron?: number
			magnesium?: number
			manganese?: number
			phosphorus?: number
			potassium?: number
			zinc?: number
			selenium?: number
			copper?: number
			chromium?: number
			molybdenum?: number
			chloride?: number
			iodine?: number
			sodium?: number
			caffeine?: number
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
		fiber: { type: Number, required: true },
		sugar: { type: Number, default: 0 },
		water: { type: Number, default: 0 },
		saturatedFat: { type: Number, default: 0 },
		monounsaturatedFat: { type: Number, default: 0 },
		polyunsaturatedFat: { type: Number, default: 0 },
		cholesterol: { type: Number, default: 0 },
		transFat: { type: Number, default: 0 },
		vitaminA: { type: Number, default: 0 },
		vitaminB6: { type: Number, default: 0 },
		vitaminB12: { type: Number, default: 0 },
		vitaminC: { type: Number, default: 0 },
		vitaminD: { type: Number, default: 0 },
		vitaminE: { type: Number, default: 0 },
		vitaminK: { type: Number, default: 0 },
		thiamin: { type: Number, default: 0 },
		riboflavin: { type: Number, default: 0 },
		niacin: { type: Number, default: 0 },
		folate: { type: Number, default: 0 },
		pantothenicAcid: { type: Number, default: 0 },
		biotin: { type: Number, default: 0 },
		calcium: { type: Number, default: 0 },
		iron: { type: Number, default: 0 },
		magnesium: { type: Number, default: 0 },
		manganese: { type: Number, default: 0 },
		phosphorus: { type: Number, default: 0 },
		potassium: { type: Number, default: 0 },
		zinc: { type: Number, default: 0 },
		selenium: { type: Number, default: 0 },
		copper: { type: Number, default: 0 },
		chromium: { type: Number, default: 0 },
		molybdenum: { type: Number, default: 0 },
		chloride: { type: Number, default: 0 },
		iodine: { type: Number, default: 0 },
		sodium: { type: Number, default: 0 },
		caffeine: { type: Number, default: 0 }
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
