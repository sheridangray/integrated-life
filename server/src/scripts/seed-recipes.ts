import mongoose from 'mongoose'
import { runRecipeSeed } from '../seeds/recipes'

async function main() {
	// On Render, env vars are injected directly (no .env file)
	// On local dev, you need a .env file in server/ directory
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
