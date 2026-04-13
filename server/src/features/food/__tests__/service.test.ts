import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../repository')
vi.mock('../../../integrations/anthropic')
vi.mock('../../../services/imageGeneration')
vi.mock('../../../services/storage')
vi.mock('@anthropic-ai/sdk')
vi.mock('../../../config', () => ({
	env: {
		ANTHROPIC_API_KEY: 'test-key',
		TOGETHER_AI_API_KEY: 'test-key'
	}
}))

import * as repo from '../repository'
import * as anthropic from '../../../integrations/anthropic'
import * as imageGen from '../../../services/imageGeneration'
import * as storage from '../../../services/storage'
import Anthropic from '@anthropic-ai/sdk'
import * as service from '../service'

beforeEach(() => {
	vi.clearAllMocks()
})

function mockRecipeDoc(overrides = {}) {
	return {
		_id: { toString: () => 'recipe-1' },
		userId: 'user-1',
		name: 'Grilled Chicken',
		description: 'Simple grilled chicken',
		servings: 4,
		prepTime: 10,
		cookTime: 20,
		ingredients: [
			{ name: 'chicken breast', quantity: 2, unit: 'lbs', category: 'meat' },
			{ name: 'olive oil', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'salt', quantity: 1, unit: 'tsp', category: 'pantry' },
			{ name: 'broccoli', quantity: 1, unit: 'head', category: 'produce' }
		],
		instructions: ['Season chicken', 'Grill 6 min per side'],
		tags: ['healthy', 'protein'],
		nutritionPerServing: { calories: 280, protein: 35, carbs: 5, fat: 12, fiber: 2 },
		toObject() {
			return this
		},
		...overrides
	}
}

function mockMealPlanDoc(overrides = {}) {
	return {
		_id: { toString: () => 'plan-1' },
		userId: 'user-1',
		weekStartDate: new Date('2025-01-06'),
		meals: [
			{ recipeId: { toString: () => 'recipe-1' }, scheduledDate: new Date('2025-01-06'), mealType: 'dinner', servings: 2 }
		],
		status: 'proposed',
		toObject() {
			return this
		},
		...overrides
	}
}

function mockFoodLogDoc(overrides = {}) {
	return {
		_id: { toString: () => 'log-1' },
		userId: 'user-1',
		date: new Date('2025-01-15'),
		mealType: 'lunch',
		source: 'manual',
		food: { name: 'Sandwich', nutrition: { calories: 400, protein: 20, carbs: 45, fat: 15, fiber: 3 } },
		servingSize: '1 sandwich',
		servings: 1,
		notes: null,
		toObject() {
			return this
		},
		...overrides
	}
}

