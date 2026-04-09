# Food Pillar API

The Food pillar supports weekly meal planning, recipe management, grocery list generation, and daily food logging with barcode/photo scanning.

## Architecture

```
shared/src/food.ts              Zod schemas + TypeScript types
server/src/models/              Mongoose models (Recipe, MealPlan, GroceryList, FoodLogEntry)
server/src/features/food/
├── routes.ts                   Express routers (4 route groups)
├── controller.ts               Request validation + response formatting
├── service.ts                  Business logic (grocery gen, barcode lookup, photo scan)
├── repository.ts               MongoDB data access
├── validators.ts               Zod schema re-exports from shared
├── types.ts                    Type re-exports + PaginatedResult
└── __tests__/                  Vitest unit + integration tests
```

## Route Groups

| Prefix | Domain |
|--------|--------|
| `/v1/food/recipes` | Recipe CRUD with search |
| `/v1/food/meal-plans` | Weekly meal plan management |
| `/v1/food/grocery-lists` | Grocery list generation + shopping |
| `/v1/food/log` | Food logging (manual, barcode, photo) |

All routes require JWT authentication.

## Quick Start

```bash
# Install dependencies
npm install

# Build shared schemas
npm run build --workspace=shared

# Run server
npm run dev:server

# Run tests
npx --workspace=server vitest run src/features/food/
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | No | Enables photo-based food scanning via Claude Vision |

## External Dependencies

- **Open Food Facts API** — barcode → nutrition lookup (no API key required)
- **Anthropic Claude Vision** — meal photo → nutrition estimation (requires API key)
