import mongoose from 'mongoose'
import { Recipe, RecipeDocument } from '../../models/Recipe'

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
import { MealPlan, MealPlanDocument } from '../../models/MealPlan'
import { GroceryList, GroceryListDocument } from '../../models/GroceryList'
import { FoodLogEntry, FoodLogEntryDocument } from '../../models/FoodLogEntry'

export async function distinctRecipeTags(userId: string): Promise<string[]> {
	const raw = await Recipe.distinct('tags', { $or: [{ userId }, { userId: null }] }).exec()
	const flat = (raw as unknown[]).flatMap((t) => (typeof t === 'string' && t.trim() ? [t] : []))
	return [...new Set(flat)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export async function findRecipes(
	userId: string,
	filters: {
		search?: string
		tag?: string
		ingredient?: string
		maxTotalTimeMinutes?: number
		page: number
		limit: number
	}
): Promise<{ docs: RecipeDocument[]; total: number }> {
	const userMatch: Record<string, unknown> = { $or: [{ userId }, { userId: null }] }
	const andParts: Record<string, unknown>[] = [userMatch]

	const search = filters.search?.trim()
	if (search) {
		const rx = new RegExp(escapeRegex(search), 'i')
		andParts.push({ $or: [{ name: rx }, { 'ingredients.name': rx }] })
	}

	const ingredient = filters.ingredient?.trim()
	if (ingredient) {
		andParts.push({ 'ingredients.name': { $regex: escapeRegex(ingredient), $options: 'i' } })
	}

	const tag = filters.tag?.trim()
	if (tag) {
		andParts.push({ tags: new RegExp(`^${escapeRegex(tag)}$`, 'i') })
	}

	if (filters.maxTotalTimeMinutes != null && filters.maxTotalTimeMinutes > 0) {
		andParts.push({
			$expr: {
				$lte: [{ $add: ['$prepTime', '$cookTime'] }, filters.maxTotalTimeMinutes]
			}
		})
	}

	const query: Record<string, unknown> = andParts.length === 1 ? andParts[0] : { $and: andParts }

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

export async function findRecipeVariants(variantGroupId: string, userId: string): Promise<RecipeDocument[]> {
	return Recipe.find({
		variantGroupId,
		$or: [{ userId }, { userId: null }]
	})
		.sort({ isVariantPrimary: -1, createdAt: 1 })
		.exec()
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

export async function findAllGroceryListsForUser(userId: string): Promise<GroceryListDocument[]> {
	return GroceryList.find({ userId }).sort({ updatedAt: -1 }).exec()
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

export async function deleteGroceryList(id: string, userId: string): Promise<boolean> {
	if (!mongoose.isValidObjectId(id)) return false
	const result = await GroceryList.findOneAndDelete({ _id: id, userId }).exec()
	return result !== null
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