describe('Grocery List Generation', () => {
	const emptyEvergreenList = {
		_id: { toString: () => 'list-1' },
		userId: 'user-1',
		items: [] as unknown[],
		status: 'draft',
		toObject() {
			return this
		}
	}

	beforeEach(() => {
		vi.mocked(repo.findAllGroceryListsForUser).mockResolvedValue([] as never)
		vi.mocked(repo.createGroceryList).mockResolvedValue(emptyEvergreenList as never)
		vi.mocked(repo.updateGroceryList).mockImplementation((_id, _userId, data) =>
			Promise.resolve({
				_id: { toString: () => 'list-1' },
				userId: 'user-1',
				items: data.items as unknown[],
				status: (data.status as string) ?? 'draft',
				toObject() {
					return this
				}
			} as never)
		)
	})

	it('aggregates ingredients from multiple recipes', async () => {
		const recipe1 = mockRecipeDoc()
		const recipe2 = mockRecipeDoc({
			_id: { toString: () => 'recipe-2' },
			name: 'Chicken Stir Fry',
			ingredients: [
				{ name: 'chicken breast', quantity: 1, unit: 'lbs', category: 'meat' },
				{ name: 'bell pepper', quantity: 2, unit: 'pieces', category: 'produce' },
				{ name: 'soy sauce', quantity: 2, unit: 'tbsp', category: 'pantry' }
			]
		})

		const plan = mockMealPlanDoc({
			meals: [
				{ recipeId: { toString: () => 'recipe-1' }, scheduledDate: new Date(), mealType: 'dinner', servings: 1 },
				{ recipeId: { toString: () => 'recipe-2' }, scheduledDate: new Date(), mealType: 'lunch', servings: 1 }
			]
		})

		vi.mocked(repo.findMealPlanById).mockResolvedValue(plan as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([recipe1, recipe2] as never)

		await service.generateGroceryList('plan-1', 'user-1')

		const updateCall = vi.mocked(repo.updateGroceryList).mock.calls[0]
		const items = (updateCall[2] as Record<string, unknown>).items as Array<Record<string, unknown>>

		const names = items.map((i) => (i.ingredient as Record<string, unknown>).name)
		expect(names).not.toContain('Olive oil')
		expect(names).not.toContain('Salt')
		expect(names).not.toContain('Soy sauce')
	})

	it('consolidates quantities for same ingredient across recipes', async () => {
		const recipe1 = mockRecipeDoc({
			ingredients: [{ name: 'chicken breast', quantity: 2, unit: 'lbs', category: 'meat' }]
		})
		const recipe2 = mockRecipeDoc({
			_id: { toString: () => 'recipe-2' },
			ingredients: [{ name: 'chicken breast', quantity: 1, unit: 'lbs', category: 'meat' }]
		})

		const plan = mockMealPlanDoc({
			meals: [
				{ recipeId: { toString: () => 'recipe-1' }, scheduledDate: new Date(), mealType: 'dinner', servings: 1 },
				{ recipeId: { toString: () => 'recipe-2' }, scheduledDate: new Date(), mealType: 'lunch', servings: 1 }
			]
		})

		vi.mocked(repo.findMealPlanById).mockResolvedValue(plan as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([recipe1, recipe2] as never)

		await service.generateGroceryList('plan-1', 'user-1')

		const updateCall = vi.mocked(repo.updateGroceryList).mock.calls[0]
		const items = (updateCall[2] as Record<string, unknown>).items as Array<{ ingredient: { name: string; quantity: number } }>
		const chicken = items.find((i) => i.ingredient.name.toLowerCase().includes('chicken'))
		expect(chicken).toBeDefined()
		expect(chicken!.ingredient.quantity).toBe(3)
	})

	it('excludes pantry staples', async () => {
		const recipe = mockRecipeDoc({
			ingredients: [
				{ name: 'chicken breast', quantity: 2, unit: 'lbs', category: 'meat' },
				{ name: 'kosher salt', quantity: 1, unit: 'tsp', category: 'pantry' },
				{ name: 'black pepper', quantity: 0.5, unit: 'tsp', category: 'pantry' },
				{ name: 'olive oil', quantity: 2, unit: 'tbsp', category: 'pantry' },
				{ name: 'garlic', quantity: 3, unit: 'cloves', category: 'pantry' },
				{ name: 'butter', quantity: 1, unit: 'tbsp', category: 'pantry' }
			]
		})

		vi.mocked(repo.findMealPlanById).mockResolvedValue(mockMealPlanDoc() as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([recipe] as never)

		await service.generateGroceryList('plan-1', 'user-1')

		const updateCall = vi.mocked(repo.updateGroceryList).mock.calls[0]
		const items = (updateCall[2] as Record<string, unknown>).items as Array<{ ingredient: { name: string } }>
		const names = items.map((i) => i.ingredient.name.toLowerCase())

		expect(names).not.toContain('kosher salt')
		expect(names).not.toContain('black pepper')
		expect(names).not.toContain('olive oil')
		expect(names).not.toContain('garlic')
		expect(names).not.toContain('butter')
		expect(names).toContain('chicken breast')
	})

	it('preserves ingredient categories', async () => {
		const recipe = mockRecipeDoc({
			ingredients: [
				{ name: 'chicken breast', quantity: 2, unit: 'lbs', category: 'meat' },
				{ name: 'salmon', quantity: 1, unit: 'lbs', category: 'seafood' },
				{ name: 'broccoli', quantity: 1, unit: 'head', category: 'produce' },
				{ name: 'cheddar cheese', quantity: 8, unit: 'oz', category: 'dairy' },
				{ name: 'sourdough bread', quantity: 1, unit: 'loaf', category: 'bakery' }
			]
		})

		vi.mocked(repo.findMealPlanById).mockResolvedValue(mockMealPlanDoc() as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([recipe] as never)

		await service.generateGroceryList('plan-1', 'user-1')

		const updateCall = vi.mocked(repo.updateGroceryList).mock.calls[0]
		const items = (updateCall[2] as Record<string, unknown>).items as Array<{ ingredient: { name: string; category: string } }>

		const chicken = items.find((i) => i.ingredient.name.toLowerCase().includes('chicken'))
		const cheese = items.find((i) => i.ingredient.name.toLowerCase().includes('cheddar'))

		expect(chicken?.ingredient.category).toBe('meat')
		expect(cheese?.ingredient.category).toBe('dairy')
	})

	it('handles empty meal plan', async () => {
		const plan = mockMealPlanDoc({ meals: [] })
		vi.mocked(repo.findMealPlanById).mockResolvedValue(plan as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([] as never)

		await service.generateGroceryList('plan-1', 'user-1')

		const updateCall = vi.mocked(repo.updateGroceryList).mock.calls[0]
		const items = (updateCall[2] as Record<string, unknown>).items as unknown[]
		expect(items).toHaveLength(0)
	})
})

describe('Barcode Lookup', () => {
	it('returns nutrition data for valid barcode', async () => {
		const mockResponse = {
			ok: true,
			json: () => Promise.resolve({
				status: 1,
				product: {
					product_name: 'Test Granola',
					brands: 'Test Brand',
					nutriments: {
						'energy-kcal_100g': 450,
						proteins_100g: 10,
						carbohydrates_100g: 60,
						fat_100g: 18,
						fiber_100g: 6
					},
					serving_size: '50g'
				}
			})
		}
		vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response)

		vi.mocked(repo.createFoodLogEntry).mockResolvedValue(mockFoodLogDoc({
			source: 'barcode',
			food: {
				name: 'Test Granola',
				brand: 'Test Brand',
				nutrition: { calories: 450, protein: 10, carbs: 60, fat: 18, fiber: 6 }
			}
		}) as never)

		const result = await service.lookupBarcode('1234567890', 'user-1', 'breakfast')

		expect(global.fetch).toHaveBeenCalledWith(
			'https://world.openfoodfacts.org/api/v0/product/1234567890.json',
			expect.objectContaining({ headers: expect.objectContaining({ 'User-Agent': expect.any(String) }) })
		)
		expect(repo.createFoodLogEntry).toHaveBeenCalledWith('user-1', expect.objectContaining({
			source: 'barcode',
			mealType: 'breakfast'
		}))
		expect(result).toHaveProperty('id')
	})

	it('throws 404 when product not found', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0 })
		} as Response)

		await expect(service.lookupBarcode('0000000000', 'user-1')).rejects.toThrow('Product not found')
	})

	it('throws 502 on network failure', async () => {
		vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

		await expect(service.lookupBarcode('1234567890', 'user-1')).rejects.toThrow('Failed to lookup barcode')
	})
})

