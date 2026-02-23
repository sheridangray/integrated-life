import slugify from 'slugify'
import { Exercise } from '../models/Exercise'
import { Workout } from '../models/Workout'
import { exerciseSeeds } from './exercises'
import { workoutSeeds } from './workouts'
import { logger } from '../lib/logger'

export async function seedHealthData() {
	const existingCount = await Exercise.countDocuments({ isGlobal: true })
	if (existingCount >= exerciseSeeds.length) {
		logger.debug('Health seed data already exists, skipping')
		return
	}

	logger.info('Seeding health data...')

	const exerciseDocs = await Promise.all(
		exerciseSeeds.map(async (seed) => {
			const slug = slugify(seed.name, { lower: true, strict: true })
			return Exercise.findOneAndUpdate(
				{ slug },
				{ ...seed, slug, isGlobal: true },
				{ upsert: true, new: true, setDefaultsOnInsert: true }
			)
		})
	)

	const exerciseByName = new Map(exerciseDocs.map((doc) => [doc.name, doc]))

	for (const workoutSeed of workoutSeeds) {
		const exercises = workoutSeed.exercises
			.map((name, idx) => {
				const doc = exerciseByName.get(name)
				if (!doc) {
					logger.warn(`Exercise not found for workout seed: ${name}`)
					return null
				}
				return { exerciseId: doc._id, order: idx }
			})
			.filter(Boolean)

		await Workout.findOneAndUpdate(
			{ name: workoutSeed.name, isGlobal: true },
			{
				name: workoutSeed.name,
				difficulty: workoutSeed.difficulty,
				isGlobal: true,
				exercises
			},
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		)
	}

	logger.info(`Seeded ${exerciseDocs.length} exercises and ${workoutSeeds.length} workouts`)
}
