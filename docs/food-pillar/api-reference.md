# Food Pillar API Reference

All endpoints require `Authorization: Bearer <token>` header.

## Recipes

### GET /v1/food/recipes
List recipes with optional filtering.

**Query Parameters:**
- `search` (string) — text search on recipe name
- `tag` (string) — filter by tag
- `ingredient` (string) — filter by ingredient name
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

**Response 200:**
```json
{
  "items": [{ "id": "...", "name": "Grilled Chicken", "servings": 4, ... }],
  "total": 15,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### GET /v1/food/recipes/:id
Get a single recipe.

**Response 200:**
```json
{
  "id": "...",
  "userId": "...",
  "name": "Grilled Chicken Breast",
  "description": "Simple grilled chicken",
  "servings": 4,
  "prepTime": 10,
  "cookTime": 20,
  "ingredients": [
    { "name": "chicken breast", "quantity": 2, "unit": "lbs", "category": "meat" }
  ],
  "instructions": ["Season chicken", "Grill 6 min per side"],
  "tags": ["healthy", "protein"],
  "nutritionPerServing": { "calories": 280, "protein": 35, "carbs": 5, "fat": 12, "fiber": 2 }
}
```

### POST /v1/food/recipes
Create a recipe. Body matches the recipe schema (without `id` and `userId`).

**Response 201:** Created recipe object.

### PUT /v1/food/recipes/:id
Update a recipe. Accepts partial recipe body.

**Response 200:** Updated recipe object.

### DELETE /v1/food/recipes/:id
**Response 204:** No content.

---

## Meal Plans

### GET /v1/food/meal-plans
List meal plans.

**Query Parameters:**
- `weekStartDate` (string) — filter by week start
- `status` (string) — proposed | confirmed | shopping | complete
- `page`, `limit`

**Response 200:** Paginated list of meal plans.

### GET /v1/food/meal-plans/current
Get the current week's meal plan.

**Response 200:**
```json
{
  "id": "...",
  "weekStartDate": "2025-01-06T00:00:00.000Z",
  "meals": [
    { "recipeId": "...", "scheduledDate": "2025-01-06T00:00:00.000Z", "mealType": "dinner", "servings": 2 }
  ],
  "status": "confirmed"
}
```

### POST /v1/food/meal-plans
Create a meal plan.

**Request Body:**
```json
{
  "weekStartDate": "2025-01-06T00:00:00.000Z",
  "meals": [
    { "recipeId": "...", "scheduledDate": "2025-01-06", "mealType": "dinner", "servings": 2 }
  ],
  "status": "proposed"
}
```

**Response 201:** Created meal plan.

### PUT /v1/food/meal-plans/:id
Update meals or status.

### DELETE /v1/food/meal-plans/:id
**Response 204.**

---

## Grocery Lists

### GET /v1/food/grocery-lists
List grocery lists. **Response 200:** Paginated list.

### GET /v1/food/grocery-lists/:id
Get a single grocery list.

**Response 200:**
```json
{
  "id": "...",
  "mealPlanId": "...",
  "items": [
    {
      "ingredient": { "name": "Chicken breast", "quantity": 4, "unit": "lbs", "category": "meat" },
      "store": "costco",
      "checked": false,
      "notes": null
    }
  ],
  "status": "draft"
}
```

### POST /v1/food/grocery-lists/generate
Generate a grocery list from a meal plan.

**Request Body:**
```json
{ "mealPlanId": "..." }
```

**Response 201:** Generated grocery list with store assignments and pantry staples excluded.

### PUT /v1/food/grocery-lists/:id
Update items (check off, modify) or status.

### POST /v1/food/grocery-lists/:id/initiate-shopping
Trigger shopping flow. Returns structured list grouped by store.

**Response 200:**
```json
{
  "groceryListId": "...",
  "status": "initiated",
  "stores": {
    "costco": { "items": [...], "count": 3 },
    "safeway": { "items": [...], "count": 5 }
  }
}
```

---

## Food Log

### GET /v1/food/log
List food log entries.

**Query Parameters:**
- `startDate`, `endDate` (string) — date range filter
- `mealType` (string) — breakfast | lunch | dinner | snack
- `page`, `limit`

### GET /v1/food/log/daily/:date
Get daily nutrition summary.

**Response 200:**
```json
{
  "date": "2025-01-15",
  "totals": { "calories": 2100, "protein": 120, "carbs": 250, "fat": 70, "fiber": 28 },
  "entries": [...]
}
```

### POST /v1/food/log
Create a manual food log entry.

**Request Body:**
```json
{
  "date": "2025-01-15",
  "mealType": "lunch",
  "food": {
    "name": "Turkey Sandwich",
    "nutrition": { "calories": 400, "protein": 25, "carbs": 45, "fat": 12, "fiber": 3 }
  },
  "servingSize": "1 sandwich",
  "servings": 1
}
```

### POST /v1/food/log/barcode
Look up nutrition by barcode via Open Food Facts.

**Request Body:**
```json
{ "barcode": "016000275263", "mealType": "snack" }
```

**Response 201:** Food log entry with nutrition from Open Food Facts.

### POST /v1/food/log/photo
Scan a meal photo for nutrition estimation.

**Request:** `multipart/form-data` with `image` file field and optional `mealType` field.

**Response 201:** Food log entry with AI-estimated nutrition.

### PUT /v1/food/log/:id
Update an entry.

### DELETE /v1/food/log/:id
**Response 204.**
