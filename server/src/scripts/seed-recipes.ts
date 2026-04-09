import mongoose from 'mongoose'
import { config } from 'dotenv'
import { runRecipeSeed } from '../seeds/recipes'

config()

async function main() {
	const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URL
	if (!mongoUrl) {
		console.error('MONGODB_URI or MONGO_URL not set')
		process.exit(1)
	}

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