describe('Photo Scan', () => {
	it('calls Anthropic and creates food log entry', async () => {
		vi.mocked(anthropic.analyzeImage).mockResolvedValue({
			name: 'Caesar Salad',
			servingSize: '1 bowl',
			nutrition: { calories: 350, protein: 15, carbs: 20, fat: 22, fiber: 4 }
		})

		vi.mocked(repo.createFoodLogEntry).mockResolvedValue(mockFoodLogDoc({
			source: 'photo',
			food: { name: 'Caesar Salad', nutrition: { calories: 350, protein: 15, carbs: 20, fat: 22, fiber: 4 } }
		}) as never)

		const buffer = Buffer.from('fake-image-data')
		const result = await service.scanPhoto(buffer, 'image/jpeg', 'user-1', 'lunch')

		expect(anthropic.analyzeImage).toHaveBeenCalledWith(buffer.toString('base64'), 'image/jpeg')
		expect(repo.createFoodLogEntry).toHaveBeenCalledWith('user-1', expect.objectContaining({
			source: 'photo',
			food: expect.objectContaining({ name: 'Caesar Salad' })
		}))
		expect(result).toHaveProperty('id')
	})

	it('throws 503 when Anthropic is unavailable', async () => {
		vi.mocked(anthropic.analyzeImage).mockResolvedValue(null)

		const buffer = Buffer.from('fake-image-data')
		await expect(service.scanPhoto(buffer, 'image/jpeg', 'user-1')).rejects.toThrow('Photo analysis unavailable')
	})
})

