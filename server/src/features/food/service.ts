import Anthropic from '@anthropic-ai/sdk'
import { AppError } from '../../lib/errors'
import { logger } from '../../lib/logger'
import { env } from '../../config'
import * as anthropic from '../../integrations/anthropic'
import * as imageGen from '../../services/imageGeneration'
import * as storage from '../../services/storage'
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
		imageUrl: d.imageUrl ?? null,
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
			nutriments?: Record<string, number | undefined>
			serving_size?: string
		}
	}

	if (data.status !== 1 || !data.product) {
		throw new AppError('Product not found for barcode', 404)
	}

	const product = data.product
	const nm = product.nutriments ?? {}

	const entry = await repo.createFoodLogEntry(userId, {
		date: new Date(),
		mealType: mealType ?? 'snack',
		source: 'barcode',
		food: {
			name: product.product_name ?? 'Unknown product',
			brand: product.brands ?? undefined,
			nutrition: {
				calories: nm['energy-kcal_100g'] ?? 0,
				protein: nm.proteins_100g ?? 0,
				carbs: nm.carbohydrates_100g ?? 0,
				fat: nm.fat_100g ?? 0,
				fiber: nm.fiber_100g ?? 0,
				sugar: nm.sugars_100g ?? 0,
				saturatedFat: nm['saturated-fat_100g'] ?? 0,
				monounsaturatedFat: nm['monounsaturated-fat_100g'] ?? 0,
				polyunsaturatedFat: nm['polyunsaturated-fat_100g'] ?? 0,
				cholesterol: nm.cholesterol_100g ?? 0,
				transFat: nm['trans-fat_100g'] ?? 0,
				vitaminA: nm['vitamin-a_100g'] ?? 0,
				vitaminB6: nm['vitamin-b6_100g'] ?? 0,
				vitaminB12: nm['vitamin-b12_100g'] ?? 0,
				vitaminC: nm['vitamin-c_100g'] ?? 0,
				vitaminD: nm['vitamin-d_100g'] ?? 0,
				vitaminE: nm['vitamin-e_100g'] ?? 0,
				vitaminK: nm['vitamin-k_100g'] ?? 0,
				thiamin: nm['vitamin-b1_100g'] ?? 0,
				riboflavin: nm['vitamin-b2_100g'] ?? 0,
				niacin: nm['vitamin-pp_100g'] ?? 0,
				folate: nm['vitamin-b9_100g'] ?? 0,
				pantothenicAcid: nm['pantothenic-acid_100g'] ?? 0,
				biotin: nm.biotin_100g ?? 0,
				calcium: nm.calcium_100g ?? 0,
				iron: nm.iron_100g ?? 0,
				magnesium: nm.magnesium_100g ?? 0,
				manganese: nm.manganese_100g ?? 0,
				phosphorus: nm.phosphorus_100g ?? 0,
				potassium: nm.potassium_100g ?? 0,
				zinc: nm.zinc_100g ?? 0,
				selenium: nm.selenium_100g ?? 0,
				copper: nm.copper_100g ?? 0,
				chromium: nm.chromium_100g ?? 0,
				molybdenum: nm.molybdenum_100g ?? 0,
				chloride: nm.chloride_100g ?? 0,
				iodine: nm.iodine_100g ?? 0,
				sodium: nm.sodium_100g ?? 0,
				caffeine: nm.caffeine_100g ?? 0
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

	const nutritionKeys = [
		'calories', 'protein', 'carbs', 'fat', 'fiber',
		'sugar', 'water',
		'saturatedFat', 'monounsaturatedFat', 'polyunsaturatedFat', 'cholesterol', 'transFat',
		'vitaminA', 'vitaminB6', 'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
		'thiamin', 'riboflavin', 'niacin', 'folate', 'pantothenicAcid', 'biotin',
		'calcium', 'iron', 'magnesium', 'manganese', 'phosphorus', 'potassium',
		'zinc', 'selenium', 'copper', 'chromium', 'molybdenum', 'chloride', 'iodine',
		'sodium', 'caffeine'
	] as const

	const totals = Object.fromEntries(nutritionKeys.map((k) => [k, 0])) as Record<(typeof nutritionKeys)[number], number>

	for (const entry of entries) {
		const n = entry.food.nutrition as Record<string, number | undefined>
		const s = entry.servings
		for (const key of nutritionKeys) {
			totals[key] += (n[key] ?? 0) * s
		}
	}

	totals.calories = Math.round(totals.calories)
	for (const key of nutritionKeys) {
		if (key !== 'calories') {
			totals[key] = Math.round(totals[key] * 10) / 10
		}
	}

	return {
		date,
		totals,
		entries: entries.map((d) => formatFoodLogEntry(d.toObject()))
	}
}

const AI_RECIPE_SYSTEM_PROMPT = `You are a recipe assistant. Parse user requests and return valid JSON for recipe creation.

Schema:
{
  "name": string,
  "description": string,
  "servings": number,
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "ingredients": [{ "name": string, "quantity": number, "unit": string, "category": string }],
  "instructions": string[],
  "tags": string[],
  "nutritionPerServing": { "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number }
}

Valid ingredient categories: produce, meat, seafood, dairy, bakery, pantry, frozen, beverages, other.
Valid tags include: quick, kid-friendly, healthy, weeknight, weekend, asian, mediterranean, american, mexican, italian, vegetarian, low-carb, comfort, breakfast, seafood.

When user says "add a recipe for X", create complete recipe JSON.
When user says "make it vegetarian", modify the recipe to be vegetarian.
When user says "double the servings", scale quantities accordingly.

Respond with ONLY valid JSON, no markdown, no explanation.`

export async function createRecipeFromAI(prompt: string, userId: string) {
	if (!env.ANTHROPIC_API_KEY) {
		throw new AppError('AI recipe creation not available', 503)
	}

	const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

	let recipeData: Record<string, unknown>
	try {
		const response = await client.messages.create({
			model: 'claude-sonnet-4-6',
			max_tokens: 2048,
			messages: [
				{ role: 'user', content: prompt }
			],
			system: AI_RECIPE_SYSTEM_PROMPT
		})

		const textBlock = response.content.find((b) => b.type === 'text')
		if (!textBlock || textBlock.type !== 'text') {
			throw new AppError('AI returned no response', 502)
		}

		recipeData = JSON.parse(textBlock.text) as Record<string, unknown>
	} catch (err) {
		if (err instanceof AppError) throw err
		logger.error('AI recipe generation failed', { error: (err as Error).message })
		throw new AppError('Failed to generate recipe from AI', 502)
	}

	// Generate image for the recipe
	let imageUrl: string | undefined
	let imageId: string | undefined
	try {
		const imageBuffer = await imageGen.generateRecipeImage(
			recipeData.name as string,
			recipeData.description as string | undefined
		)
		if (imageBuffer) {
			imageId = `recipes/${Date.now()}-${(recipeData.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
			imageUrl = await storage.uploadImage(imageBuffer, imageId, 'image/png')
		}
	} catch (err) {
		logger.warn('Failed to generate/upload recipe image, continuing without image', {
			error: (err as Error).message
		})
	}

	const doc = await repo.createRecipe(userId, {
		...recipeData,
		...(imageUrl && { imageUrl }),
		...(imageId && { imageId })
	})

	return formatRecipe(doc.toObject())
}

export async function getMealPlanCookTime(mealPlanId: string, userId: string) {
	const mealPlan = await repo.findMealPlanById(mealPlanId, userId)
	if (!mealPlan) throw new AppError('Meal plan not found', 404)

	const recipeIds = [...new Set(mealPlan.meals.map(m => m.recipeId.toString()))]
	const recipes = await repo.findRecipesByIds(recipeIds)
	const recipeMap = new Map(recipes.map(r => [r._id.toString(), r]))

	const byDay = new Map<string, { minutes: number; meals: number }>()

	for (const meal of mealPlan.meals) {
		const recipe = recipeMap.get(meal.recipeId.toString())
		if (!recipe) continue
		const cookTime = recipe.cookTime + recipe.prepTime
		const date = meal.scheduledDate instanceof Date
			? meal.scheduledDate.toISOString().split('T')[0]
			: String(meal.scheduledDate).split('T')[0]
		const existing = byDay.get(date) ?? { minutes: 0, meals: 0 }
		existing.minutes += cookTime
		existing.meals += 1
		byDay.set(date, existing)
	}

	return {
		totalMinutes: Array.from(byDay.values()).reduce((sum, d) => sum + d.minutes, 0),
		byDay: Array.from(byDay.entries())
			.map(([date, data]) => ({ date, ...data }))
			.sort((a, b) => a.date.localeCompare(b.date))
	}
}
