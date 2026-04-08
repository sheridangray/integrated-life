import { AppError } from '../../lib/errors'
import { logger } from '../../lib/logger'
import * as anthropic from '../../integrations/anthropic'
import * as repo from './repository'
import type { PaginatedResult } from './types'

const PANTRY_STAPLES = new Set([
	'kosher salt',
	'salt',
	'black pepper',
	'pepper',
	'olive oil',
	'extra virgin olive oil',
	'neutral oil',
	'vegetable oil',
	'canola oil',
	'butter',
	'unsalted butter',
	'garlic',
	'soy sauce',
	'fish sauce',
	'jasmine rice',
	'rice',
	'cumin',
	'ground cumin',
	'paprika',
	'smoked paprika',
	'oregano',
	'dried oregano',
	'thyme',
	'dried thyme',
	'bay leaves',
	'bay leaf',
	'cinnamon',
	'ground cinnamon',
	'chili powder',
	'turmeric',
	'ground turmeric',
	'coriander',
	'ground coriander',
	'red pepper flakes',
	'crushed red pepper'
])

const COSTCO_CATEGORIES = new Set(['meat', 'seafood', 'produce'])

function isPantryStaple(name: string): boolean {
	return PANTRY_STAPLES.has(name.toLowerCase().trim())
}

function assignStore(category: string): 'costco' | 'safeway' | 'other' {
	return COSTCO_CATEGORIES.has(category.toLowerCase()) ? 'costco' : 'safeway'
}

function formatRecipe(doc: Record<string, unknown>) {
	const d = doc as Record<string, unknown> & { _id: { toString(): string } }
	return {
		id: d._id.toString(),
		userId: String(d.userId),
		name: d.name,
		description: d.description ?? null,
		servings: d.servings,
		prepTime: d.prepTime,
		cookTime: d.cookTime,
		ingredients: d.ingredients,
		instructions: d.instructions,
		tags: d.tags,
		nutritionPerServing: d.nutritionPerServing
	}
}

function formatMealPlan(doc: Record<string, unknown>) {
	const d = doc as Record<string, unknown> & {
		_id: { toString(): string }
		meals: Array<Record<string, unknown> & { recipeId: { toString(): string }; scheduledDate: Date }>
	}
	return {
		id: d._id.toString(),
		userId: String(d.userId),
		weekStartDate: d.weekStartDate instanceof Date ? d.weekStartDate.toISOString() : String(d.weekStartDate),
		meals: d.meals.map((m) => ({
			recipeId: m.recipeId.toString(),
			scheduledDate: m.scheduledDate instanceof Date ? m.scheduledDate.toISOString() : String(m.scheduledDate),
			mealType: m.mealType,
			servings: m.servings
		})),
		status: d.status
	}
}

function formatGroceryList(doc: Record<string, unknown>) {
	const d = doc as Record<string, unknown> & { _id: { toString(): string } }
	return {
		id: d._id.toString(),
		userId: String(d.userId),
		mealPlanId: String(d.mealPlanId),
		items: d.items,
		status: d.status
	}
}

function formatFoodLogEntry(doc: Record<string, unknown>) {
	const d = doc as Record<string, unknown> & {
		_id: { toString(): string }
		date: Date
	}
	return {
		id: d._id.toString(),
		userId: String(d.userId),
		date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date),
		mealType: d.mealType,
		source: d.source,
		food: d.food,
		servingSize: d.servingSize,
		servings: d.servings,
		notes: d.notes ?? null
	}
}

export async function listRecipes(
	userId: string,
	filters: { search?: string; tag?: string; ingredient?: string; page: number; limit: number }
): Promise<PaginatedResult<ReturnType<typeof formatRecipe>>> {
	const { docs, total } = await repo.findRecipes(userId, filters)
	return {
		items: docs.map((d) => formatRecipe(d.toObject())),
		total,
		page: filters.page,
		limit: filters.limit,
		totalPages: Math.ceil(total / filters.limit)
	}
}

export async function getRecipe(id: string, userId: string) {
	const doc = await repo.findRecipeById(id, userId)
	if (!doc) throw new AppError('Recipe not found', 404)
	return formatRecipe(doc.toObject())
}

export async function createRecipe(userId: string, data: Record<string, unknown>) {
	const doc = await repo.createRecipe(userId, data)
	return formatRecipe(doc.toObject())
}

export async function updateRecipe(id: string, userId: string, data: Record<string, unknown>) {
	const doc = await repo.updateRecipe(id, userId, data)
	if (!doc) throw new AppError('Recipe not found', 404)
	return formatRecipe(doc.toObject())
}

export async function deleteRecipe(id: string, userId: string) {
	const deleted = await repo.deleteRecipe(id, userId)
	if (!deleted) throw new AppError('Recipe not found', 404)
}

