/**
 * One-shot migration: rewrite Recipe imageUrl / images[].url from legacy R2 dev hosts
 * (e.g. bucket.accountid.r2.dev) to R2_PUBLIC_URL (e.g. https://pub-....r2.dev).
 *
 * Usage (from server/, with MONGODB_URI in repo-root .env):
 *   R2_PUBLIC_URL=https://pub-xxxxx.r2.dev npm run migrate:recipe-r2-urls
 *
 * Safe to re-run: skips URLs already under R2_PUBLIC_URL.
 */
import path from 'path'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { rewriteR2DevUrl } from '../lib/r2DevUrlRewrite'
import { Recipe } from '../models/Recipe'

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

async function main() {
	const mongoUrl = process.env.MONGODB_URI
	const newBase = process.env.R2_PUBLIC_URL?.trim()

	if (!mongoUrl) {
		console.error('Error: MONGODB_URI is not set.')
		process.exit(1)
	}
	if (!newBase || !newBase.startsWith('https://')) {
		console.error(
			'Error: R2_PUBLIC_URL must be set to your public bucket URL, e.g.\n' +
				'  R2_PUBLIC_URL=https://pub-5c2a968502d043fe9423dc04e75e584f.r2.dev npm run migrate:recipe-r2-urls'
		)
		process.exit(1)
	}

	console.log(`Connecting to MongoDB…`)
	await mongoose.connect(mongoUrl)

	let updated = 0
	const cursor = Recipe.find({}).cursor()

	for await (const doc of cursor) {
		let changed = false

		if (doc.imageUrl) {
			const next = rewriteR2DevUrl(doc.imageUrl, newBase)
			if (next) {
				doc.imageUrl = next
				changed = true
			}
		}

		if (doc.images?.length) {
			for (const img of doc.images) {
				const next = rewriteR2DevUrl(img.url, newBase)
				if (next) {
					img.url = next
					changed = true
				}
			}
		}

		if (changed) {
			doc.markModified('images')
			await doc.save()
			updated += 1
			console.log(`Updated: "${doc.name}"`)
		}
	}

	await mongoose.disconnect()
	console.log(`Done. Recipes updated: ${updated}`)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