describe('Daily Nutrition', () => {
	it('sums nutrition across all entries with servings multiplier', async () => {
		vi.mocked(repo.findFoodLogByDate).mockResolvedValue([
			mockFoodLogDoc({
				food: { name: 'Eggs', nutrition: { calories: 150, protein: 12, carbs: 1, fat: 10, fiber: 0 } },
				servings: 2
			}),
			mockFoodLogDoc({
				_id: { toString: () => 'log-2' },
				food: { name: 'Toast', nutrition: { calories: 200, protein: 5, carbs: 35, fat: 3, fiber: 2 } },
				servings: 1
			})
		] as never)

		const result = await service.getDailyNutrition('user-1', '2025-01-15')

		expect(result.totals.calories).toBe(500)
		expect(result.totals.protein).toBe(29)
		expect(result.totals.carbs).toBe(37)
		expect(result.totals.fat).toBe(23)
		expect(result.totals.fiber).toBe(2)
		expect(result.entries).toHaveLength(2)
	})

	it('returns zero totals for date with no entries', async () => {
		vi.mocked(repo.findFoodLogByDate).mockResolvedValue([] as never)

		const result = await service.getDailyNutrition('user-1', '2025-01-15')

		expect(result.totals.calories).toBe(0)
		expect(result.totals.protein).toBe(0)
		expect(result.totals.carbs).toBe(0)
		expect(result.totals.fat).toBe(0)
		expect(result.totals.fiber).toBe(0)
		expect(result.totals.sodium).toBe(0)
		expect(result.entries).toHaveLength(0)
	})
})

