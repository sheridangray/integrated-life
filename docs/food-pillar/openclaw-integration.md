# OpenClaw / Instacart Integration

## Overview

The `POST /v1/food/grocery-lists/:id/initiate-shopping` endpoint builds a shopping prompt from unchecked grocery items and fires it to OpenClaw, which handles the Instacart order asynchronously. OpenClaw messages the user on Slack for decisions and confirmations.

## Endpoint

```
POST /v1/food/grocery-lists/:id/initiate-shopping
Authorization: Bearer <token>
Content-Type: application/json

{
  "customInstructions": "optional — appended to the grocery list in the prompt"
}
```

## Response Payload

```json
{
  "groceryListId": "6789abcdef012345",
  "status": "initiated",
  "itemCount": 5
}
```

## Behavior

1. Fetches the grocery list by ID (verifies user ownership)
2. Filters to unchecked items only (returns 400 if none)
3. Builds a natural-language prompt with the item list and optional custom instructions
4. Updates grocery list status to `ordered`
5. POSTs the prompt to the OpenClaw webhook (`OPENCLAW_WEBHOOK_URL`)
6. Returns the simplified response to the client

## Webhook Payload (to OpenClaw)

```json
{
  "message": "Shop for this week's meal plan on Instacart.\n\nGROCERY LIST:\n- 4 lbs Chicken breast\n- 2 heads Broccoli\n...\n\n<custom instructions>",
  "name": "Instacart Order",
  "deliver": "announce",
  "channel": "slack",
  "to": "user:U0ALXGJEY4Q"
}
```

OpenClaw returns `202 Accepted` with a task ID. The actual work happens asynchronously.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENCLAW_WEBHOOK_URL` | Yes | OpenClaw agent endpoint URL |
| `OPENCLAW_HOOKS_TOKEN` | Yes | Bearer token for webhook auth |

If either is missing, the webhook is skipped and a warning is logged. The grocery list status still updates to `ordered`.

## Custom Instructions

The iOS app stores an editable prompt in `UserDefaults` under `openclaw.instacartPrompt`. Users can edit this from Profile → Integrations → OpenClaw. The prompt includes store rules, pantry staples to exclude, ordering preferences, and instructions for the agent.

## Error Handling

- Webhook failures are caught and logged but do not fail the request
- The grocery list remains in `ordered` status regardless of webhook outcome
- Slack is the fallback channel for any issues (OpenClaw messages the user directly)
