import path from 'path'
import { existsSync } from 'fs'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { runRecipeSeed } from '../seeds/recipes'

/** Load monorepo-root `.env` (same layout as `src/config/env.ts`, but from `src/scripts`). */
function loadRootEnv(): void {
	const fromSource = path.resolve(__dirname, '../../../.env')
	const fromDist = path.resolve(__dirname, '../../../../.env')
	const candidates = [
		fromSource,
		fromDist,
		path.resolve(process.cwd(), '.env'),
		path.resolve(process.cwd(), '..', '.env')
	]
	const envPath = candidates.find((p) => existsSync(p)) ?? fromSource
	dotenv.config({ path: envPath, override: true })
}

loadRootEnv()

async function main() {
	// Render / CI: set MONGODB_URI in the environment. Local: root `.env` loaded above.
	const mongoUrl = process.env.MONGODB_URI
	
	if (!mongoUrl) {
		console.error('Error: MONGODB_URI not set')
		console.error('On Render: Make sure MONGODB_URI is set in Environment tab')
		console.error('On local: Create server/.env with MONGODB_URI=mongodb://...')
		process.exit(1)
	}

	console.log('Connecting to MongoDB...')
	await mongoose.connect(mongoUrl)
	console.log('Connected to MongoDB')

	await runRecipeSeed()

	await mongoose.disconnect()
	console.log('Disconnected from MongoDB')
}

main().catch(err => {
	console.error('Seed failed:', err)
	process.exit(1)
})
