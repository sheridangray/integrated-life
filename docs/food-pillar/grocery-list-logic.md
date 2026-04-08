# Grocery List Generation Logic

## Overview

`POST /v1/food/grocery-lists/generate` accepts a `mealPlanId` and produces a deduplicated grocery list with store assignments.

## Algorithm

1. **Fetch meal plan** and its meals
2. **Resolve recipes** — batch-fetch all unique recipe IDs referenced by meals
3. **Aggregate ingredients** — for each meal × recipe, collect all ingredients
4. **Filter pantry staples** — remove items from the pantry staples set
5. **Deduplicate** — group by lowercase ingredient name
   - Same name + same unit → sum quantities (scaled by meal servings)
   - Same name + different unit → keep as separate items with unit suffix
6. **Assign stores** — based on ingredient category
7. **Create grocery list** — save to database with status `draft`

## Store Assignment Rules

| Category | Store |
|----------|-------|
| meat | Costco |
| seafood | Costco |
| produce | Costco |
| dairy | Safeway |
| bakery | Safeway |
| pantry | Safeway |
| frozen | Safeway |
| beverages | Safeway |
| other | Safeway |

## Pantry Staples (Excluded)

These ingredients are assumed to be always in stock and are excluded from generated lists:

- kosher salt, salt
- black pepper, pepper
- olive oil, extra virgin olive oil
- neutral oil, vegetable oil, canola oil
- butter, unsalted butter
- garlic
- soy sauce
- fish sauce
- jasmine rice, rice
- cumin, ground cumin
- paprika, smoked paprika
- oregano, dried oregano
- thyme, dried thyme
- bay leaves, bay leaf
- cinnamon, ground cinnamon
- chili powder
- turmeric, ground turmeric
- coriander, ground coriander
- red pepper flakes, crushed red pepper

## Deduplication Example

Given two recipes in a meal plan:
- Recipe A (2 servings): chicken breast 2 lbs, broccoli 1 head
- Recipe B (1 serving): chicken breast 1 lb, cheddar cheese 8 oz

Result:
| Ingredient | Quantity | Unit | Store |
|-----------|----------|------|-------|
| Chicken breast | 5 | lbs | Costco |
| Broccoli | 2 | head | Costco |
| Cheddar cheese | 8 | oz | Safeway |

(Chicken breast: 2 lbs × 2 servings + 1 lb × 1 serving = 5 lbs)

## Quantity Scaling

Ingredient quantities are multiplied by the meal's `servings` field before aggregation. This accounts for cooking for different group sizes across different meals in the week.
