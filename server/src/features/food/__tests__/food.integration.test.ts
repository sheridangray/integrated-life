import { describe, it, expect, beforeAll, vi } from 'vitest'
import type { Express } from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { setupIntegrationTest } from '../../../__tests__/integration-helper'

vi.mock('google-auth-library', () => ({
	OAuth2Client: function () {
		return { verifyIdToken: vi.fn() }
	}
}))

vi.mock('../../../lib/openapi', () => ({
	generateOpenAPIDocument: () => ({
		openapi: '3.0.0',
		info: { title: 'test', version: '0.0.0' },
		paths: {}
	})
}))

vi.mock('../../../integrations/together', () => ({
	chatCompletion: vi.fn().mockResolvedValue('Test AI insight response')
}))

vi.mock('../../../integrations/anthropic', () => ({
	analyzeImage: vi.fn()
}))

import { createApp } from '../../../server/app'
import { errorHandler } from '../../../middleware/errorHandler'

describe('Food Pillar Integration Tests', () => {
	setupIntegrationTest()

	let app: Express
	let accessToken: string
	const testUserId = new mongoose.Types.ObjectId().toString()

	beforeAll(() => {
		const expressApp = createApp()
		expressApp.use(errorHandler)
		app = expressApp

		accessToken = jwt.sign(
			{ userId: testUserId, email: 'test@test.com' },
			process.env.JWT_SECRET!,
			{ expiresIn: '15m' }
		)
	})

	const testRecipe = {
		name: 'Grilled Chicken Breast',
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
		nutritionPerServing: { calories: 280, protein: 35, carbs: 5, fat: 12, fiber: 2 }
	}

	describe('Recipe CRUD', () => {
		let recipeId: string

		it('returns 401 without auth token', async () => {
			await request(app).get('/v1/food/recipes').expect(401)
		})

		it('POST /v1/food/recipes → 201 creates recipe', async () => {
			const res = await request(app)
				.post('/v1/food/recipes')
				.set('Authorization', `Bearer ${accessToken}`)
				.send(testRecipe)
				.expect(201)

			expect(res.body).toHaveProperty('id')
			expect(res.body.name).toBe('Grilled Chicken Breast')
			expect(res.body.ingredients).toHaveLength(4)
			recipeId = res.body.id
		})

		it('GET /v1/food/recipes → 200 returns paginated list', async () => {
			const res = await request(app)
				.get('/v1/food/recipes')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body.items).toBeInstanceOf(Array)
			expect(res.body.items.length).toBeGreaterThanOrEqual(1)
			expect(res.body).toHaveProperty('total')
			expect(res.body).toHaveProperty('page')
		})

		it('GET /v1/food/recipes/tags → 200', async () => {
			const res = await request(app)
				.get('/v1/food/recipes/tags')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body.tags).toBeInstanceOf(Array)
			expect(res.body.tags).toContain('healthy')
		})

		it('GET /v1/food/recipes?maxTotalTimeMinutes filters by prep + cook', async () => {
			const tooTight = await request(app)
				.get('/v1/food/recipes?maxTotalTimeMinutes=25')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(tooTight.body.items.some((r: { id: string }) => r.id === recipeId)).toBe(false)

			const ok = await request(app)
				.get('/v1/food/recipes?maxTotalTimeMinutes=30')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(ok.body.items.some((r: { id: string }) => r.id === recipeId)).toBe(true)
		})

		it('GET /v1/food/recipes/:id → 200 returns recipe', async () => {
			const res = await request(app)
				.get(`/v1/food/recipes/${recipeId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body.id).toBe(recipeId)
			expect(res.body.name).toBe('Grilled Chicken Breast')
		})

		it('PUT /v1/food/recipes/:id → 200 updates recipe', async () => {
			const res = await request(app)
				.put(`/v1/food/recipes/${recipeId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ name: 'Updated Grilled Chicken' })
				.expect(200)

			expect(res.body.name).toBe('Updated Grilled Chicken')
		})

		it('DELETE /v1/food/recipes/:id → 204', async () => {
			await request(app)
				.delete(`/v1/food/recipes/${recipeId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(204)
		})
	})

	describe('MealPlan CRUD', () => {
		let planId: string
		let recipeIdForPlan: string

		beforeAll(async () => {
			const res = await request(app)
				.post('/v1/food/recipes')
				.set('Authorization', `Bearer ${accessToken}`)
				.send(testRecipe)
			recipeIdForPlan = res.body.id
		})

		it('POST /v1/food/meal-plans → 201 creates meal plan', async () => {
			const monday = new Date()
			monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
			monday.setHours(0, 0, 0, 0)

			const res = await request(app)
				.post('/v1/food/meal-plans')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					weekStartDate: monday.toISOString(),
					meals: [
						{ recipeId: recipeIdForPlan, scheduledDate: monday.toISOString(), mealType: 'dinner', servings: 2 }
					],
					status: 'proposed'
				})
				.expect(201)

			expect(res.body).toHaveProperty('id')
			expect(res.body.meals).toHaveLength(1)
			planId = res.body.id
		})

		it('GET /v1/food/meal-plans → 200 returns list', async () => {
			const res = await request(app)
				.get('/v1/food/meal-plans')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body.items).toBeInstanceOf(Array)
			expect(res.body.items.length).toBeGreaterThanOrEqual(1)
		})

		it('GET /v1/food/meal-plans/current → 200 returns current week plan', async () => {
			const res = await request(app)
				.get('/v1/food/meal-plans/current')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body).toHaveProperty('id')
			expect(res.body).toHaveProperty('meals')
		})

		it('PUT /v1/food/meal-plans/:id → 200 updates status', async () => {
			const res = await request(app)
				.put(`/v1/food/meal-plans/${planId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ status: 'confirmed' })
				.expect(200)

			expect(res.body.status).toBe('confirmed')
		})

		it('DELETE /v1/food/meal-plans/:id → 204', async () => {
			await request(app)
				.delete(`/v1/food/meal-plans/${planId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(204)
		})
	})

	describe('Grocery Lists', () => {
		let groceryListId: string
		let evergreenListId: string

		it('POST /v1/food/grocery-lists/add-items → 200 creates or updates draft list', async () => {
			const res = await request(app)
				.post('/v1/food/grocery-lists/add-items')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					items: [{ name: 'Lime', quantity: 2, unit: 'whole', category: 'produce' }]
				})
				.expect(200)

			expect(res.body.status).toBe('draft')
			evergreenListId = res.body.id
			expect(
				res.body.items.some((i: { ingredient: { name: string } }) =>
					i.ingredient.name.toLowerCase().includes('lime')
				)
			).toBe(true)
		})

		it('GET /v1/food/grocery-lists → 200 returns single evergreen list', async () => {
			const res = await request(app)
				.get('/v1/food/grocery-lists')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body.total).toBe(1)
			expect(res.body.items).toHaveLength(1)
			expect(res.body.items[0].id).toBe(evergreenListId)
		})

		it('POST /v1/food/grocery-lists/generate → 201 generates from meal plan', async () => {
			const recipe2 = {
				...testRecipe,
				name: 'Salmon Bowl',
				ingredients: [
					{ name: 'salmon fillet', quantity: 1, unit: 'lbs', category: 'seafood' },
					{ name: 'jasmine rice', quantity: 2, unit: 'cups', category: 'pantry' },
					{ name: 'avocado', quantity: 2, unit: 'pieces', category: 'produce' },
					{ name: 'cheddar cheese', quantity: 4, unit: 'oz', category: 'dairy' }
				]
			}

			const r1 = await request(app)
				.post('/v1/food/recipes')
				.set('Authorization', `Bearer ${accessToken}`)
				.send(testRecipe)
			const r2 = await request(app)
				.post('/v1/food/recipes')
				.set('Authorization', `Bearer ${accessToken}`)
				.send(recipe2)

			const monday = new Date()
			monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))

			const planRes = await request(app)
				.post('/v1/food/meal-plans')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					weekStartDate: monday.toISOString(),
					meals: [
						{ recipeId: r1.body.id, scheduledDate: monday.toISOString(), mealType: 'dinner', servings: 1 },
						{ recipeId: r2.body.id, scheduledDate: monday.toISOString(), mealType: 'lunch', servings: 1 }
					],
					status: 'confirmed'
				})

			const res = await request(app)
				.post('/v1/food/grocery-lists/generate')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ mealPlanId: planRes.body.id })
				.expect(201)

			expect(res.body).toHaveProperty('id')
			expect(res.body.id).toBe(evergreenListId)
			expect(res.body.items).toBeInstanceOf(Array)
			expect(res.body.status).toBe('draft')

			const names = res.body.items.map((i: Record<string, Record<string, string>>) => i.ingredient.name.toLowerCase())
			expect(names.some((n: string) => n.includes('lime'))).toBe(true)
			expect(names).not.toContain('olive oil')
			expect(names).not.toContain('salt')
			expect(names).not.toContain('jasmine rice')

			const stores = res.body.items.map((i: Record<string, string>) => ({ name: (i.ingredient as unknown as Record<string, string>).name.toLowerCase(), store: i.store }))
			const chickenItem = stores.find((s: Record<string, string>) => s.name.includes('chicken'))
			const salmonItem = stores.find((s: Record<string, string>) => s.name.includes('salmon'))
			const cheeseItem = stores.find((s: Record<string, string>) => s.name.includes('cheddar'))

			if (chickenItem) expect(chickenItem.store).toBe('costco')
			if (salmonItem) expect(salmonItem.store).toBe('costco')
			if (cheeseItem) expect(cheeseItem.store).toBe('safeway')

			groceryListId = res.body.id
		})

		it('GET /v1/food/grocery-lists/:id → 200', async () => {
			const res = await request(app)
				.get(`/v1/food/grocery-lists/${groceryListId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body.id).toBe(groceryListId)
		})

		it('POST /v1/food/grocery-lists/:id/initiate-shopping → 200', async () => {
			const res = await request(app)
				.post(`/v1/food/grocery-lists/${groceryListId}/initiate-shopping`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body.status).toBe('initiated')
			expect(res.body.stores).toHaveProperty('costco')
			expect(res.body.stores).toHaveProperty('safeway')
		})
	})

	describe('Food Log', () => {
		let logId: string

		it('POST /v1/food/log → 201 manual entry', async () => {
			const res = await request(app)
				.post('/v1/food/log')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					date: '2025-01-15',
					mealType: 'lunch',
					food: {
						name: 'Turkey Sandwich',
						nutrition: { calories: 400, protein: 25, carbs: 45, fat: 12, fiber: 3 }
					},
					servingSize: '1 sandwich',
					servings: 1
				})
				.expect(201)

			expect(res.body).toHaveProperty('id')
			expect(res.body.food.name).toBe('Turkey Sandwich')
			expect(res.body.source).toBe('manual')
			logId = res.body.id
		})

		it('POST /v1/food/log/barcode → 201 with mocked OFF API', async () => {
			vi.spyOn(global, 'fetch').mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({
					status: 1,
					product: {
						product_name: 'Test Granola Bar',
						brands: 'Nature Valley',
						nutriments: {
							'energy-kcal_100g': 450,
							proteins_100g: 8,
							carbohydrates_100g: 65,
							fat_100g: 18,
							fiber_100g: 4
						},
						serving_size: '42g'
					}
				})
			} as Response)

			const res = await request(app)
				.post('/v1/food/log/barcode')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ barcode: '016000275263', mealType: 'snack' })
				.expect(201)

			expect(res.body.source).toBe('barcode')
			expect(res.body.food.name).toBe('Test Granola Bar')
			expect(res.body.food.brand).toBe('Nature Valley')
		})

		it('GET /v1/food/log → 200 returns entries', async () => {
			const res = await request(app)
				.get('/v1/food/log')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body.items).toBeInstanceOf(Array)
			expect(res.body.items.length).toBeGreaterThanOrEqual(1)
		})

		it('GET /v1/food/log/daily/:date → 200 with macro totals', async () => {
			const res = await request(app)
				.get('/v1/food/log/daily/2025-01-15')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200)

			expect(res.body).toHaveProperty('date')
			expect(res.body).toHaveProperty('totals')
			expect(res.body.totals).toHaveProperty('calories')
			expect(res.body.totals).toHaveProperty('protein')
			expect(res.body).toHaveProperty('entries')
		})

		it('PUT /v1/food/log/:id → 200 updates entry', async () => {
			const res = await request(app)
				.put(`/v1/food/log/${logId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ servings: 2 })
				.expect(200)

			expect(res.body.servings).toBe(2)
		})

		it('DELETE /v1/food/log/:id → 204', async () => {
			await request(app)
				.delete(`/v1/food/log/${logId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(204)
		})
	})
})
