import { describe, it, expect } from 'vitest'
import { ApiErrorSchema } from '../api'

describe('ApiErrorSchema', () => {
	it('accepts a valid error shape', () => {
		const result = ApiErrorSchema.safeParse({
			error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
			requestId: 'req-123',
		})
		expect(result.success).toBe(true)
	})

	it('accepts a valid error without requestId', () => {
		const result = ApiErrorSchema.safeParse({
			error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
		})
		expect(result.success).toBe(true)
	})

	it('accepts a valid error with details', () => {
		const result = ApiErrorSchema.safeParse({
			error: {
				code: 'VALIDATION_ERROR',
				message: 'Invalid input',
				details: { field: 'email' },
			},
		})
		expect(result.success).toBe(true)
	})

	it('rejects a missing error.code', () => {
		const result = ApiErrorSchema.safeParse({
			error: { message: 'Something went wrong' },
		})
		expect(result.success).toBe(false)
	})

	it('rejects a missing error.message', () => {
		const result = ApiErrorSchema.safeParse({
			error: { code: 'INTERNAL_ERROR' },
		})
		expect(result.success).toBe(false)
	})

	it('rejects a missing error object', () => {
		const result = ApiErrorSchema.safeParse({ requestId: 'req-123' })
		expect(result.success).toBe(false)
	})
})
