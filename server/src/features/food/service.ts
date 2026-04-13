import crypto from 'crypto'
import Together from 'together-ai'
import { AppError } from '../../lib/errors'
import { logger } from '../../lib/logger'
import { env } from '../../config'
import * as anthropic from '../../integrations/anthropic'
import * as imageGen from '../../services/imageGeneration'
import * as storage from '../../services/storage'
import * as repo from './repository'
import type { GroceryListDocument } from '../../models/GroceryList'
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

function isPantryStaple(name: string): boolean {
	return PANTRY_STAPLES.has(name.toLowerCase().trim())
}

function coerceRecipeImageId(value: unknown): string {
	if (typeof value === 'string') return value.trim()
	if (value == null) return ''
	const s = String(value).trim()
	return s === 'undefined' || s === 'null' ? '' : s
}

function formatRecipe(doc: Record<string, unknown>) {
	const d = doc as Record<string, unknown> & { _id: { toString(): string } }

	const rawImages =
		(d.images as Array<{ url?: string; caption?: string | null; order?: number }> | undefined) ?? []
	const imagesWithUrls = rawImages.filter(
		(img) => typeof img?.url === 'string' && img.url.trim().length > 0
	) as Array<{ url: string; caption?: string | null; order: number }>

	const legacyRaw = d.imageUrl
	const legacyUrl =
		typeof legacyRaw === 'string' && legacyRaw.trim().length > 0 ? legacyRaw.trim() : undefined

	let finalImages: Array<{ url: string; caption: string | null; order: number }> = []
	if (imagesWithUrls.length > 0) {
		finalImages = [...imagesWithUrls]
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
			.map((img) => ({
				url: img.url,
				caption: img.caption ?? null,
				order: img.order ?? 0
			}))
	} else if (legacyUrl) {
		finalImages = [{ url: legacyUrl, caption: null, order: 0 }]
	}

	const imageId = coerceRecipeImageId(d.imageId)
	if (finalImages.length === 0 && imageId) {
		const derived = storage.getPublicUrl(imageId)
		finalImages = [{ url: derived, caption: null, order: 0 }]
		logger.debug('formatRecipe: derived image URL from imageId', { imageId, derived })
	}

	const imageUrlOut = (legacyUrl ?? finalImages[0]?.url ?? null) as string | null

	return {
		id: d._id.toString(),
		userId: String(d.userId),
		name: d.name,
		description: d.description ?? null,
		imageUrl: imageUrlOut,
		imageId: imageId || null,
		images: finalImages,
		servings: d.servings,
		prepTime: d.prepTime,
		cookTime: d.cookTime,
		ingredients: d.ingredients,
		instructions: d.instructions,
		tags: d.tags,
		nutritionPerServing: d.nutritionPerServing,
		...(d.variantGroupId ? { variantGroupId: d.variantGroupId as string } : {}),
		...(d.isVariantPrimary ? { isVariantPrimary: d.isVariantPrimary as boolean } : {})
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
			servings: m.servings,
			recipeName: undefined as string | undefined,
			recipeImageUrl: undefined as string | undefined,
			caloriesPerServing: undefined as number | undefined,
			proteinPerServing: undefined as number | undefined,
			carbsPerServing: undefined as number | undefined,
			fatPerServing: undefined as number | undefined
		})),
		status: d.status
	}
}

type FormattedMealPlan = ReturnType<typeof formatMealPlan>

/** Bulk-fetch referenced recipes and attach name, image, and macro data to each meal. */
async function enrichMealPlan(plan: FormattedMealPlan): Promise<FormattedMealPlan> {
	if (plan.meals.length === 0) return plan
	const recipeIds = [...new Set(plan.meals.map((m) => m.recipeId))]
	const recipes = await repo.findRecipesByIds(recipeIds)
	const recipeMap = new Map(recipes.map((r) => [r._id.toString(), r]))

	return {
		...plan,
		meals: plan.meals.map((m) => {
			const recipe = recipeMap.get(m.recipeId)
			if (!recipe) return m
			const images = (recipe.images ?? []) as Array<{ url?: string }>
			const imageUrl = images.find((i) => i.url)?.url ?? (recipe.imageUrl as string | undefined)
			const nutrition = recipe.nutritionPerServing as Record<string, number> | undefined
			return {
				...m,
				recipeName: recipe.name,
				recipeImageUrl: imageUrl ?? undefined,
				caloriesPerServing: nutrition?.calories,
				proteinPerServing: nutrition?.protein,
				carbsPerServing: nutrition?.carbs,
				fatPerServing: nutrition?.fat
			}
		})
	}
}

