# Food Pillar Data Models

## Zod Schemas (shared/src/food.ts)

### Enums

| Enum | Values |
|------|--------|
| `MealTypeEnum` | breakfast, lunch, dinner, snack |
| `IngredientCategoryEnum` | produce, meat, seafood, dairy, bakery, pantry, frozen, beverages, other |
| `MealPlanStatusEnum` | proposed, confirmed, shopping, complete |
| `GroceryListStatusEnum` | draft, ordered, complete |
| `FoodLogSourceEnum` | barcode, photo, manual, recipe |
| `StoreEnum` | costco, safeway, other |

### NutritionSchema
| Field | Type | Constraints |
|-------|------|-------------|
| calories | number | min(0) |
| protein | number | min(0), grams |
| carbs | number | min(0), grams |
| fat | number | min(0), grams |
| fiber | number | min(0), grams |

### IngredientSchema
| Field | Type | Constraints |
|-------|------|-------------|
| name | string | min(1) |
| quantity | number | min(0) |
| unit | string | min(1) |
| category | IngredientCategoryEnum | required |

### RecipeSchema
| Field | Type | Constraints |
|-------|------|-------------|
| id | string | auto-generated |
| userId | string | from auth |
| name | string | min(1) |
| description | string | optional |
| servings | number | int, positive |
| prepTime | number | int, min(0), minutes |
| cookTime | number | int, min(0), minutes |
| ingredients | Ingredient[] | array |
| instructions | string[] | array |
| tags | string[] | array |
| nutritionPerServing | Nutrition | required |

### MealPlanSchema
| Field | Type | Constraints |
|-------|------|-------------|
| id | string | auto-generated |
| userId | string | from auth |
| weekStartDate | string | ISO date |
| meals | Meal[] | array of {recipeId, scheduledDate, mealType, servings} |
| status | MealPlanStatusEnum | required |

### GroceryListSchema
| Field | Type | Constraints |
|-------|------|-------------|
| id | string | auto-generated |
| userId | string | from auth |
| mealPlanId | string | reference to MealPlan |
| items | GroceryItem[] | array of {ingredient, store, checked, notes} |
| status | GroceryListStatusEnum | required |

### FoodLogEntrySchema
| Field | Type | Constraints |
|-------|------|-------------|
| id | string | auto-generated |
| userId | string | from auth |
| date | string | ISO date |
| mealType | MealTypeEnum | required |
| source | FoodLogSourceEnum | required |
| food | Food | {name, brand?, nutrition} |
| servingSize | string | e.g. "1 cup", "100g" |
| servings | number | positive |
| notes | string | optional |

## MongoDB Models

### Recipe (server/src/models/Recipe.ts)
- Indexes: `(userId, 1)`, `(tags, 1)`, `(name, 'text')`
- Subdocuments: ingredients (array), nutritionPerServing (embedded)
- Timestamps: createdAt, updatedAt

### MealPlan (server/src/models/MealPlan.ts)
- Indexes: `(userId, 1, weekStartDate, -1)`, `(userId, 1, status, 1)`
- Subdocuments: meals (array with recipeId ObjectId ref)
- Timestamps: createdAt, updatedAt

### GroceryList (server/src/models/GroceryList.ts)
- Indexes: `(userId, 1)`, `(mealPlanId, 1)`
- Subdocuments: items (array with nested ingredient + store + checked)
- Timestamps: createdAt, updatedAt

### FoodLogEntry (server/src/models/FoodLogEntry.ts)
- Indexes: `(userId, 1, date, -1)`, `(userId, 1, mealType, 1)`
- Subdocuments: food (embedded with nested nutrition)
- Timestamps: createdAt, updatedAt
