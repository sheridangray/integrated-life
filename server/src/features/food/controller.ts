import { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../middleware/auth'
import * as foodService from './service'
import { z } from 'zod'
import {
	recipeFiltersValidator,
	createRecipeValidator,
	updateRecipeValidator,
	mealPlanFiltersValidator,
	createMealPlanValidator,
	updateMealPlanValidator,
	generateGroceryListValidator,
	updateGroceryListValidator,
	foodLogFiltersValidator,
	createFoodLogValidator,
	updateFoodLogValidator,
	barcodeScanValidator
} from './validators'

function requestId(req: Request): string | undefined {
	return (req as Request & { id?: string }).id
}

function validationError(res: Response, req: Request, error: { issues: Array<{ message: string }>; flatten(): unknown }) {
	return res.status(400).json({
		error: {
			code: 'VALIDATION_ERROR',
			message: error.issues[0]?.message ?? 'Invalid request',
			details: error.flatten()
		},
		requestId: requestId(req)
	})
}

export async function listRecipes(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = recipeFiltersValidator.safeParse(req.query)
	const filters = parsed.success ? parsed.data : { page: 1, limit: 20 }

	const result = await foodService.listRecipes(req.user.userId, filters)
	return res.json(result)
}

export async function getRecipe(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const recipe = await foodService.getRecipe(req.params.id, req.user.userId)
	return res.json(recipe)
}

export async function createRecipe(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = createRecipeValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const recipe = await foodService.createRecipe(req.user.userId, parsed.data)
	return res.status(201).json(recipe)
}

export async function updateRecipe(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = updateRecipeValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const recipe = await foodService.updateRecipe(req.params.id, req.user.userId, parsed.data)
	return res.json(recipe)
}

export async function deleteRecipe(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	await foodService.deleteRecipe(req.params.id, req.user.userId)
	return res.status(204).send()
}

export async function listMealPlans(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = mealPlanFiltersValidator.safeParse(req.query)
	const filters = parsed.success ? parsed.data : { page: 1, limit: 20 }

	const result = await foodService.listMealPlans(req.user.userId, filters)
	return res.json(result)
}

export async function getCurrentMealPlan(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const plan = await foodService.getCurrentMealPlan(req.user.userId)
	return res.json(plan)
}

export async function getMealPlan(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const plan = await foodService.getMealPlan(req.params.id, req.user.userId)
	return res.json(plan)
}

export async function createMealPlan(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = createMealPlanValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const plan = await foodService.createMealPlan(req.user.userId, parsed.data)
	return res.status(201).json(plan)
}

export async function updateMealPlan(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = updateMealPlanValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const plan = await foodService.updateMealPlan(req.params.id, req.user.userId, parsed.data)
	return res.json(plan)
}

export async function deleteMealPlan(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	await foodService.deleteMealPlan(req.params.id, req.user.userId)
	return res.status(204).send()
}

export async function listGroceryLists(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const result = await foodService.listGroceryLists(req.user.userId, { page: 1, limit: 20 })
	return res.json(result)
}

export async function getGroceryList(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const list = await foodService.getGroceryList(req.params.id, req.user.userId)
	return res.json(list)
}

export async function generateGroceryList(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = generateGroceryListValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const list = await foodService.generateGroceryList(parsed.data.mealPlanId, req.user.userId)
	return res.status(201).json(list)
}

export async function updateGroceryList(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = updateGroceryListValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const list = await foodService.updateGroceryList(req.params.id, req.user.userId, parsed.data)
	return res.json(list)
}

export async function initiateShopping(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const result = await foodService.initiateShopping(req.params.id, req.user.userId)
	return res.json(result)
}

export async function listFoodLog(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = foodLogFiltersValidator.safeParse(req.query)
	const filters = parsed.success ? parsed.data : { page: 1, limit: 20 }

	const result = await foodService.listFoodLog(req.user.userId, filters)
	return res.json(result)
}

export async function getDailyNutrition(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const result = await foodService.getDailyNutrition(req.user.userId, req.params.date)
	return res.json(result)
}

export async function getFoodLogEntry(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const entry = await foodService.getFoodLogEntry(req.params.id, req.user.userId)
	return res.json(entry)
}

export async function createFoodLog(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = createFoodLogValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const entry = await foodService.createFoodLog(req.user.userId, parsed.data)
	return res.status(201).json(entry)
}

export async function scanBarcode(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = barcodeScanValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const entry = await foodService.lookupBarcode(parsed.data.barcode, req.user.userId, parsed.data.mealType)
	return res.status(201).json(entry)
}

export async function scanPhoto(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const file = (req as Request & { file?: { buffer: Buffer; mimetype: string } }).file
	if (!file) {
		return res.status(400).json({
			error: { code: 'VALIDATION_ERROR', message: 'Image file is required' },
			requestId: requestId(req)
		})
	}

	const mealType = req.body?.mealType as string | undefined
	const entry = await foodService.scanPhoto(file.buffer, file.mimetype, req.user.userId, mealType)
	return res.status(201).json(entry)
}

export async function updateFoodLog(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = updateFoodLogValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const entry = await foodService.updateFoodLog(req.params.id, req.user.userId, parsed.data)
	return res.json(entry)
}

export async function deleteFoodLog(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	await foodService.deleteFoodLog(req.params.id, req.user.userId)
	return res.status(204).send()
}

const aiRecipeValidator = z.object({
	prompt: z.string().min(1, 'Prompt is required').max(2000)
})

export async function createAIRecipe(req: AuthenticatedRequest, res: Response) {
	if (!req.user) {
		return res.status(401).json({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: requestId(req)
		})
	}

	const parsed = aiRecipeValidator.safeParse(req.body)
	if (!parsed.success) return validationError(res, req, parsed.error)

	const recipe = await foodService.createRecipeFromAI(parsed.data.prompt, req.user.userId)
	return res.status(201).json(recipe)
}
