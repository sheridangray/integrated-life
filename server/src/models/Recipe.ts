import mongoose, { Schema, Document, Model } from 'mongoose'

export type RecipeDocument = Document & {
	userId: mongoose.Types.ObjectId
	name: string
	description?: string
	imageUrl?: string
	imageId?: string
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
		fiber: { type: Number, required: true }
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

const recipeSchema = new Schema<RecipeDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		name: { type: String, required: true },
		description: { type: String },
		imageUrl: { type: String },
		imageId: { type: String },
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
