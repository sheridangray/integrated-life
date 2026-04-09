# Integrated Life - Project Context

## Architecture

Monorepo with npm workspaces:
- `shared/` - Shared types, schemas, utilities (Zod, TypeScript)
- `server/` - Express API server
- `client-web/` - Next.js web client
- `client-mobile/` - iOS app (Swift/SwiftUI)

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **API:** Express + OpenAPI
- **Web:** Next.js 16 + React 19
- **Mobile:** iOS native (Swift)
- **Validation:** Zod
- **Testing:** Vitest (all workspaces)

## Testing

- **Run:** `npm test` (runs all workspace tests)
- **Framework:** Vitest
- **Workspaces:** shared, server, client-web
- **Coverage goal:** 80%+

## Test Coverage

- **Minimum:** 60%
- **Target:** 80%

## Scripts

```
npm run dev:server    # Start API dev server
npm run dev:web       # Start Next.js dev server
npm run build         # Build all workspaces
npm test              # Run all tests
```

## Git Workflow

- Feature branches from `main`
- PRs for all changes
- `/ship` workflow handles: tests, coverage, review, version bump, changelog, PR creation
