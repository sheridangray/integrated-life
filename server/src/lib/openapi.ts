import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import {
	GoogleAuthRequestSchema,
	AuthResponseSchema,
	RefreshRequestSchema,
	UserSchema,
	ApiErrorSchema
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
