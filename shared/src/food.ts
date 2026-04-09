import { z } from 'zod'

// --- Enums ---

export const MealTypeEnum = z.enum(['breakfast', 'lunch', 'dinner', 'snack'])
export type MealType = z.infer<typeof MealTypeEnum>

export const IngredientCategoryEnum = z.enum([
	'produce',
	'meat',
	'seafood',
	'dairy',
	'bakery',
	'pantry',
	'frozen',
	'beverages',
	'other'
])
export type IngredientCategory = z.infer<typeof IngredientCategoryEnum>

export const MealPlanStatusEnum = z.enum(['proposed', 'confirmed', 'shopping', 'complete'])
export type MealPlanStatus = z.infer<typeof MealPlanStatusEnum>

export const GroceryListStatusEnum = z.enum(['draft', 'ordered', 'complete'])
export type GroceryListStatus = z.infer<typeof GroceryListStatusEnum>

export const FoodLogSourceEnum = z.enum(['barcode', 'photo', 'manual', 'recipe'])
export type FoodLogSource = z.infer<typeof FoodLogSourceEnum>

export const StoreEnum = z.enum(['costco', 'safeway', 'other'])
export type Store = z.infer<typeof StoreEnum>

// --- Core Objects ---

export const NutritionSchema = z.object({
	// Basic macros (existing)
	calories: z.number().min(0),
	protein: z.number().min(0), // grams
	carbs: z.number().min(0), // grams
	fat: z.number().min(0), // grams
	fiber: z.number().min(0), // grams

	// Expanded macros
	sugar: z.number().optional().default(0), // grams
	water: z.number().optional().default(0), // mL

	// Fat breakdown
	saturatedFat: z.number().optional().default(0), // grams
	monounsaturatedFat: z.number().optional().default(0), // grams
	polyunsaturatedFat: z.number().optional().default(0), // grams
	cholesterol: z.number().optional().default(0), // mg
	transFat: z.number().optional().default(0), // grams

	// Vitamins
	vitaminA: z.number().optional().default(0), // mcg
	vitaminB6: z.number().optional().default(0), // mg
	vitaminB12: z.number().optional().default(0), // mcg
	vitaminC: z.number().optional().default(0), // mg
	vitaminD: z.number().optional().default(0), // mcg
	vitaminE: z.number().optional().default(0), // mg
	vitaminK: z.number().optional().default(0), // mcg
	thiamin: z.number().optional().default(0), // mg (B1)
	riboflavin: z.number().optional().default(0), // mg (B2)
	niacin: z.number().optional().default(0), // mg (B3)
	folate: z.number().optional().default(0), // mcg
	pantothenicAcid: z.number().optional().default(0), // mg (B5)
	biotin: z.number().optional().default(0), // mcg

	// Minerals
	calcium: z.number().optional().default(0), // mg
	iron: z.number().optional().default(0), // mg
	magnesium: z.number().optional().default(0), // mg
	manganese: z.number().optional().default(0), // mg
	phosphorus: z.number().optional().default(0), // mg
	potassium: z.number().optional().default(0), // mg
	zinc: z.number().optional().default(0), // mg
	selenium: z.number().optional().default(0), // mcg
	copper: z.number().optional().default(0), // mg
	chromium: z.number().optional().default(0), // mcg
	molybdenum: z.number().optional().default(0), // mcg
	chloride: z.number().optional().default(0), // mg
	iodine: z.number().optional().default(0), // mcg
	sodium: z.number().optional().default(0), // mg

	// Other
	caffeine: z.number().optional().default(0) // mg
})
export type Nutrition = z.infer<typeof NutritionSchema>

export const IngredientSchema = z.object({
	name: z.string().min(1),
	quantity: z.number().min(0),
	unit: z.string().min(1),
	category: IngredientCategoryEnum
})
export type Ingredient = z.infer<typeof IngredientSchema>

// --- Recipes ---

export const RecipeSchema = z.object({
	id: z.string(),
	userId: z.string(),
	name: z.string().min(1),
	description: z.string().optional(),
	imageUrl: z.string().optional(),
	servings: z.number().int().positive(),
	prepTime: z.number().int().min(0),
	cookTime: z.number().int().min(0),
	ingredients: z.array(IngredientSchema),
	instructions: z.array(z.string()),
	tags: z.array(z.string()),
	nutritionPerServing: NutritionSchema
})
export type Recipe = z.infer<typeof RecipeSchema>

export const CreateRecipeSchema = RecipeSchema.omit({ id: true, userId: true })
export type CreateRecipe = z.infer<typeof CreateRecipeSchema>

export const UpdateRecipeSchema = CreateRecipeSchema.partial()
export type UpdateRecipe = z.infer<typeof UpdateRecipeSchema>

