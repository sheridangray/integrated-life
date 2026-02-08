/**
 * Integration test helper — starts MongoMemoryServer and connects Mongoose.
 *
 * Import this in integration test files and call setupIntegrationTest()
 * which registers beforeAll / afterAll hooks.
 *
 * Unit tests should NOT import this file.
 */

import { beforeAll, afterAll, afterEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongod: MongoMemoryServer | null = null

/**
 * Call inside a describe() block. Registers beforeAll / afterAll hooks that:
 * 1. Start an in-memory MongoDB and override MONGODB_URI
 * 2. Connect Mongoose
 * 3. Clean up on teardown
 */
export function setupIntegrationTest() {
	beforeAll(async () => {
		mongod = await MongoMemoryServer.create()
		const uri = mongod.getUri()
		process.env.MONGODB_URI = uri
		await mongoose.connect(uri)
	})

	afterAll(async () => {
		await mongoose.connection.dropDatabase()
		await mongoose.disconnect()
		if (mongod) {
			await mongod.stop()
			mongod = null
		}
	})

	// Note: no afterEach cleanup by default. The database is dropped in afterAll.
	// If individual test files need per-test isolation, they can add their own
	// afterEach to clear specific collections.
}
