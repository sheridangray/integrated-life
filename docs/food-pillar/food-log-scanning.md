# Food Log Scanning

## Barcode Scan

### Endpoint
`POST /v1/food/log/barcode`

### Flow
1. Client sends `{ barcode: "016000275263", mealType: "snack" }`
2. Server calls Open Food Facts API:
   ```
   GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json
   Headers: User-Agent: IntegratedLife/1.0 (github.com/sheridangray/integrated-life)
   ```
3. Check `response.status === 1` (product found)
4. Extract nutrition from `product.nutriments`:
   - `energy-kcal_100g` → calories
   - `proteins_100g` → protein
   - `carbohydrates_100g` → carbs
   - `fat_100g` → fat
   - `fiber_100g` → fiber
5. Extract metadata: `product.product_name`, `product.brands`, `product.serving_size`
6. Create `FoodLogEntry` with `source: 'barcode'`
7. Return the created entry

### Error Handling
| Scenario | Status | Message |
|----------|--------|---------|
| Product not found (status !== 1) | 404 | Product not found for barcode |
| Network/API failure | 502 | Failed to lookup barcode |
| Missing barcode in request | 400 | Validation error |

### Open Food Facts API Notes
- No API key required
- No strict rate limiting (be respectful with User-Agent)
- Nutrition values are per 100g
- Some products may have incomplete nutrition data (fields default to 0)

## Photo Scan

### Endpoint
`POST /v1/food/log/photo`

### Flow
1. Client sends `multipart/form-data` with:
   - `image` — JPEG/PNG/WebP file (max 10MB)
   - `mealType` — optional (defaults to "snack")
2. Server converts image buffer to base64
3. Calls Anthropic Claude claude-sonnet-4-6 Vision API:
   - Sends image with analysis prompt
   - Requests JSON response with: name, servingSize, nutrition breakdown
4. Parses structured JSON response
5. Creates `FoodLogEntry` with `source: 'photo'`
6. Returns the created entry

### Vision Prompt
The prompt asks Claude to:
- Identify visible food items
- Estimate portion sizes
- Provide nutrition breakdown (calories, protein, carbs, fat, fiber)
- Respond with structured JSON only

### Error Handling
| Scenario | Status | Message |
|----------|--------|---------|
| No ANTHROPIC_API_KEY configured | 503 | Photo analysis unavailable |
| Anthropic API error | 503 | Photo analysis unavailable |
| Invalid/unparseable response | 503 | Photo analysis unavailable |
| No image file in request | 400 | Image file is required |

### Configuration
Set `ANTHROPIC_API_KEY` in `.env` to enable photo scanning. Without it, the endpoint returns 503.

Integration module: `server/src/integrations/anthropic.ts`