function formatGroceryList(doc: Record<string, unknown>) {
	const d = doc as Record<string, unknown> & { _id: { toString(): string } }
	return {
		id: d._id.toString(),
		userId: String(d.userId),
		mealPlanId: d.mealPlanId != null && d.mealPlanId !== '' ? String(d.mealPlanId) : null,
		items: d.items,
		status: d.status
	}
}

type GroceryItemPlain = {
	ingredient: { name: string; quantity: number; unit: string; category: string }
	checked: boolean
	notes?: string
}

function mergeGroceryItemLists(existing: GroceryItemPlain[], incoming: GroceryItemPlain[]): GroceryItemPlain[] {
	const map = new Map<string, GroceryItemPlain>()
	const keyOf = (i: GroceryItemPlain) => `${i.ingredient.name.toLowerCase().trim()}|${i.ingredient.unit}`

	for (const item of existing) {
		map.set(keyOf(item), {
			ingredient: { ...item.ingredient },
			checked: item.checked,
			notes: item.notes
		})
	}
	for (const item of incoming) {
		const k = keyOf(item)
		const cur = map.get(k)
		if (cur) {
			cur.ingredient.quantity = Math.round((cur.ingredient.quantity + item.ingredient.quantity) * 100) / 100
		} else {
			map.set(k, {
				ingredient: { ...item.ingredient },
				checked: item.checked,
				notes: item.notes
			})
		}
	}
	return Array.from(map.values())
}

function grocerySubdocsToPlain(
	items: Array<{
		ingredient: { name: string; quantity: number; unit: string; category: string }
		checked: boolean
		notes?: string
	}>
): GroceryItemPlain[] {
	return items.map((i) => ({
		ingredient: {
			name: i.ingredient.name,
			quantity: i.ingredient.quantity,
			unit: i.ingredient.unit,
			category: i.ingredient.category
		},
		checked: i.checked,
		notes: i.notes
	}))
}

async function consolidateUserGroceryLists(userId: string): Promise<void> {
	const docs = await repo.findAllGroceryListsForUser(userId)
	if (docs.length <= 1) return

	const primary = docs[0]
	const chronological = [...docs].reverse()
	let merged: GroceryItemPlain[] = []
	for (const d of chronological) {
		merged = mergeGroceryItemLists(merged, grocerySubdocsToPlain(d.items))
	}

	const updated = await repo.updateGroceryList(primary._id.toString(), userId, {
		items: merged,
		status: 'draft'
	})
	if (!updated) return

	for (let i = 1; i < docs.length; i++) {
		await repo.deleteGroceryList(docs[i]._id.toString(), userId)
	}
}

