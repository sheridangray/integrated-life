# OpenClaw / Instacart Integration

## Overview

The `POST /v1/food/grocery-lists/:id/initiate-shopping` endpoint returns a structured shopping list formatted for Instacart automation via OpenClaw.

## Endpoint

```
POST /v1/food/grocery-lists/:id/initiate-shopping
Authorization: Bearer <token>
```

## Response Payload

```json
{
  "groceryListId": "6789abcdef012345",
  "status": "initiated",
  "stores": {
    "costco": {
      "items": [
        {
          "name": "Chicken breast",
          "quantity": 4,
          "unit": "lbs",
          "notes": null
        },
        {
          "name": "Broccoli",
          "quantity": 2,
          "unit": "head",
          "notes": null
        }
      ],
      "count": 2
    },
    "safeway": {
      "items": [
        {
          "name": "Cheddar cheese",
          "quantity": 8,
          "unit": "oz",
          "notes": null
        }
      ],
      "count": 1
    }
  }
}
```

## Behavior

1. Fetches the grocery list by ID (verifies user ownership)
2. Splits items by store assignment (costco vs safeway)
3. Updates grocery list status to `ordered`
4. Returns the structured payload for external automation

## Side Effects

- Grocery list `status` changes from `draft` → `ordered`
- No external webhook is currently fired (stub ready for OpenClaw integration)

## OpenClaw Integration (Future)

To connect to OpenClaw for Instacart automation:

1. Add `OPENCLAW_WEBHOOK_URL` to environment config
2. After building the response payload, POST it to the webhook URL:
   ```typescript
   await fetch(env.OPENCLAW_WEBHOOK_URL, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(payload)
   })
   ```
3. Handle webhook delivery failure gracefully (retry, dead letter queue)
4. The response payload format above is designed to be the webhook body

## Store Mapping for Instacart

| Store Key | Instacart Store |
|-----------|----------------|
| costco | Costco Wholesale |
| safeway | Safeway |

Items in the `other` store category are included in the `safeway` group by default.
