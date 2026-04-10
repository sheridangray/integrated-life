import mongoose from 'mongoose'
import { Recipe, RecipeDocument } from '../../models/Recipe'
import { MealPlan, MealPlanDocument } from '../../models/MealPlan'
import { GroceryList, GroceryListDocument } from '../../models/GroceryList'
import { FoodLogEntry, FoodLogEntryDocument } from '../../models/FoodLogEntry'

export async function findRecipes(
	userId: string,
	filters: { search?: string; tag?: string; ingredient?: string; page: number; limit: number }
): Promise<{ docs: RecipeDocument[]; total: number }> {
	const query: Record<string, unknown> = { $or: [{ userId }, { userId: null }] }
	if (filters.search) query.$or = [{ name: { $regex: filters.search, $options: "i" } }, { "ingredients.name": { $regex: filters.search, $options: "i" } }, { tags: { $regex: filters.search, $options: "i" } }]
	if (filters.tag) query.tags = filters.tag
	if (filters.ingredient) query['ingredients.name'] = { $regex: filters.ingredient, $options: 'i' }

	const total = await Recipe.countDocuments(query).exec()
	const docs = await Recipe.find(query)
		.sort({ createdAt: -1 })
		.skip((filters.page - 1) * filters.limit)
		.limit(filters.limit)
		.exec()

	return { docs, total }
}

export async function findRecipeById(id: string, userId: string): Promise<RecipeDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return Recipe.findOne({ _id: id, $or: [{ userId }, { userId: null }] }).exec()
}

export async function findRecipesByIds(ids: string[]): Promise<RecipeDocument[]> {
	return Recipe.find({ _id: { $in: ids } }).exec()
}

export async function createRecipe(userId: string, data: Record<string, unknown>): Promise<RecipeDocument> {
	return Recipe.create({ ...data, userId })
}

export async function updateRecipe(
	id: string,
	userId: string,
	data: Record<string, unknown>
): Promise<RecipeDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return Recipe.findOneAndUpdate({ _id: id, userId }, { $set: data }, { new: true }).exec()
}

export async function deleteRecipe(id: string, userId: string): Promise<boolean> {
	if (!mongoose.isValidObjectId(id)) return false
	const result = await Recipe.findOneAndDelete({ _id: id, userId }).exec()
	return result !== null
}

export async function findMealPlans(
	userId: string,
	filters: { weekStartDate?: string; status?: string; page: number; limit: number }
): Promise<{ docs: MealPlanDocument[]; total: number }> {
	const query: Record<string, unknown> = { $or: [{ userId }, { userId: null }] }
	if (filters.weekStartDate) query.weekStartDate = new Date(filters.weekStartDate)
	if (filters.status) query.status = filters.status

	const total = await MealPlan.countDocuments(query).exec()
	const docs = await MealPlan.find(query)
		.sort({ weekStartDate: -1 })
		.skip((filters.page - 1) * filters.limit)
		.limit(filters.limit)
		.exec()

	return { docs, total }
}

export async function findCurrentMealPlan(userId: string): Promise<MealPlanDocument | null> {
	const now = new Date()
	const dayOfWeek = now.getDay()
	const monday = new Date(now)
	monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
	monday.setHours(0, 0, 0, 0)

	return MealPlan.findOne({
		userId,
		weekStartDate: { $lte: monday }
	})
		.sort({ weekStartDate: -1 })
		.exec()
}

export async function findMealPlanById(id: string, userId: string): Promise<MealPlanDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return MealPlan.findOne({ _id: id, userId }).exec()
}

export async function createMealPlan(userId: string, data: Record<string, unknown>): Promise<MealPlanDocument> {
	return MealPlan.create({ ...data, userId })
}

export async function updateMealPlan(
	id: string,
	userId: string,
	data: Record<string, unknown>
): Promise<MealPlanDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return MealPlan.findOneAndUpdate({ _id: id, userId }, { $set: data }, { new: true }).exec()
}

export async function deleteMealPlan(id: string, userId: string): Promise<boolean> {
	if (!mongoose.isValidObjectId(id)) return false
	const result = await MealPlan.findOneAndDelete({ _id: id, userId }).exec()
	return result !== null
}

export async function findGroceryLists(
	userId: string,
	filters: { page: number; limit: number }
): Promise<{ docs: GroceryListDocument[]; total: number }> {
	const query: Record<string, unknown> = { $or: [{ userId }, { userId: null }] }

	const total = await GroceryList.countDocuments(query).exec()
	const docs = await GroceryList.find(query)
		.sort({ createdAt: -1 })
		.skip((filters.page - 1) * filters.limit)
		.limit(filters.limit)
		.exec()

	return { docs, total }
}

export async function findGroceryListById(id: string, userId: string): Promise<GroceryListDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return GroceryList.findOne({ _id: id, userId }).exec()
}

export async function createGroceryList(
	userId: string,
	data: Record<string, unknown>
): Promise<GroceryListDocument> {
	return GroceryList.create({ ...data, userId })
}

export async function updateGroceryList(
	id: string,
	userId: string,
	data: Record<string, unknown>
): Promise<GroceryListDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return GroceryList.findOneAndUpdate({ _id: id, userId }, { $set: data }, { new: true }).exec()
}

export async function findFoodLogEntries(
	userId: string,
	filters: { startDate?: string; endDate?: string; mealType?: string; page: number; limit: number }
): Promise<{ docs: FoodLogEntryDocument[]; total: number }> {
	const query: Record<string, unknown> = { $or: [{ userId }, { userId: null }] }

	if (filters.startDate || filters.endDate) {
		const dateFilter: Record<string, Date> = {}
		if (filters.startDate) dateFilter.$gte = new Date(filters.startDate)
		if (filters.endDate) dateFilter.$lte = new Date(filters.endDate)
		query.date = dateFilter
	}
	if (filters.mealType) query.mealType = filters.mealType

	const total = await FoodLogEntry.countDocuments(query).exec()
	const docs = await FoodLogEntry.find(query)
		.sort({ date: -1, createdAt: -1 })
		.skip((filters.page - 1) * filters.limit)
		.limit(filters.limit)
		.exec()

	return { docs, total }
}

export async function findFoodLogByDate(userId: string, date: string): Promise<FoodLogEntryDocument[]> {
	const start = new Date(date)
	start.setHours(0, 0, 0, 0)
	const end = new Date(date)
	end.setHours(23, 59, 59, 999)

	return FoodLogEntry.find({
		userId,
		date: { $gte: start, $lte: end }
	})
		.sort({ createdAt: 1 })
		.exec()
}

export async function findFoodLogById(id: string, userId: string): Promise<FoodLogEntryDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return FoodLogEntry.findOne({ _id: id, userId }).exec()
}

export async function createFoodLogEntry(
	userId: string,
	data: Record<string, unknown>
): Promise<FoodLogEntryDocument> {
	return FoodLogEntry.create({ ...data, userId })
}

export async function updateFoodLogEntry(
	id: string,
	userId: string,
	data: Record<string, unknown>
): Promise<FoodLogEntryDocument | null> {
	if (!mongoose.isValidObjectId(id)) return null
	return FoodLogEntry.findOneAndUpdate({ _id: id, userId }, { $set: data }, { new: true }).exec()
}

export async function deleteFoodLogEntry(id: string, userId: string): Promise<boolean> {
	if (!mongoose.isValidObjectId(id)) return false
	const result = await FoodLogEntry.findOneAndDelete({ _id: id, userId }).exec()
	return result !== null
}
