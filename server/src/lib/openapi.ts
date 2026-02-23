import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import {
	GoogleAuthRequestSchema,
	AuthResponseSchema,
	RefreshRequestSchema,
	UserSchema,
	ApiErrorSchema,
	ExerciseSchema,
	ExerciseLogSchema,
	CreateExerciseLogSchema,
	WorkoutSchema,
	CreateWorkoutSchema,
	UpdateWorkoutSchema,
	WorkoutLogSchema,
	CreateWorkoutLogSchema,
	AIInsightSchema,
	ExerciseSetSchema
} from '@integrated-life/shared'

extendZodWithOpenApi(z)

const registry = new OpenAPIRegistry()

registry.register('User', UserSchema)
registry.register('AuthResponse', AuthResponseSchema)
registry.register('ApiError', ApiErrorSchema)

registry.registerPath({
	method: 'post',
	path: '/v1/auth/google',
	summary: 'Authenticate with Google ID token',
	request: {
		body: {
			content: {
				'application/json': {
					schema: GoogleAuthRequestSchema
				}
			}
		}
	},
	responses: {
		200: {
			description: 'Authentication successful',
			content: {
				'application/json': {
					schema: AuthResponseSchema
				}
			}
		},
		401: {
			description: 'Invalid Google token',
			content: {
				'application/json': {
					schema: ApiErrorSchema
				}
			}
		}
	}
})

registry.registerPath({
	method: 'post',
	path: '/v1/auth/refresh',
	summary: 'Refresh access token',
	request: {
		body: {
			content: {
				'application/json': {
					schema: RefreshRequestSchema
				}
			}
		}
	},
	responses: {
		200: {
			description: 'Token refreshed',
			content: {
				'application/json': {
					schema: z.object({
						accessToken: z.string(),
						expiresIn: z.number(),
						user: UserSchema
					})
				}
			}
		},
		401: {
			description: 'Invalid or expired refresh token',
			content: {
				'application/json': {
					schema: ApiErrorSchema
				}
			}
		}
	}
})

registry.registerPath({
	method: 'get',
	path: '/v1/auth/me',
	summary: 'Get current user',
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'Current user',
			content: {
				'application/json': {
					schema: UserSchema
				}
			}
		},
		401: {
			description: 'Unauthorized',
			content: {
				'application/json': {
					schema: ApiErrorSchema
				}
			}
		}
	}
})

// --- Health Schemas ---
registry.register('Exercise', ExerciseSchema)
registry.register('ExerciseLog', ExerciseLogSchema)
registry.register('ExerciseSet', ExerciseSetSchema)
registry.register('CreateExerciseLog', CreateExerciseLogSchema)
registry.register('Workout', WorkoutSchema)
registry.register('CreateWorkout', CreateWorkoutSchema)
registry.register('UpdateWorkout', UpdateWorkoutSchema)
registry.register('WorkoutLog', WorkoutLogSchema)
registry.register('CreateWorkoutLog', CreateWorkoutLogSchema)
registry.register('AIInsight', AIInsightSchema)

// --- Exercise Paths ---
registry.registerPath({
	method: 'get',
	path: '/v1/exercises',
	summary: 'List exercises',
	responses: {
		200: {
			description: 'List of exercises',
			content: { 'application/json': { schema: z.array(ExerciseSchema) } }
		}
	}
})

registry.registerPath({
	method: 'get',
	path: '/v1/exercises/{id}',
	summary: 'Get exercise detail',
	responses: {
		200: {
			description: 'Exercise detail',
			content: { 'application/json': { schema: ExerciseSchema } }
		}
	}
})

registry.registerPath({
	method: 'post',
	path: '/v1/exercises/{id}/favorite',
	summary: 'Toggle exercise favorite',
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'Favorite toggled',
			content: { 'application/json': { schema: z.object({ isFavorite: z.boolean() }) } }
		}
	}
})

registry.registerPath({
	method: 'post',
	path: '/v1/exercises/{id}/log',
	summary: 'Log an exercise',
	security: [{ bearerAuth: [] }],
	request: {
		body: { content: { 'application/json': { schema: CreateExerciseLogSchema } } }
	},
	responses: {
		201: {
			description: 'Exercise logged',
			content: { 'application/json': { schema: ExerciseLogSchema } }
		}
	}
})

