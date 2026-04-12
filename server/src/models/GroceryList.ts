import mongoose, { Schema, Document, Model } from 'mongoose'

export type GroceryItemSubdoc = {
	ingredient: {
		name: string
		quantity: number
		unit: string
		category: string
	}
	store: 'costco' | 'safeway' | 'other'
	checked: boolean
	notes?: string
}

export type GroceryListDocument = Document & {
	userId: mongoose.Types.ObjectId
	/** Set when the list was generated from a meal plan; omitted for ad-hoc / recipe-picked lists. */
	mealPlanId?: mongoose.Types.ObjectId
	items: GroceryItemSubdoc[]
	status: 'draft' | 'ordered' | 'complete'
	createdAt: Date
	updatedAt: Date
}

const groceryIngredientSchema = new Schema<GroceryItemSubdoc['ingredient']>(
	{
		name: { type: String, required: true },
		quantity: { type: Number, required: true },
		unit: { type: String, required: true },
		category: { type: String, required: true }
	},
	{ _id: false }
)

const groceryItemSchema = new Schema<GroceryItemSubdoc>(
	{
		ingredient: { type: groceryIngredientSchema, required: true },
		store: { type: String, required: true, default: 'safeway' },
		checked: { type: Boolean, default: false },
		notes: { type: String }
	},
	{ _id: false }
)

const groceryListSchema = new Schema<GroceryListDocument>(
	{
			userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		mealPlanId: { type: Schema.Types.ObjectId, ref: 'MealPlan', required: false },
		items: [groceryItemSchema],
		status: { type: String, required: true, default: 'draft' }
	},
	{ timestamps: true }
)

groceryListSchema.index({ userId: 1 })
groceryListSchema.index({ mealPlanId: 1 })

export const GroceryList: Model<GroceryListDocument> =
	mongoose.models.GroceryList ?? mongoose.model<GroceryListDocument>('GroceryList', groceryListSchema)