export const RecipeFiltersSchema = z.object({
	search: z.string().optional(),
	tag: z.string().optional(),
	ingredient: z.string().optional(),
	page: z
		.string()
		.transform(Number)
		.pipe(z.number().int().positive())
		.optional()
		.default('1'),
	limit: z
		.string()
		.transform(Number)
		.pipe(z.number().int().positive().max(100))
		.optional()
		.default('20')
})
export type RecipeFilters = z.infer<typeof RecipeFiltersSchema>

// --- Meals & Meal Plans ---

export const MealSchema = z.object({
	recipeId: z.string(),
	scheduledDate: z.string(),
	mealType: MealTypeEnum,
	servings: z.number().int().positive().default(1)
})
export type Meal = z.infer<typeof MealSchema>

export const MealPlanSchema = z.object({
	id: z.string(),
	userId: z.string(),
	weekStartDate: z.string(),
	meals: z.array(MealSchema),
	status: MealPlanStatusEnum
})
export type MealPlan = z.infer<typeof MealPlanSchema>

export const CreateMealPlanSchema = MealPlanSchema.omit({ id: true, userId: true })
export type CreateMealPlan = z.infer<typeof CreateMealPlanSchema>

export const UpdateMealPlanSchema = z.object({
	meals: z.array(MealSchema).optional(),
	status: MealPlanStatusEnum.optional()
})
export type UpdateMealPlan = z.infer<typeof UpdateMealPlanSchema>

export const MealPlanFiltersSchema = z.object({
	weekStartDate: z.string().optional(),
	status: MealPlanStatusEnum.optional(),
	page: z
		.string()
		.transform(Number)
		.pipe(z.number().int().positive())
		.optional()
		.default('1'),
	limit: z
		.string()
		.transform(Number)
		.pipe(z.number().int().positive().max(100))
		.optional()
		.default('20')
})
export type MealPlanFilters = z.infer<typeof MealPlanFiltersSchema>

// --- Grocery Lists ---

export const GroceryItemSchema = z.object({
	ingredient: IngredientSchema,
	store: StoreEnum,
	checked: z.boolean().default(false),
	notes: z.string().optional()
})
export type GroceryItem = z.infer<typeof GroceryItemSchema>

export const GroceryListSchema = z.object({
	id: z.string(),
	userId: z.string(),
	mealPlanId: z.string(),
	items: z.array(GroceryItemSchema),
	status: GroceryListStatusEnum
})
export type GroceryList = z.infer<typeof GroceryListSchema>

export const UpdateGroceryListSchema = z.object({
	items: z.array(GroceryItemSchema).optional(),
	status: GroceryListStatusEnum.optional()
})
export type UpdateGroceryList = z.infer<typeof UpdateGroceryListSchema>

export const GenerateGroceryListSchema = z.object({
	mealPlanId: z.string().min(1)
})
export type GenerateGroceryList = z.infer<typeof GenerateGroceryListSchema>

// --- Food Log ---

export const FoodSchema = z.object({
	name: z.string().min(1),
	brand: z.string().optional(),
	nutrition: NutritionSchema
})
export type Food = z.infer<typeof FoodSchema>

export const FoodLogEntrySchema = z.object({
	id: z.string(),
	userId: z.string(),
	date: z.string(),
	mealType: MealTypeEnum,
	source: FoodLogSourceEnum,
	food: FoodSchema,
	servingSize: z.string(),
	servings: z.number().positive(),
	notes: z.string().optional()
})
export type FoodLogEntry = z.infer<typeof FoodLogEntrySchema>

export const CreateFoodLogSchema = z.object({
	date: z.string(),
	mealType: MealTypeEnum,
	food: FoodSchema,
	servingSize: z.string().min(1),
	servings: z.number().positive(),
	notes: z.string().optional()
})
export type CreateFoodLog = z.infer<typeof CreateFoodLogSchema>

export const UpdateFoodLogSchema = CreateFoodLogSchema.partial()
export type UpdateFoodLog = z.infer<typeof UpdateFoodLogSchema>

export const FoodLogFiltersSchema = z.object({
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	mealType: MealTypeEnum.optional(),
	page: z
		.string()
		.transform(Number)
		.pipe(z.number().int().positive())
		.optional()
		.default('1'),
	limit: z
		.string()
		.transform(Number)
		.pipe(z.number().int().positive().max(100))
		.optional()
		.default('20')
})
export type FoodLogFilters = z.infer<typeof FoodLogFiltersSchema>

export const BarcodeScanSchema = z.object({
	barcode: z.string().min(1),
	mealType: MealTypeEnum.optional()
})
export type BarcodeScan = z.infer<typeof BarcodeScanSchema>

// --- Daily Nutrition ---

export const DailyNutritionSchema = z.object({
	date: z.string(),
	totals: NutritionSchema,
	entries: z.array(FoodLogEntrySchema)
})
export type DailyNutrition = z.infer<typeof DailyNutritionSchema>