/** One consolidated grocery list per user (merges legacy duplicates on read/write). */
async function ensureEvergreenGroceryList(userId: string): Promise<GroceryListDocument> {
	await consolidateUserGroceryLists(userId)
	const docs = await repo.findAllGroceryListsForUser(userId)
	if (docs.length === 0) {
		return repo.createGroceryList(userId, { items: [], status: 'draft' })
	}
	return docs[0]
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

function deduplicateVariants(docs: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
	const seen = new Map<string, Record<string, unknown>>()
	const result: Array<Record<string, unknown>> = []

	for (const doc of docs) {
		const groupId = doc.variantGroupId as string | undefined
		if (!groupId) {
			result.push(doc)
			continue
		}
		if (seen.has(groupId)) {
			const existing = seen.get(groupId)!
			if (doc.isVariantPrimary && !existing.isVariantPrimary) {
				const idx = result.indexOf(existing)
				if (idx !== -1) result[idx] = doc
				seen.set(groupId, doc)
			}
			continue
		}
		seen.set(groupId, doc)
		result.push(doc)
	}

	return result
}

export async function listRecipes(
	userId: string,
	filters: {
		search?: string
		tag?: string
		ingredient?: string
		maxTotalTimeMinutes?: number
		page: number
		limit: number
	}
): Promise<PaginatedResult<ReturnType<typeof formatRecipe>>> {
	const { docs, total } = await repo.findRecipes(userId, filters)
	const objects = docs.map((d) => d.toObject())
	const deduplicated = deduplicateVariants(objects)
	return {
		items: deduplicated.map((d) => formatRecipe(d)),
		total,
		page: filters.page,
		limit: filters.limit,
		totalPages: Math.ceil(total / filters.limit)
	}
}

export async function listRecipeTags(userId: string): Promise<string[]> {
	return repo.distinctRecipeTags(userId)
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
): Promise<PaginatedResult<FormattedMealPlan>> {
	const { docs, total } = await repo.findMealPlans(userId, filters)
	const items = await Promise.all(docs.map(async (d) => enrichMealPlan(formatMealPlan(d.toObject()))))
	return { items, total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) }
}

export async function getCurrentMealPlan(userId: string) {
	const doc = await repo.findCurrentMealPlan(userId)
	if (!doc) throw new AppError('No current meal plan found', 404)
	return enrichMealPlan(formatMealPlan(doc.toObject()))
}

export async function getMealPlan(id: string, userId: string) {
	const doc = await repo.findMealPlanById(id, userId)
	if (!doc) throw new AppError('Meal plan not found', 404)
	return enrichMealPlan(formatMealPlan(doc.toObject()))
}

export async function createMealPlan(userId: string, data: Record<string, unknown>) {
	try {
		const doc = await repo.createMealPlan(userId, data)
		return enrichMealPlan(formatMealPlan(doc.toObject()))
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
			throw new AppError('A meal plan already exists for this week', 409)
		}
		throw err
	}
}

export async function updateMealPlan(id: string, userId: string, data: Record<string, unknown>) {
	const doc = await repo.updateMealPlan(id, userId, data)
	if (!doc) throw new AppError('Meal plan not found', 404)
	return enrichMealPlan(formatMealPlan(doc.toObject()))
}

export async function deleteMealPlan(id: string, userId: string) {
	const deleted = await repo.deleteMealPlan(id, userId)
	if (!deleted) throw new AppError('Meal plan not found', 404)
}

export async function listGroceryLists(
	userId: string,
	filters: { page: number; limit: number }
): Promise<PaginatedResult<ReturnType<typeof formatGroceryList>>> {
	const doc = await ensureEvergreenGroceryList(userId)
	return {
		items: [formatGroceryList(doc.toObject())],
		total: 1,
		page: filters.page,
		limit: filters.limit,
		totalPages: 1
	}
}

export async function getGroceryList(id: string, userId: string) {
	await ensureEvergreenGroceryList(userId)
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

	const newItems: GroceryItemPlain[] = Array.from(aggregated.entries()).map(([name, info]) => ({
		ingredient: {
			name: name.charAt(0).toUpperCase() + name.slice(1),
			quantity: Math.round(info.quantity * 100) / 100,
			unit: info.unit,
			category: info.category
		},
		checked: false
	}))

	const list = await ensureEvergreenGroceryList(userId)
	const existing = grocerySubdocsToPlain(list.items)
	const merged = mergeGroceryItemLists(existing, newItems)
	const updated = await repo.updateGroceryList(list._id.toString(), userId, {
		items: merged,
		status: 'draft'
	})
	if (!updated) throw new AppError('Grocery list not found', 404)

	return formatGroceryList(updated.toObject())
}

export async function addItemsToGroceryList(
	userId: string,
	items: Array<{ name: string; quantity: number; unit: string; category: string }>
) {
	const newSubdocs: GroceryItemPlain[] = items.map((ing) => ({
		ingredient: {
			name: ing.name,
			quantity: Math.round(ing.quantity * 100) / 100,
			unit: ing.unit,
			category: ing.category
		},
		checked: false
	}))

	const list = await ensureEvergreenGroceryList(userId)
	const existing = grocerySubdocsToPlain(list.items)
	const merged = mergeGroceryItemLists(existing, newSubdocs)
	const updated = await repo.updateGroceryList(list._id.toString(), userId, {
		items: merged,
		status: 'draft'
	})
	if (!updated) throw new AppError('Grocery list not found', 404)
	return formatGroceryList(updated.toObject())
}

