import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setTokenProvider, apiFetch, fetchCurrentUser } from '../api-client'

const API_URL = 'http://localhost:3001'

// Helper to create a mock fetch Response
function mockResponse(body: unknown, init: { status?: number; ok?: boolean; statusText?: string } = {}) {
	const { status = 200, ok = status >= 200 && status < 300, statusText = 'OK' } = init
	return {
		ok,
		status,
		statusText,
		json: vi.fn().mockResolvedValue(body),
	} as unknown as Response
}

describe('api-client', () => {
	let mockFetch: ReturnType<typeof vi.fn>

	beforeEach(() => {
		mockFetch = vi.fn()
		vi.stubGlobal('fetch', mockFetch)
		// Reset tokenProvider between tests
		setTokenProvider(null as any)
	})

	describe('apiFetch without token provider', () => {
		it('sends request without Authorization header', async () => {
			mockFetch.mockResolvedValue(mockResponse({ data: 'test' }))

			await apiFetch('/v1/test')

			expect(mockFetch).toHaveBeenCalledOnce()
			const [url, options] = mockFetch.mock.calls[0]
			expect(url).toBe(`${API_URL}/v1/test`)
			expect(options.headers['Authorization']).toBeUndefined()
		})
	})

	describe('apiFetch with fresh token', () => {
		it('sends Authorization header and does not call refresh', async () => {
			setTokenProvider(() => ({
				accessToken: 'fresh-access-token',
				refreshToken: 'refresh-token',
				expiresAt: Date.now() + 10 * 60 * 1000, // 10 min in the future
			}))

			mockFetch.mockResolvedValue(mockResponse({ data: 'test' }))

			await apiFetch('/v1/test')

			// Only one fetch call (the actual request, no refresh)
			expect(mockFetch).toHaveBeenCalledOnce()
			const [, options] = mockFetch.mock.calls[0]
			expect(options.headers['Authorization']).toBe('Bearer fresh-access-token')
		})
	})

	describe('apiFetch with expired token', () => {
		it('calls refresh endpoint first, then makes the original request with new token', async () => {
			setTokenProvider(() => ({
				accessToken: 'expired-access-token',
				refreshToken: 'my-refresh-token',
				expiresAt: Date.now() - 1000, // expired
			}))

			// First call: refresh endpoint
			mockFetch.mockResolvedValueOnce(
				mockResponse({
					accessToken: 'new-access-token',
					expiresIn: 900,
				})
			)
			// Second call: the actual request
			mockFetch.mockResolvedValueOnce(mockResponse({ data: 'test' }))

			await apiFetch('/v1/test')

			expect(mockFetch).toHaveBeenCalledTimes(2)

			// First call should be the refresh
			const [refreshUrl, refreshOptions] = mockFetch.mock.calls[0]
			expect(refreshUrl).toBe(`${API_URL}/v1/auth/refresh`)
			expect(JSON.parse(refreshOptions.body)).toEqual({ refreshToken: 'my-refresh-token' })

			// Second call should use the new token
			const [, requestOptions] = mockFetch.mock.calls[1]
			expect(requestOptions.headers['Authorization']).toBe('Bearer new-access-token')
		})
	})

	describe('apiFetch with expired token and refresh failure', () => {
		it('sends request without token when refresh fails', async () => {
			setTokenProvider(() => ({
				accessToken: 'expired-access-token',
				refreshToken: 'my-refresh-token',
				expiresAt: Date.now() - 1000, // expired
			}))

			// Refresh fails
			mockFetch.mockResolvedValueOnce(
				mockResponse({ error: { message: 'Invalid refresh token' } }, { status: 401, ok: false })
			)
			// The actual request (no token)
			mockFetch.mockResolvedValueOnce(mockResponse({ data: 'test' }))

			await apiFetch('/v1/test')

			expect(mockFetch).toHaveBeenCalledTimes(2)

			// Second call should have no Authorization header
			const [, requestOptions] = mockFetch.mock.calls[1]
			expect(requestOptions.headers['Authorization']).toBeUndefined()
		})
	})

	describe('apiFetch on 401 response', () => {
		it('clears tokenProvider so subsequent calls have no token', async () => {
			setTokenProvider(() => ({
				accessToken: 'will-be-rejected',
				refreshToken: 'refresh',
				expiresAt: Date.now() + 10 * 60 * 1000,
			}))

			// Return 401
			mockFetch.mockResolvedValueOnce(
				mockResponse({ error: { message: 'Unauthorized' } }, { status: 401, ok: false, statusText: 'Unauthorized' })
			)

			await expect(apiFetch('/v1/test')).rejects.toThrow('Unauthorized')

			// Now make another request — should have no Authorization header
			mockFetch.mockResolvedValueOnce(mockResponse({ data: 'test' }))
			await apiFetch('/v1/test2')

			const [, options] = mockFetch.mock.calls[1]
			expect(options.headers['Authorization']).toBeUndefined()
		})
	})

	describe('apiFetch on non-OK response', () => {
		it('throws an error with the message from the response body', async () => {
			mockFetch.mockResolvedValue(
				mockResponse(
					{ error: { message: 'Something went wrong' } },
					{ status: 500, ok: false, statusText: 'Internal Server Error' }
				)
			)

			await expect(apiFetch('/v1/test')).rejects.toThrow('Something went wrong')
		})

		it('falls back to statusText when response body has no message', async () => {
			const res = {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
				json: vi.fn().mockRejectedValue(new Error('parse error')),
			} as unknown as Response
			mockFetch.mockResolvedValue(res)

			await expect(apiFetch('/v1/test')).rejects.toThrow('Internal Server Error')
		})
	})

	describe('fetchCurrentUser', () => {
		it('returns user on success', async () => {
			setTokenProvider(() => ({
				accessToken: 'valid-token',
				refreshToken: 'refresh',
				expiresAt: Date.now() + 10 * 60 * 1000,
			}))

			const mockUser = { id: '123', email: 'test@example.com', name: 'Test', avatarUrl: null }
			mockFetch.mockResolvedValue(mockResponse(mockUser))

			const user = await fetchCurrentUser()

			expect(user).toEqual(mockUser)
		})

		it('returns null on failure', async () => {
			mockFetch.mockResolvedValue(
				mockResponse(
					{ error: { message: 'Unauthorized' } },
					{ status: 401, ok: false, statusText: 'Unauthorized' }
				)
			)

			const user = await fetchCurrentUser()

			expect(user).toBeNull()
		})
	})
})
