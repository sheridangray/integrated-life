import path from 'path'
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

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
	MOBILE_BUNDLE_ID: z.string().optional().default('com.integratedlife.app')
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
