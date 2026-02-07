# Integrated Life

AI-driven personal operating system that proactively helps people live better by unifying time, health, relationships, and resources into a single intelligent system.

## Project Structure

```
integrated-life/
├── client-mobile/    # iOS app (SwiftUI, Xcode)
├── client-web/       # Next.js web app
├── server/           # Express + Node.js API
├── shared/           # Zod schemas, TypeScript types (shared by server + web)
└── scripts/          # Build and codegen scripts
```

## Prerequisites

- **Node.js** 18+
- **MongoDB** (local or Atlas)
- **Google Cloud Console** project (for OAuth)
- **Xcode** (for iOS development)
- **Docker** or **Java** (for OpenAPI → Swift codegen)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/sheridangray/integrated-life.git
cd integrated-life
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Google OAuth credentials (see below)
npm install
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable **Google Identity** (or **Google+ API**)
4. Create OAuth 2.0 credentials:
   - **Web client**: Add `http://localhost:3000` to authorized JavaScript origins and redirect URIs
   - **iOS client**: Add your bundle ID `com.integratedlife.app`; note the reversed client ID for URL scheme
5. Add to `.env`:
   - `GOOGLE_CLIENT_ID_WEB` (Web client ID)
   - `GOOGLE_CLIENT_SECRET_WEB` (Web client secret)
   - `GOOGLE_CLIENT_ID_IOS` (iOS client ID; server verifies tokens from both)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB` (same as GOOGLE_CLIENT_ID_WEB, for Next.js)
   - For iOS: edit `client-mobile/Config.xcconfig` (see step 5 below)

### 3. Run the Server

```bash
npm run dev:server
```

Server runs at `http://localhost:3001`. Ensure MongoDB is running.

### 4. Run the Web App

```bash
npm run dev:web
```

Web app runs at `http://localhost:3000`.

### 5. Run the iOS App

```bash
cd client-mobile
xcodegen generate   # if project not yet generated
open IntegratedLife.xcodeproj
```

In `client-mobile/Config.xcconfig`, set:
- `API_BASE_URL` = your server URL (e.g. `http://localhost:3001` or your Render URL)
- `GOOGLE_CLIENT_ID` = **Integrated Life iOS** client ID from Google Cloud
- `REVERSED_CLIENT_ID` = the iOS URL scheme for that same client (e.g. `com.googleusercontent.apps.121966432796-...`)

Build and run in the simulator.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:server` | Start server with hot reload |
| `npm run dev:web` | Start Next.js dev server |
| `npm run build` | Build shared, server, and client-web |
| `npm run generate:openapi` | Generate `openapi.json` from server |
| `npm run generate:swift` | Generate Swift models from OpenAPI (requires Docker or Java) |
| `npm start` | Start production server |

## API Documentation

When the server is running:

- **OpenAPI spec**: `http://localhost:3001/v1/openapi.json`
- **Swagger UI**: `http://localhost:3001/v1/docs`

## Deployment (Render.com)

1. Create a Web Service on Render
2. Connect your GitHub repo
3. Build command: `npm run build`
4. Start command: `npm start`
5. Add environment variables: `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID_WEB`, `GOOGLE_CLIENT_SECRET_WEB`, `GOOGLE_CLIENT_ID_IOS`, `API_URL`, `WEB_URL`

## Assets

- **App icon**: Add to `client-mobile/IntegratedLife/Assets.xcassets/AppIcon.appiconset/`
- **Logo**: Add to `client-web/public/` for web use

## License

MIT
