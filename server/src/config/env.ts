import path from 'path'
import { existsSync } from 'fs'
import dotenv from 'dotenv'
import { z } from 'zod'

/** Repo-root `.env` when running from source (`server/src/config`). */
const envFromSourceTree = path.resolve(__dirname, '../../../.env')
/** Repo-root `.env` when running compiled (`server/dist/src/config`). */
const envFromDistTree = path.resolve(__dirname, '../../../../.env')

function resolveEnvPath(): string {
	const candidates = [
		envFromSourceTree,
		envFromDistTree,
		path.resolve(process.cwd(), '.env'),
		path.resolve(process.cwd(), '..', '.env')
	]
	return candidates.find((p) => existsSync(p)) ?? envFromSourceTree
}

// Default dotenv does not override existing process.env keys. Empty exports in the shell
// (e.g. R2_ACCESS_KEY_ID=) would otherwise hide values from the repo-root `.env`.
dotenv.config({ path: resolveEnvPath(), override: true })

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
	ANTHROPIC_API_KEY: z.string().optional().default(''),
	/** Cloudflare R2 image storage */
	CLOUDFLARE_ACCOUNT_ID: z.string().optional().default(''),
	R2_ACCESS_KEY_ID: z.string().optional().default(''),
	R2_SECRET_ACCESS_KEY: z.string().optional().default(''),
	R2_BUCKET_NAME: z.string().optional().default('integrated-life-images'),
	R2_PUBLIC_URL: z.string().optional().default(''),
	/** APNs .p8 key — optional; when set with KEY_ID and TEAM_ID, server sends remote pushes */
	APNS_KEY_ID: z.string().optional(),
	APNS_TEAM_ID: z.string().optional(),
	APNS_KEY_PATH: z.string().optional(),
	/** Set to "true" to force sandbox (development) APNs even in production NODE_ENV */
	APNS_USE_SANDBOX: z.string().optional(),
	/** OpenClaw webhook for Instacart automation */
	OPENCLAW_WEBHOOK_URL: z.string().optional().default(''),
	OPENCLAW_HOOKS_TOKEN: z.string().optional().default('')
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