export async function listMealPlans(
	userId: string,
	filters: { weekStartDate?: string; status?: string; page: number; limit: number }
): Promise<PaginatedResult<ReturnType<typeof formatMealPlan>>> {
	const { docs, total } = await repo.findMealPlans(userId, filters)
	return {
		items: docs.map((d) => formatMealPlan(d.toObject())),
		total,
		page: filters.page,
		limit: filters.limit,
		totalPages: Math.ceil(total / filters.limit)
	}
}

export async function getCurrentMealPlan(userId: string) {
	const doc = await repo.findCurrentMealPlan(userId)
	if (!doc) throw new AppError('No current meal plan found', 404)
	return formatMealPlan(doc.toObject())
}

export async function getMealPlan(id: string, userId: string) {
	const doc = await repo.findMealPlanById(id, userId)
	if (!doc) throw new AppError('Meal plan not found', 404)
	return formatMealPlan(doc.toObject())
}

export async function createMealPlan(userId: string, data: Record<string, unknown>) {
	const doc = await repo.createMealPlan(userId, data)
	return formatMealPlan(doc.toObject())
}

export async function updateMealPlan(id: string, userId: string, data: Record<string, unknown>) {
	const doc = await repo.updateMealPlan(id, userId, data)
	if (!doc) throw new AppError('Meal plan not found', 404)
	return formatMealPlan(doc.toObject())
}

export async function deleteMealPlan(id: string, userId: string) {
	const deleted = await repo.deleteMealPlan(id, userId)
	if (!deleted) throw new AppError('Meal plan not found', 404)
}

export async function listGroceryLists(
	userId: string,
	filters: { page: number; limit: number }
): Promise<PaginatedResult<ReturnType<typeof formatGroceryList>>> {
	const { docs, total } = await repo.findGroceryLists(userId, filters)
	return {
		items: docs.map((d) => formatGroceryList(d.toObject())),
		total,
		page: filters.page,
		limit: filters.limit,
		totalPages: Math.ceil(total / filters.limit)
	}
}

export async function getGroceryList(id: string, userId: string) {
	const doc = await repo.findGroceryListById(id, userId)
	if (!doc) throw new AppError('Grocery list not found', 404)
	return formatGroceryList(doc.toObject())
}

export async function generateGroceryList(mealPlanId: string, userId: string) {
	const mealPlan = await repo.findMealPlanById(mealPlanId, userId)
	if (!mealPlan) throw new AppError('Meal plan not found', 404)

	const recipeIds = [...new Set(mealPlan.meals.map((m) => m.recipeId.toString()))]
	const recipes = await repo.findRecipesByIds(recipeIds)
	const recipeMap = new Map(recipes.map((r) => [r._id.toString(), r]))

	const aggregated = new Map<string, { quantity: number; unit: string; category: string }>()

	for (const meal of mealPlan.meals) {
		const recipe = recipeMap.get(meal.recipeId.toString())
		if (!recipe) continue

		for (const ingredient of recipe.ingredients) {
			if (isPantryStaple(ingredient.name)) continue

			const key = ingredient.name.toLowerCase().trim()
			const existing = aggregated.get(key)

			if (existing && existing.unit === ingredient.unit) {
				existing.quantity += ingredient.quantity * meal.servings
			} else if (!existing) {
				aggregated.set(key, {
					quantity: ingredient.quantity * meal.servings,
					unit: ingredient.unit,
					category: ingredient.category
				})
			} else {
				const altKey = `${key} (${ingredient.unit})`
				aggregated.set(altKey, {
					quantity: ingredient.quantity * meal.servings,
					unit: ingredient.unit,
					category: ingredient.category
				})
			}
		}
	}

	const items = Array.from(aggregated.entries()).map(([name, info]) => ({
		ingredient: {
			name: name.charAt(0).toUpperCase() + name.slice(1),
			quantity: Math.round(info.quantity * 100) / 100,
			unit: info.unit,
			category: info.category
		},
		store: assignStore(info.category),
		checked: false
	}))

	const doc = await repo.createGroceryList(userId, {
		mealPlanId,
		items,
		status: 'draft'
	})

	return formatGroceryList(doc.toObject())
}

export async function updateGroceryList(id: string, userId: string, data: Record<string, unknown>) {
	const doc = await repo.updateGroceryList(id, userId, data)
	if (!doc) throw new AppError('Grocery list not found', 404)
	return formatGroceryList(doc.toObject())
}

export async function initiateShopping(id: string, userId: string) {
	const doc = await repo.findGroceryListById(id, userId)
	if (!doc) throw new AppError('Grocery list not found', 404)

	const costcoItems = doc.items.filter((i) => i.store === 'costco')
	const safewayItems = doc.items.filter((i) => i.store === 'safeway')

	await repo.updateGroceryList(id, userId, { status: 'ordered' })

	return {
		groceryListId: doc._id.toString(),
		status: 'initiated',
		stores: {
			costco: {
				items: costcoItems.map((i) => ({
					name: i.ingredient.name,
					quantity: i.ingredient.quantity,
					unit: i.ingredient.unit,
					notes: i.notes ?? null
				})),
				count: costcoItems.length
			},
			safeway: {
				items: safewayItems.map((i) => ({
					name: i.ingredient.name,
					quantity: i.ingredient.quantity,
					unit: i.ingredient.unit,
					notes: i.notes ?? null
				})),
				count: safewayItems.length
			}
		}
	}
}

