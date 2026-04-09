import mongoose, { Schema, Document, Model } from 'mongoose'

export type RecipeImage = {
	url: string
	caption?: string
	order: number
}

export type RecipeDocument = Document & {
	userId: mongoose.Types.ObjectId
	name: string
	description?: string
	imageUrl?: string // DEPRECATED: Use images array instead
	imageId?: string // DEPRECATED: Use images array instead
	images: RecipeImage[]
	servings: number
	prepTime: number
	cookTime: number
	ingredients: Array<{
		name: string
		quantity: number
		unit: string
		category: string
	}>
	instructions: string[]
	tags: string[]
	nutritionPerServing: {
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
	createdAt: Date
	updatedAt: Date
}

const nutritionSchema = new Schema<RecipeDocument['nutritionPerServing']>(
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

const ingredientSchema = new Schema<RecipeDocument['ingredients'][number]>(
	{
		name: { type: String, required: true },
		quantity: { type: Number, required: true },
		unit: { type: String, required: true },
		category: { type: String, required: true }
	},
	{ _id: false }
)

const recipeImageSchema = new Schema<RecipeImage>(
	{
		url: { type: String, required: true },
		caption: { type: String },
		order: { type: Number, required: true, default: 0 }
	},
	{ _id: false }
)

const recipeSchema = new Schema<RecipeDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
		name: { type: String, required: true },
		description: { type: String },
		imageUrl: { type: String }, // DEPRECATED: kept for migration compatibility
		imageId: { type: String }, // DEPRECATED: kept for migration compatibility
		images: [recipeImageSchema],
		servings: { type: Number, required: true },
		prepTime: { type: Number, required: true },
		cookTime: { type: Number, required: true },
		ingredients: [ingredientSchema],
		instructions: [{ type: String }],
		tags: [{ type: String }],
		nutritionPerServing: { type: nutritionSchema, required: true }
	},
	{ timestamps: true }
)

recipeSchema.index({ userId: 1 })
recipeSchema.index({ tags: 1 })
recipeSchema.index({ name: 'text' })

export const Recipe: Model<RecipeDocument> =
	mongoose.models.Recipe ?? mongoose.model<RecipeDocument>('Recipe', recipeSchema)