describe('Meal Plan Cook Time', () => {
	it('calculates total cook time from all meals', async () => {
		const recipe1 = mockRecipeDoc({ prepTime: 15, cookTime: 30 })
		const recipe2 = mockRecipeDoc({ _id: { toString: () => 'recipe-2' }, prepTime: 10, cookTime: 20 })

		const plan = mockMealPlanDoc({
			meals: [
				{ recipeId: { toString: () => 'recipe-1' }, scheduledDate: new Date('2025-01-06'), mealType: 'dinner', servings: 2 },
				{ recipeId: { toString: () => 'recipe-2' }, scheduledDate: new Date('2025-01-06'), mealType: 'lunch', servings: 1 }
			]
		})

		vi.mocked(repo.findMealPlanById).mockResolvedValue(plan as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([recipe1, recipe2] as never)

		const result = await service.getMealPlanCookTime('plan-1', 'user-1')

		expect(result.totalMinutes).toBe(75) // (15+30) + (10+20)
	})

	it('groups cook time by day', async () => {
		const recipe1 = mockRecipeDoc({ prepTime: 10, cookTime: 20 })
		const recipe2 = mockRecipeDoc({ _id: { toString: () => 'recipe-2' }, prepTime: 5, cookTime: 15 })

		const plan = mockMealPlanDoc({
			meals: [
				{ recipeId: { toString: () => 'recipe-1' }, scheduledDate: new Date('2025-01-06'), mealType: 'dinner', servings: 2 },
				{ recipeId: { toString: () => 'recipe-2' }, scheduledDate: new Date('2025-01-07'), mealType: 'lunch', servings: 1 }
			]
		})

		vi.mocked(repo.findMealPlanById).mockResolvedValue(plan as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([recipe1, recipe2] as never)

		const result = await service.getMealPlanCookTime('plan-1', 'user-1')

		expect(result.byDay).toHaveLength(2)
		expect(result.byDay[0]).toEqual({ date: '2025-01-06', minutes: 30, meals: 1 })
		expect(result.byDay[1]).toEqual({ date: '2025-01-07', minutes: 20, meals: 1 })
	})

	it('handles missing recipe gracefully', async () => {
		const recipe = mockRecipeDoc({ prepTime: 10, cookTime: 20 })

		const plan = mockMealPlanDoc({
			meals: [
				{ recipeId: { toString: () => 'recipe-1' }, scheduledDate: new Date('2025-01-06'), mealType: 'dinner', servings: 2 },
				{ recipeId: { toString: () => 'recipe-missing' }, scheduledDate: new Date('2025-01-06'), mealType: 'lunch', servings: 1 }
			]
		})

		vi.mocked(repo.findMealPlanById).mockResolvedValue(plan as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([recipe] as never)

		const result = await service.getMealPlanCookTime('plan-1', 'user-1')

		expect(result.totalMinutes).toBe(30)
		expect(result.byDay[0].meals).toBe(1)
	})

	it('throws 404 when meal plan not found', async () => {
		vi.mocked(repo.findMealPlanById).mockResolvedValue(null as never)

		await expect(service.getMealPlanCookTime('nonexistent', 'user-1')).rejects.toThrow('Meal plan not found')
	})

	it('returns zero for empty meal plan', async () => {
		const plan = mockMealPlanDoc({ meals: [] })
		vi.mocked(repo.findMealPlanById).mockResolvedValue(plan as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([] as never)

		const result = await service.getMealPlanCookTime('plan-1', 'user-1')

		expect(result.totalMinutes).toBe(0)
		expect(result.byDay).toHaveLength(0)
	})
})

describe('Meal Plan Enrichment', () => {
	it('enriches meals with recipe name, image, and nutrition', async () => {
		const recipe = mockRecipeDoc({
			name: 'Grilled Chicken',
			imageUrl: 'https://example.com/chicken.jpg',
			nutritionPerServing: { calories: 280, protein: 35, carbs: 5, fat: 12, fiber: 2 }
		})
		const plan = mockMealPlanDoc()

		vi.mocked(repo.findMealPlans).mockResolvedValue({ docs: [plan], total: 1 } as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([recipe] as never)

		const result = await service.listMealPlans('user-1', { page: 1, limit: 20 })
		const meal = result.items[0].meals[0]

		expect(meal.recipeName).toBe('Grilled Chicken')
		expect(meal.recipeImageUrl).toBe('https://example.com/chicken.jpg')
		expect(meal.caloriesPerServing).toBe(280)
		expect(meal.proteinPerServing).toBe(35)
		expect(meal.carbsPerServing).toBe(5)
		expect(meal.fatPerServing).toBe(12)
	})

	it('handles missing recipes gracefully during enrichment', async () => {
		const plan = mockMealPlanDoc({
			meals: [
				{ recipeId: { toString: () => 'recipe-missing' }, scheduledDate: new Date('2025-01-06'), mealType: 'dinner', servings: 2 }
			]
		})

		vi.mocked(repo.findMealPlans).mockResolvedValue({ docs: [plan], total: 1 } as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([] as never)

		const result = await service.listMealPlans('user-1', { page: 1, limit: 20 })
		const meal = result.items[0].meals[0]

		expect(meal.recipeName).toBeUndefined()
		expect(meal.recipeImageUrl).toBeUndefined()
		expect(meal.caloriesPerServing).toBeUndefined()
	})

	it('enriches empty meal plan without errors', async () => {
		const plan = mockMealPlanDoc({ meals: [] })

		vi.mocked(repo.findMealPlans).mockResolvedValue({ docs: [plan], total: 1 } as never)

		const result = await service.listMealPlans('user-1', { page: 1, limit: 20 })

		expect(result.items[0].meals).toHaveLength(0)
		expect(repo.findRecipesByIds).not.toHaveBeenCalled()
	})

	it('enriches getMealPlan by ID', async () => {
		const recipe = mockRecipeDoc({ name: 'Pasta Carbonara' })
		const plan = mockMealPlanDoc()

		vi.mocked(repo.findMealPlanById).mockResolvedValue(plan as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([recipe] as never)

		const result = await service.getMealPlan('plan-1', 'user-1')

		expect(result.meals[0].recipeName).toBe('Pasta Carbonara')
	})

	it('enriches getCurrentMealPlan', async () => {
		const recipe = mockRecipeDoc({ name: 'Tacos' })
		const plan = mockMealPlanDoc()

		vi.mocked(repo.findCurrentMealPlan).mockResolvedValue(plan as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([recipe] as never)

		const result = await service.getCurrentMealPlan('user-1')

		expect(result.meals[0].recipeName).toBe('Tacos')
	})
})

describe('Duplicate Week Constraint', () => {
	it('throws 409 on duplicate key error when creating meal plan', async () => {
		const dupeError = Object.assign(new Error('E11000 duplicate key'), { code: 11000 })
		vi.mocked(repo.createMealPlan).mockRejectedValue(dupeError)

		await expect(service.createMealPlan('user-1', {
			weekStartDate: '2025-01-06',
			meals: [],
			status: 'proposed'
		})).rejects.toThrow('A meal plan already exists for this week')
	})

	it('re-throws non-duplicate errors from createMealPlan', async () => {
		vi.mocked(repo.createMealPlan).mockRejectedValue(new Error('DB connection failed'))

		await expect(service.createMealPlan('user-1', {
			weekStartDate: '2025-01-06',
			meals: [],
			status: 'proposed'
		})).rejects.toThrow('DB connection failed')
	})
})

describe('Variant Deduplication in listRecipes', () => {
	it('deduplicates recipes in the same variant group, keeping the primary', async () => {
		const primary = mockRecipeDoc({
			_id: { toString: () => 'recipe-primary' },
			name: 'Cheese Pizza',
			variantGroupId: 'group-1',
			isVariantPrimary: true
		})
		const variant = mockRecipeDoc({
			_id: { toString: () => 'recipe-variant' },
			name: 'Pepperoni Pizza',
			variantGroupId: 'group-1',
			isVariantPrimary: false
		})
		const standalone = mockRecipeDoc({
			_id: { toString: () => 'recipe-standalone' },
			name: 'Tacos'
		})

		vi.mocked(repo.findRecipes).mockResolvedValue({
			docs: [primary, variant, standalone],
			total: 3
		} as never)

		const result = await service.listRecipes('user-1', { page: 1, limit: 20 })

		expect(result.items).toHaveLength(2)
		expect(result.items[0].name).toBe('Cheese Pizza')
		expect(result.items[1].name).toBe('Tacos')
	})

	it('keeps first recipe if no primary is set in the group', async () => {
		const v1 = mockRecipeDoc({
			_id: { toString: () => 'recipe-v1' },
			name: 'Green Curry',
			variantGroupId: 'group-2',
			isVariantPrimary: false
		})
		const v2 = mockRecipeDoc({
			_id: { toString: () => 'recipe-v2' },
			name: 'Red Curry',
			variantGroupId: 'group-2',
			isVariantPrimary: false
		})

		vi.mocked(repo.findRecipes).mockResolvedValue({
			docs: [v1, v2],
			total: 2
		} as never)

		const result = await service.listRecipes('user-1', { page: 1, limit: 20 })

		expect(result.items).toHaveLength(1)
		expect(result.items[0].name).toBe('Green Curry')
	})

	it('replaces non-primary with primary when primary appears later', async () => {
		const nonPrimary = mockRecipeDoc({
			_id: { toString: () => 'recipe-np' },
			name: 'Red Curry',
			variantGroupId: 'group-3',
			isVariantPrimary: false
		})
		const primary = mockRecipeDoc({
			_id: { toString: () => 'recipe-p' },
			name: 'Green Curry',
			variantGroupId: 'group-3',
			isVariantPrimary: true
		})

		vi.mocked(repo.findRecipes).mockResolvedValue({
			docs: [nonPrimary, primary],
			total: 2
		} as never)

		const result = await service.listRecipes('user-1', { page: 1, limit: 20 })

		expect(result.items).toHaveLength(1)
		expect(result.items[0].name).toBe('Green Curry')
	})

	it('standalone recipes without variantGroupId pass through', async () => {
		const r1 = mockRecipeDoc({ _id: { toString: () => 'r1' }, name: 'Pasta' })
		const r2 = mockRecipeDoc({ _id: { toString: () => 'r2' }, name: 'Salad' })

		vi.mocked(repo.findRecipes).mockResolvedValue({
			docs: [r1, r2],
			total: 2
		} as never)

		const result = await service.listRecipes('user-1', { page: 1, limit: 20 })

		expect(result.items).toHaveLength(2)
	})
})

describe('listRecipeVariants', () => {
	it('returns all recipes in a variant group', async () => {
		const v1 = mockRecipeDoc({
			_id: { toString: () => 'v1' },
			name: 'Cheese Pizza',
			variantGroupId: 'group-1',
			isVariantPrimary: true
		})
		const v2 = mockRecipeDoc({
			_id: { toString: () => 'v2' },
			name: 'Pepperoni Pizza',
			variantGroupId: 'group-1',
			isVariantPrimary: false
		})

		vi.mocked(repo.findRecipeVariants).mockResolvedValue([v1, v2] as never)

		const result = await service.listRecipeVariants('group-1', 'user-1')

		expect(result).toHaveLength(2)
		expect(result[0].name).toBe('Cheese Pizza')
		expect(result[1].name).toBe('Pepperoni Pizza')
		expect(repo.findRecipeVariants).toHaveBeenCalledWith('group-1', 'user-1')
	})

	it('returns empty array for non-existent group', async () => {
		vi.mocked(repo.findRecipeVariants).mockResolvedValue([] as never)

		const result = await service.listRecipeVariants('nonexistent', 'user-1')

		expect(result).toHaveLength(0)
	})
})

describe('editRecipeWithAI', () => {
	function mockAnthropicClient(responseText: string) {
		const createFn = vi.fn().mockResolvedValue({
			content: [{ type: 'text', text: responseText }]
		})
		vi.mocked(Anthropic).mockImplementation(function (this: unknown) {
			(this as Record<string, unknown>).messages = { create: createFn }
		} as never)
		return createFn
	}

	const editedRecipeJson = JSON.stringify({
		name: 'Veggie Chicken',
		description: 'A vegetarian take',
		servings: 4,
		prepTime: 10,
		cookTime: 20,
		ingredients: [{ name: 'tofu', quantity: 1, unit: 'block', category: 'produce' }],
		instructions: ['Press tofu', 'Grill'],
		tags: ['vegetarian'],
		nutritionPerServing: { calories: 200, protein: 20, carbs: 10, fat: 8, fiber: 3 }
	})

	beforeEach(() => {
		vi.mocked(imageGen.generateRecipeImage).mockResolvedValue(null)
		vi.mocked(storage.uploadImage).mockResolvedValue('https://r2.example.com/img.png')
	})

	it('overwrites the existing recipe when action is overwrite', async () => {
		const existing = mockRecipeDoc()
		vi.mocked(repo.findRecipeById).mockResolvedValue(existing as never)
		mockAnthropicClient(editedRecipeJson)

		const updated = mockRecipeDoc({ name: 'Veggie Chicken' })
		vi.mocked(repo.updateRecipe).mockResolvedValue(updated as never)

		const result = await service.editRecipeWithAI('recipe-1', 'make it vegetarian', 'overwrite', 'user-1')

		expect(result.name).toBe('Veggie Chicken')
		expect(repo.updateRecipe).toHaveBeenCalledWith(
			'recipe-1',
			'user-1',
			expect.objectContaining({ name: 'Veggie Chicken' })
		)
		expect(repo.createRecipe).not.toHaveBeenCalled()
	})

	it('creates a variant when action is variant and original has no group', async () => {
		const existing = mockRecipeDoc()
		vi.mocked(repo.findRecipeById).mockResolvedValue(existing as never)
		mockAnthropicClient(editedRecipeJson)

		vi.mocked(repo.updateRecipe).mockResolvedValue(existing as never)
		const newDoc = mockRecipeDoc({
			_id: { toString: () => 'recipe-variant' },
			name: 'Veggie Chicken',
			variantGroupId: 'some-uuid',
			isVariantPrimary: false
		})
		vi.mocked(repo.createRecipe).mockResolvedValue(newDoc as never)

		const result = await service.editRecipeWithAI('recipe-1', 'make it vegetarian', 'variant', 'user-1')

		expect(result.name).toBe('Veggie Chicken')
		expect(repo.updateRecipe).toHaveBeenCalledWith(
			'recipe-1',
			'user-1',
			expect.objectContaining({ isVariantPrimary: true })
		)
		expect(repo.createRecipe).toHaveBeenCalledWith(
			'user-1',
			expect.objectContaining({ isVariantPrimary: false })
		)
	})

	it('creates a variant using existing variantGroupId', async () => {
		const existing = mockRecipeDoc({ variantGroupId: 'existing-group' })
		vi.mocked(repo.findRecipeById).mockResolvedValue(existing as never)
		mockAnthropicClient(editedRecipeJson)

		const newDoc = mockRecipeDoc({
			_id: { toString: () => 'recipe-variant' },
			name: 'Veggie Chicken',
			variantGroupId: 'existing-group',
			isVariantPrimary: false
		})
		vi.mocked(repo.createRecipe).mockResolvedValue(newDoc as never)

		await service.editRecipeWithAI('recipe-1', 'make it vegetarian', 'variant', 'user-1')

		expect(repo.updateRecipe).not.toHaveBeenCalled()
		expect(repo.createRecipe).toHaveBeenCalledWith(
			'user-1',
			expect.objectContaining({ variantGroupId: 'existing-group' })
		)
	})

	it('throws 404 when recipe not found', async () => {
		vi.mocked(repo.findRecipeById).mockResolvedValue(null as never)

		await expect(
			service.editRecipeWithAI('nonexistent', 'make it vegan', 'overwrite', 'user-1')
		).rejects.toThrow('Recipe not found')
	})
})