registry.registerPath({
	method: 'get',
	path: '/v1/exercises/{id}/last-log',
	summary: 'Get last exercise log',
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'Last log',
			content: { 'application/json': { schema: ExerciseLogSchema } }
		}
	}
})

// --- Workout Paths ---
registry.registerPath({
	method: 'get',
	path: '/v1/workouts',
	summary: 'List workouts',
	responses: {
		200: {
			description: 'List of workouts',
			content: { 'application/json': { schema: z.array(WorkoutSchema) } }
		}
	}
})

registry.registerPath({
	method: 'get',
	path: '/v1/workouts/{id}',
	summary: 'Get workout detail',
	responses: {
		200: {
			description: 'Workout detail',
			content: { 'application/json': { schema: WorkoutSchema } }
		}
	}
})

registry.registerPath({
	method: 'post',
	path: '/v1/workouts',
	summary: 'Create workout',
	security: [{ bearerAuth: [] }],
	request: {
		body: { content: { 'application/json': { schema: CreateWorkoutSchema } } }
	},
	responses: {
		201: {
			description: 'Workout created',
			content: { 'application/json': { schema: WorkoutSchema } }
		}
	}
})

registry.registerPath({
	method: 'put',
	path: '/v1/workouts/{id}',
	summary: 'Update workout',
	security: [{ bearerAuth: [] }],
	request: {
		body: { content: { 'application/json': { schema: UpdateWorkoutSchema } } }
	},
	responses: {
		200: {
			description: 'Workout updated',
			content: { 'application/json': { schema: WorkoutSchema } }
		}
	}
})

registry.registerPath({
	method: 'delete',
	path: '/v1/workouts/{id}',
	summary: 'Delete workout',
	security: [{ bearerAuth: [] }],
	responses: { 204: { description: 'Workout deleted' } }
})

registry.registerPath({
	method: 'post',
	path: '/v1/workouts/{id}/log',
	summary: 'Log a workout session',
	security: [{ bearerAuth: [] }],
	request: {
		body: { content: { 'application/json': { schema: CreateWorkoutLogSchema } } }
	},
	responses: {
		201: {
			description: 'Workout logged',
			content: { 'application/json': { schema: WorkoutLogSchema } }
		}
	}
})

// --- History Paths ---
registry.registerPath({
	method: 'get',
	path: '/v1/history',
	summary: 'Get exercise and workout history',
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'Paginated history',
			content: { 'application/json': { schema: z.object({
				items: z.array(z.object({
					type: z.enum(['exercise', 'workout']),
					id: z.string(),
					name: z.string(),
					date: z.string(),
					startTime: z.string(),
					endTime: z.string()
				})),
				total: z.number(),
				page: z.number(),
				limit: z.number(),
				totalPages: z.number()
			}) } }
		}
	}
})

registry.registerPath({
	method: 'get',
	path: '/v1/history/export',
	summary: 'Export history as CSV',
	security: [{ bearerAuth: [] }],
	responses: { 200: { description: 'CSV file' } }
})

// --- AI Insight Paths ---
registry.registerPath({
	method: 'get',
	path: '/v1/health/insights/exercise/{exerciseId}',
	summary: 'Get AI insight for an exercise',
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'AI insight',
			content: { 'application/json': { schema: AIInsightSchema } }
		}
	}
})

registry.registerPath({
	method: 'get',
	path: '/v1/health/insights/summary',
	summary: 'Get AI history summary',
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'AI summary',
			content: { 'application/json': { schema: AIInsightSchema } }
		}
	}
})

registry.registerPath({
	method: 'post',
	path: '/v1/health/insights/monitor/{sampleType}',
	summary: 'Get AI insight for a HealthKit sample type',
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'AI insight',
			content: { 'application/json': { schema: AIInsightSchema } }
		}
	}
})

registry.registerComponent('securitySchemes', 'bearerAuth', {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'JWT'
})

export function generateOpenAPIDocument(apiUrl: string) {
	const generator = new OpenApiGeneratorV3(registry.definitions)

	return generator.generateDocument({
		openapi: '3.0.0',
		info: {
			title: 'Integrated Life API',
			version: '1.0.0',
			description: 'API for Integrated Life - AI-driven personal operating system'
		},
		servers: [{ url: apiUrl }]
	})
}
