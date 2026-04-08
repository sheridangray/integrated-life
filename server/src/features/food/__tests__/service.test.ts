import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../repository')
vi.mock('../../../integrations/anthropic')

import * as repo from '../repository'
import * as anthropic from '../../../integrations/anthropic'
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
		vi.mocked(repo.createGroceryList).mockResolvedValue({
			_id: { toString: () => 'list-1' },
			userId: 'user-1',
			mealPlanId: 'plan-1',
			items: [],
			status: 'draft',
			toObject() { return this }
		} as never)

		await service.generateGroceryList('plan-1', 'user-1')

		const createCall = vi.mocked(repo.createGroceryList).mock.calls[0]
		const items = (createCall[1] as Record<string, unknown>).items as Array<Record<string, unknown>>

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
		vi.mocked(repo.createGroceryList).mockResolvedValue({
			_id: { toString: () => 'list-1' }, userId: 'user-1', mealPlanId: 'plan-1',
			items: [], status: 'draft', toObject() { return this }
		} as never)

		await service.generateGroceryList('plan-1', 'user-1')

		const createCall = vi.mocked(repo.createGroceryList).mock.calls[0]
		const items = (createCall[1] as Record<string, unknown>).items as Array<{ ingredient: { name: string; quantity: number } }>
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
		vi.mocked(repo.createGroceryList).mockResolvedValue({
			_id: { toString: () => 'list-1' }, userId: 'user-1', mealPlanId: 'plan-1',
			items: [], status: 'draft', toObject() { return this }
		} as never)

		await service.generateGroceryList('plan-1', 'user-1')

		const createCall = vi.mocked(repo.createGroceryList).mock.calls[0]
		const items = (createCall[1] as Record<string, unknown>).items as Array<{ ingredient: { name: string } }>
		const names = items.map((i) => i.ingredient.name.toLowerCase())

		expect(names).not.toContain('kosher salt')
		expect(names).not.toContain('black pepper')
		expect(names).not.toContain('olive oil')
		expect(names).not.toContain('garlic')
		expect(names).not.toContain('butter')
		expect(names).toContain('chicken breast')
	})

	it('assigns Costco for meat/seafood/produce, Safeway for others', async () => {
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
		vi.mocked(repo.createGroceryList).mockResolvedValue({
			_id: { toString: () => 'list-1' }, userId: 'user-1', mealPlanId: 'plan-1',
			items: [], status: 'draft', toObject() { return this }
		} as never)

		await service.generateGroceryList('plan-1', 'user-1')

		const createCall = vi.mocked(repo.createGroceryList).mock.calls[0]
		const items = (createCall[1] as Record<string, unknown>).items as Array<{ ingredient: { name: string }; store: string }>

		const chicken = items.find((i) => i.ingredient.name.toLowerCase().includes('chicken'))
		const salmon = items.find((i) => i.ingredient.name.toLowerCase().includes('salmon'))
		const broccoli = items.find((i) => i.ingredient.name.toLowerCase().includes('broccoli'))
		const cheese = items.find((i) => i.ingredient.name.toLowerCase().includes('cheddar'))
		const bread = items.find((i) => i.ingredient.name.toLowerCase().includes('sourdough'))

		expect(chicken?.store).toBe('costco')
		expect(salmon?.store).toBe('costco')
		expect(broccoli?.store).toBe('costco')
		expect(cheese?.store).toBe('safeway')
		expect(bread?.store).toBe('safeway')
	})

	it('handles empty meal plan', async () => {
		const plan = mockMealPlanDoc({ meals: [] })
		vi.mocked(repo.findMealPlanById).mockResolvedValue(plan as never)
		vi.mocked(repo.findRecipesByIds).mockResolvedValue([] as never)
		vi.mocked(repo.createGroceryList).mockResolvedValue({
			_id: { toString: () => 'list-1' }, userId: 'user-1', mealPlanId: 'plan-1',
			items: [], status: 'draft', toObject() { return this }
		} as never)

		await service.generateGroceryList('plan-1', 'user-1')

		const createCall = vi.mocked(repo.createGroceryList).mock.calls[0]
		const items = (createCall[1] as Record<string, unknown>).items as unknown[]
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
