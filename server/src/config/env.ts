import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { z } from 'zod'

// Monorepo `.env` lives at repo root. `__dirname` is `server/src/config` (tsx) or
// `server/dist/src/config` (compiled) — old code used one extra `..` and loaded
// the parent folder, so variables were never applied.
function loadRootDotenv() {
	const candidates = [
		path.resolve(__dirname, '../../../.env'),
		path.resolve(__dirname, '../../../../.env'),
	]
	for (const p of candidates) {
		if (fs.existsSync(p)) {
			dotenv.config({ path: p })
			return
		}
	}
	dotenv.config()
}

loadRootDotenv()

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	PORT: z.string().default('3001').transform(Number),
	MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
	JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
	GOOGLE_CLIENT_ID_WEB: z.string().min(1, 'GOOGLE_CLIENT_ID_WEB is required'),
	GOOGLE_CLIENT_SECRET_WEB: z.string().min(1, 'GOOGLE_CLIENT_SECRET_WEB is required'),
	GOOGLE_CLIENT_ID_IOS: z.string().min(1, 'GOOGLE_CLIENT_ID_IOS is required'),
	API_URL: z.string().url().optional().default('http://localhost:3001'),
	WEB_URL: z.string().url().optional().default('http://localhost:3000'),
	MOBILE_BUNDLE_ID: z.string().optional().default('com.integratedlife.app'),
	TOGETHER_AI_API_KEY: z.string().optional().default(''),
	/** APNs .p8 key — optional; when set with KEY_ID and TEAM_ID, server sends remote pushes */
	APNS_KEY_ID: z.string().optional(),
	APNS_TEAM_ID: z.string().optional(),
	APNS_KEY_PATH: z.string().optional(),
	/** Set to "true" to force sandbox (development) APNs even in production NODE_ENV */
	APNS_USE_SANDBOX: z.string().optional()
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
	const result = envSchema.safeParse(process.env)
	if (!result.success) {
		const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n')
		throw new Error(`Invalid environment configuration:\n${issues}`)
	}
	return result.data
}

export const env = loadEnv()
