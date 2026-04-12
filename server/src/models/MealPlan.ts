import mongoose, { Schema, Document, Model } from 'mongoose'

export type MealSubdoc = {
	recipeId: mongoose.Types.ObjectId
	scheduledDate: Date
	mealType: string
	servings: number
}

export type MealPlanDocument = Document & {
	userId: mongoose.Types.ObjectId
	weekStartDate: Date
	meals: MealSubdoc[]
	status: 'proposed' | 'confirmed' | 'shopping' | 'complete'
	createdAt: Date
	updatedAt: Date
}

const mealSchema = new Schema<MealSubdoc>(
	{
		recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
		scheduledDate: { type: Date, required: true },
		mealType: { type: String, required: true },
		servings: { type: Number, required: true, default: 1 }
	},
	{ _id: false }
)

const mealPlanSchema = new Schema<MealPlanDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		weekStartDate: { type: Date, required: true },
		meals: [mealSchema],
		status: { type: String, required: true, default: 'proposed' }
	},
	{ timestamps: true }
)

mealPlanSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true })
mealPlanSchema.index({ userId: 1, status: 1 })

export const MealPlan: Model<MealPlanDocument> =
	mongoose.models.MealPlan ?? mongoose.model<MealPlanDocument>('MealPlan', mealPlanSchema)