export async function updateGroceryList(id: string, userId: string, data: Record<string, unknown>) {
	await ensureEvergreenGroceryList(userId)
	const doc = await repo.updateGroceryList(id, userId, data)
	if (!doc) throw new AppError('Grocery list not found', 404)
	return formatGroceryList(doc.toObject())
}

export async function initiateShopping(id: string, userId: string, customInstructions?: string) {
	await ensureEvergreenGroceryList(userId)
	const doc = await repo.findGroceryListById(id, userId)
	if (!doc) throw new AppError('Grocery list not found', 404)

	const uncheckedItems = doc.items.filter((i) => !i.checked)
	if (uncheckedItems.length === 0) throw new AppError('No unchecked items to order', 400)

	const itemLines = uncheckedItems.map((i) => {
		const qty = i.ingredient.quantity % 1 === 0 ? String(Math.round(i.ingredient.quantity)) : String(i.ingredient.quantity)
		const line = `- ${qty} ${i.ingredient.unit} ${i.ingredient.name}`
		return i.notes ? `${line} (${i.notes})` : line
	})

	const prompt = [
		'Shop for this week\'s meal plan on Instacart.',
		'',
		'GROCERY LIST:',
		...itemLines,
		'',
		customInstructions ?? ''
	].join('\n').trim()

	await repo.updateGroceryList(id, userId, { status: 'ordered' })

	if (env.OPENCLAW_WEBHOOK_URL && env.OPENCLAW_HOOKS_TOKEN) {
		try {
			const res = await fetch(env.OPENCLAW_WEBHOOK_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${env.OPENCLAW_HOOKS_TOKEN}`
				},
				body: JSON.stringify({
					message: prompt,
					name: 'Instacart Order',
					deliver: 'announce',
					channel: 'slack',
					to: 'user:U0ALXGJEY4Q'
				})
			})
			logger.info(`OpenClaw webhook responded ${res.status}`)
		} catch (err) {
			logger.error('OpenClaw webhook failed', err)
		}
	} else {
		logger.warn('OpenClaw webhook not configured — skipping')
	}

	return {
		groceryListId: doc._id.toString(),
		status: 'initiated',
		itemCount: uncheckedItems.length
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
  "description": string (1 sentence),
  "servings": number,
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "ingredients": [{ "name": string, "quantity": number, "unit": string, "category": string }],
  "instructions": string[],
  "tags": string[],
  "nutritionPerServing": {
    "calories": number, "protein": number (g), "carbs": number (g), "fat": number (g), "fiber": number (g),
    "sugar": number (g), "water": number (mL),
    "saturatedFat": number (g), "monounsaturatedFat": number (g), "polyunsaturatedFat": number (g),
    "cholesterol": number (mg), "transFat": number (g),
    "vitaminA": number (mcg), "vitaminB6": number (mg), "vitaminB12": number (mcg),
    "vitaminC": number (mg), "vitaminD": number (mcg), "vitaminE": number (mg), "vitaminK": number (mcg),
    "thiamin": number (mg), "riboflavin": number (mg), "niacin": number (mg),
    "folate": number (mcg), "pantothenicAcid": number (mg), "biotin": number (mcg),
    "calcium": number (mg), "iron": number (mg), "magnesium": number (mg), "manganese": number (mg),
    "phosphorus": number (mg), "potassium": number (mg), "zinc": number (mg), "selenium": number (mcg),
    "copper": number (mg), "chromium": number (mcg), "molybdenum": number (mcg),
    "chloride": number (mg), "iodine": number (mcg), "sodium": number (mg), "caffeine": number (mg)
  }
}

All nutritionPerServing fields are REQUIRED — estimate realistic values based on the ingredients.
Valid ingredient categories: produce, meat, seafood, dairy, bakery, pantry, frozen, beverages, other.
Valid tags include: quick, kid-friendly, healthy, weeknight, weekend, asian, mediterranean, american, mexican, italian, vegetarian, low-carb, comfort, breakfast, seafood.

Respond with ONLY valid JSON, no markdown, no explanation.`

const IMAGE_ANGLE_PROMPTS = [
	'overhead shot, top-down view',
	'45-degree angle, three-quarter view',
	'close-up detail shot, macro perspective',
	'side view, eye-level angle'
]

async function generateRecipeImages(
	recipeName: string,
	description?: string
): Promise<{ images: Array<{ url: string; caption: string | null; order: number }>; imageUrl?: string; imageId?: string }> {
	const slug = recipeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
	const ts = Date.now()

	const results = await Promise.allSettled(
		IMAGE_ANGLE_PROMPTS.map(async (anglePrompt, idx) => {
			const buffer = await imageGen.generateRecipeImage(recipeName, description, anglePrompt)
			if (!buffer) return null
			const key = `recipes/${ts}-${slug}-${idx}.png`
			const url = await storage.uploadImage(buffer, key, 'image/png')
			return { url, key, caption: null as string | null, order: idx }
		})
	)

	const images: Array<{ url: string; caption: string | null; order: number }> = []
	let imageUrl: string | undefined
	let imageId: string | undefined

	for (const result of results) {
		if (result.status === 'fulfilled' && result.value) {
			images.push({ url: result.value.url, caption: result.value.caption, order: result.value.order })
			if (!imageUrl) {
				imageUrl = result.value.url
				imageId = result.value.key
			}
		}
	}

	return { images, imageUrl, imageId }
}

function getTogetherClient(): Together {
	if (!env.TOGETHER_AI_API_KEY) {
		throw new AppError('AI features not available — TOGETHER_AI_API_KEY is not configured', 503)
	}
	return new Together({ apiKey: env.TOGETHER_AI_API_KEY })
}

async function generateRecipeJSON(systemPrompt: string, userMessage: string): Promise<Record<string, unknown>> {
	const client = getTogetherClient()
	const maxAttempts = 2

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		let rawText = ''
		try {
			const response = await client.chat.completions.create({
				model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
				max_tokens: 4096,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userMessage }
				],
				response_format: { type: 'json_object' }
			})

			rawText = response.choices?.[0]?.message?.content ?? ''
			if (!rawText) {
				throw new Error('AI returned empty response')
			}

			return JSON.parse(rawText) as Record<string, unknown>
		} catch (err) {
			const msg = (err as Error).message
			logger.warn(`AI recipe attempt ${attempt}/${maxAttempts} failed`, {
				error: msg,
				responsePreview: rawText.slice(0, 300) || '<empty>'
			})
			if (attempt === maxAttempts) {
				throw new AppError(`AI recipe generation failed: ${msg}`, 502)
			}
		}
	}

	throw new AppError('AI recipe generation failed after retries', 502)
}

export async function createRecipeFromAI(prompt: string, userId: string) {
	const recipeData = await generateRecipeJSON(AI_RECIPE_SYSTEM_PROMPT, prompt)

	let imageUrl: string | undefined
	let imageId: string | undefined
	let images: Array<{ url: string; caption: string | null; order: number }> = []
	try {
		const result = await generateRecipeImages(
			recipeData.name as string,
			recipeData.description as string | undefined
		)
		images = result.images
		imageUrl = result.imageUrl
		imageId = result.imageId
	} catch (err) {
		logger.warn('Failed to generate/upload recipe images, continuing without images', {
			error: (err as Error).message
		})
	}

	const doc = await repo.createRecipe(userId, {
		...recipeData,
		...(imageUrl && { imageUrl }),
		...(imageId && { imageId }),
		...(images.length > 0 && { images })
	})

	return formatRecipe(doc.toObject())
}

const AI_RECIPE_EDIT_SYSTEM_PROMPT = `You are a recipe editor. You will receive an existing recipe as JSON and an edit instruction. Apply the edit and return the complete modified recipe JSON.

Return the FULL recipe with all fields — same schema as below. Adjust nutritionPerServing realistically based on any ingredient changes.

Schema:
{
  "name": string,
  "description": string (1 sentence),
  "servings": number,
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "ingredients": [{ "name": string, "quantity": number, "unit": string, "category": string }],
  "instructions": string[],
  "tags": string[],
  "nutritionPerServing": {
    "calories": number, "protein": number (g), "carbs": number (g), "fat": number (g), "fiber": number (g),
    "sugar": number (g), "water": number (mL),
    "saturatedFat": number (g), "monounsaturatedFat": number (g), "polyunsaturatedFat": number (g),
    "cholesterol": number (mg), "transFat": number (g),
    "vitaminA": number (mcg), "vitaminB6": number (mg), "vitaminB12": number (mcg),
    "vitaminC": number (mg), "vitaminD": number (mcg), "vitaminE": number (mg), "vitaminK": number (mcg),
    "thiamin": number (mg), "riboflavin": number (mg), "niacin": number (mg),
    "folate": number (mcg), "pantothenicAcid": number (mg), "biotin": number (mcg),
    "calcium": number (mg), "iron": number (mg), "magnesium": number (mg), "manganese": number (mg),
    "phosphorus": number (mg), "potassium": number (mg), "zinc": number (mg), "selenium": number (mcg),
    "copper": number (mg), "chromium": number (mcg), "molybdenum": number (mcg),
    "chloride": number (mg), "iodine": number (mcg), "sodium": number (mg), "caffeine": number (mg)
  }
}

All nutritionPerServing fields are REQUIRED.
Valid ingredient categories: produce, meat, seafood, dairy, bakery, pantry, frozen, beverages, other.
Respond with ONLY valid JSON, no markdown, no explanation.`

export async function editRecipeWithAI(
	recipeId: string,
	prompt: string,
	action: 'overwrite' | 'variant',
	userId: string
) {
	const existing = await repo.findRecipeById(recipeId, userId)
	if (!existing) throw new AppError('Recipe not found', 404)

	const existingJson = JSON.stringify({
		name: existing.name,
		description: existing.description,
		servings: existing.servings,
		prepTime: existing.prepTime,
		cookTime: existing.cookTime,
		ingredients: existing.ingredients,
		instructions: existing.instructions,
		tags: existing.tags,
		nutritionPerServing: existing.nutritionPerServing
	})

	const userMessage = `Current recipe:\n${existingJson}\n\nEdit instruction: ${prompt}`
	const recipeData = await generateRecipeJSON(AI_RECIPE_EDIT_SYSTEM_PROMPT, userMessage)

	let imageResult: { images: Array<{ url: string; caption: string | null; order: number }>; imageUrl?: string; imageId?: string } = { images: [] }
	try {
		imageResult = await generateRecipeImages(
			recipeData.name as string,
			recipeData.description as string | undefined
		)
	} catch (err) {
		logger.warn('Failed to generate images for edited recipe', { error: (err as Error).message })
	}

	const fullData = {
		...recipeData,
		...(imageResult.imageUrl && { imageUrl: imageResult.imageUrl }),
		...(imageResult.imageId && { imageId: imageResult.imageId }),
		...(imageResult.images.length > 0 && { images: imageResult.images })
	}

	if (action === 'overwrite') {
		const doc = await repo.updateRecipe(recipeId, userId, fullData)
		if (!doc) throw new AppError('Failed to update recipe', 500)
		return formatRecipe(doc.toObject())
	}

	// action === 'variant': create a new recipe linked to the same variant group
	const groupId = existing.variantGroupId || crypto.randomUUID()

	if (!existing.variantGroupId) {
		await repo.updateRecipe(recipeId, userId, {
			variantGroupId: groupId,
			isVariantPrimary: true
		})
	}

	const doc = await repo.createRecipe(userId, {
		...fullData,
		variantGroupId: groupId,
		isVariantPrimary: false
	})

	return formatRecipe(doc.toObject())
}

export async function listRecipeVariants(variantGroupId: string, userId: string) {
	const docs = await repo.findRecipeVariants(variantGroupId, userId)
	return docs.map((d) => formatRecipe(d.toObject()))
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
