import {
	RecipeFiltersSchema,
	CreateRecipeSchema,
	UpdateRecipeSchema,
	MealPlanFiltersSchema,
	CreateMealPlanSchema,
	UpdateMealPlanSchema,
	GenerateGroceryListSchema,
	UpdateGroceryListSchema,
	AddGroceryItemsSchema,
	FoodLogFiltersSchema,
	CreateFoodLogSchema,
	UpdateFoodLogSchema,
	BarcodeScanSchema
} from '@integrated-life/shared'

export const recipeFiltersValidator = RecipeFiltersSchema
export const createRecipeValidator = CreateRecipeSchema
export const updateRecipeValidator = UpdateRecipeSchema
export const mealPlanFiltersValidator = MealPlanFiltersSchema
export const createMealPlanValidator = CreateMealPlanSchema
export const updateMealPlanValidator = UpdateMealPlanSchema
export const generateGroceryListValidator = GenerateGroceryListSchema
export const addGroceryItemsValidator = AddGroceryItemsSchema
export const updateGroceryListValidator = UpdateGroceryListSchema
export const foodLogFiltersValidator = FoodLogFiltersSchema
export const createFoodLogValidator = CreateFoodLogSchema
export const updateFoodLogValidator = UpdateFoodLogSchema
export const barcodeScanValidator = BarcodeScanSchema