export async function listFoodLog(
	userId: string,
	filters: { startDate?: string; endDate?: string; mealType?: string; page: number; limit: number }
): Promise<PaginatedResult<ReturnType<typeof formatFoodLogEntry>>> {
	const { docs, total } = await repo.findFoodLogEntries(userId, filters)
	return {
		items: docs.map((d) => formatFoodLogEntry(d.toObject())),
		total,
		page: filters.page,
		limit: filters.limit,
		totalPages: Math.ceil(total / filters.limit)
	}
}

export async function getFoodLogEntry(id: string, userId: string) {
	const doc = await repo.findFoodLogById(id, userId)
	if (!doc) throw new AppError('Food log entry not found', 404)
	return formatFoodLogEntry(doc.toObject())
}

export async function createFoodLog(userId: string, data: Record<string, unknown>) {
	const doc = await repo.createFoodLogEntry(userId, { ...data, source: 'manual' })
	return formatFoodLogEntry(doc.toObject())
}

export async function updateFoodLog(id: string, userId: string, data: Record<string, unknown>) {
	const doc = await repo.updateFoodLogEntry(id, userId, data)
	if (!doc) throw new AppError('Food log entry not found', 404)
	return formatFoodLogEntry(doc.toObject())
}

export async function deleteFoodLog(id: string, userId: string) {
	const deleted = await repo.deleteFoodLogEntry(id, userId)
	if (!deleted) throw new AppError('Food log entry not found', 404)
}

export async function lookupBarcode(barcode: string, userId: string, mealType?: string) {
	const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`

	let response: Response
	try {
		response = await fetch(url, {
			headers: { 'User-Agent': 'IntegratedLife/1.0 (github.com/sheridangray/integrated-life)' }
		})
	} catch (err) {
		logger.error('Open Food Facts API request failed', { error: (err as Error).message, barcode })
		throw new AppError('Failed to lookup barcode', 502)
	}

	const data = (await response.json()) as {
		status: number
		product?: {
			product_name?: string
			brands?: string
			nutriments?: {
				'energy-kcal_100g'?: number
				proteins_100g?: number
				carbohydrates_100g?: number
				fat_100g?: number
				fiber_100g?: number
			}
			serving_size?: string
		}
	}

	if (data.status !== 1 || !data.product) {
		throw new AppError('Product not found for barcode', 404)
	}

	const product = data.product
	const nutriments = product.nutriments ?? {}

	const entry = await repo.createFoodLogEntry(userId, {
		date: new Date(),
		mealType: mealType ?? 'snack',
		source: 'barcode',
		food: {
			name: product.product_name ?? 'Unknown product',
			brand: product.brands ?? undefined,
			nutrition: {
				calories: nutriments['energy-kcal_100g'] ?? 0,
				protein: nutriments.proteins_100g ?? 0,
				carbs: nutriments.carbohydrates_100g ?? 0,
				fat: nutriments.fat_100g ?? 0,
				fiber: nutriments.fiber_100g ?? 0
			}
		},
		servingSize: product.serving_size ?? '100g',
		servings: 1
	})

	return formatFoodLogEntry(entry.toObject())
}

export async function scanPhoto(imageBuffer: Buffer, mimeType: string, userId: string, mealType?: string) {
	const base64 = imageBuffer.toString('base64')
	const result = await anthropic.analyzeImage(base64, mimeType)

	if (!result) {
		throw new AppError('Photo analysis unavailable', 503)
	}

	const entry = await repo.createFoodLogEntry(userId, {
		date: new Date(),
		mealType: mealType ?? 'snack',
		source: 'photo',
		food: {
			name: result.name,
			nutrition: result.nutrition
		},
		servingSize: result.servingSize,
		servings: 1
	})

	return formatFoodLogEntry(entry.toObject())
}

export async function getDailyNutrition(userId: string, date: string) {
	const entries = await repo.findFoodLogByDate(userId, date)

	const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }

	for (const entry of entries) {
		const n = entry.food.nutrition
		const s = entry.servings
		totals.calories += n.calories * s
		totals.protein += n.protein * s
		totals.carbs += n.carbs * s
		totals.fat += n.fat * s
		totals.fiber += n.fiber * s
	}

	totals.calories = Math.round(totals.calories)
	totals.protein = Math.round(totals.protein * 10) / 10
	totals.carbs = Math.round(totals.carbs * 10) / 10
	totals.fat = Math.round(totals.fat * 10) / 10
	totals.fiber = Math.round(totals.fiber * 10) / 10

	return {
		date,
		totals,
		entries: entries.map((d) => formatFoodLogEntry(d.toObject()))
	}
}
