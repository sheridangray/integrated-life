import type {
	Recipe,
	CreateRecipe,
	UpdateRecipe,
	RecipeFilters,
	MealPlan,
	Meal,
	CreateMealPlan,
	UpdateMealPlan,
	MealPlanFilters,
	GroceryList,
	GroceryItem,
	UpdateGroceryList,
	GenerateGroceryList,
	FoodLogEntry,
	CreateFoodLog,
	UpdateFoodLog,
	FoodLogFilters,
	BarcodeScan,
	Nutrition,
	Ingredient,
	DailyNutrition,
	Food
} from '@integrated-life/shared'

export type {
	Recipe,
	CreateRecipe,
	UpdateRecipe,
	RecipeFilters,
	MealPlan,
	Meal,
	CreateMealPlan,
	UpdateMealPlan,
	MealPlanFilters,
	GroceryList,
	GroceryItem,
	UpdateGroceryList,
	GenerateGroceryList,
	FoodLogEntry,
	CreateFoodLog,
	UpdateFoodLog,
	FoodLogFilters,
	BarcodeScan,
	Nutrition,
	Ingredient,
	DailyNutrition,
	Food
}

export type PaginatedResult<T> = {
	items: T[]
	total: number
	page: number
	limit: number
	totalPages: number
}
