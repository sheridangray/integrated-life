/**
 * Vitest setup file — runs before each test file is loaded.
 *
 * Sets process.env so that server/src/config/env.ts validation passes
 * when any server module is transitively imported.
 *
 * IMPORTANT: This file must NOT import anything from config, app, features,
 * or models. It only sets process.env values.
 */

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long'
process.env.GOOGLE_CLIENT_ID_WEB = 'test-web.apps.googleusercontent.com'
process.env.GOOGLE_CLIENT_SECRET_WEB = 'test-secret'
process.env.GOOGLE_CLIENT_ID_IOS = 'test-ios.apps.googleusercontent.com'
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-placeholder'
process.env.API_URL = 'http://localhost:3001'
process.env.WEB_URL = 'http://localhost:3000'
