import { Router } from 'express'
import multer from 'multer'
import { authMiddleware } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/asyncHandler'
import * as controller from './controller'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

export const mealPlanRoutes = Router()
mealPlanRoutes.use(authMiddleware)
mealPlanRoutes.get('/', asyncHandler(controller.listMealPlans))
mealPlanRoutes.get('/current', asyncHandler(controller.getCurrentMealPlan))
mealPlanRoutes.get('/:id', asyncHandler(controller.getMealPlan))
mealPlanRoutes.get('/:id/cook-time', asyncHandler(controller.getMealPlanCookTime))
mealPlanRoutes.post('/', asyncHandler(controller.createMealPlan))
mealPlanRoutes.put('/:id', asyncHandler(controller.updateMealPlan))
mealPlanRoutes.delete('/:id', asyncHandler(controller.deleteMealPlan))

export const recipeRoutes = Router()
recipeRoutes.use(authMiddleware)
recipeRoutes.get('/', asyncHandler(controller.listRecipes))
recipeRoutes.get('/tags', asyncHandler(controller.listRecipeTags))
recipeRoutes.get('/variants/:groupId', asyncHandler(controller.listRecipeVariants))
recipeRoutes.get('/:id', asyncHandler(controller.getRecipe))
recipeRoutes.post('/ai', asyncHandler(controller.createAIRecipe))
recipeRoutes.put('/:id/ai', asyncHandler(controller.editAIRecipe))
recipeRoutes.post('/', asyncHandler(controller.createRecipe))
recipeRoutes.put('/:id', asyncHandler(controller.updateRecipe))
recipeRoutes.delete('/:id', asyncHandler(controller.deleteRecipe))

export const groceryListRoutes = Router()
groceryListRoutes.use(authMiddleware)
groceryListRoutes.get('/', asyncHandler(controller.listGroceryLists))
groceryListRoutes.post('/add-items', asyncHandler(controller.addGroceryItems))
groceryListRoutes.get('/:id', asyncHandler(controller.getGroceryList))
groceryListRoutes.post('/generate', asyncHandler(controller.generateGroceryList))
groceryListRoutes.put('/:id', asyncHandler(controller.updateGroceryList))
groceryListRoutes.post('/:id/initiate-shopping', asyncHandler(controller.initiateShopping))

export const foodLogRoutes = Router()
foodLogRoutes.use(authMiddleware)
foodLogRoutes.get('/', asyncHandler(controller.listFoodLog))
foodLogRoutes.get('/daily/:date', asyncHandler(controller.getDailyNutrition))
foodLogRoutes.get('/:id', asyncHandler(controller.getFoodLogEntry))
foodLogRoutes.post('/', asyncHandler(controller.createFoodLog))
foodLogRoutes.post('/barcode', asyncHandler(controller.scanBarcode))
foodLogRoutes.post('/photo', upload.single('image'), asyncHandler(controller.scanPhoto))
foodLogRoutes.put('/:id', asyncHandler(controller.updateFoodLog))
foodLogRoutes.delete('/:id', asyncHandler(controller.deleteFoodLog))
