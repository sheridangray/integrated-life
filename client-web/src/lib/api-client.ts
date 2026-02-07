import type { User } from '@integrated-life/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type AuthTokens = {
	accessToken: string
	refreshToken: string
	expiresAt: number
}

let tokenProvider: (() => AuthTokens | null) | null = null

export function setTokenProvider(provider: () => AuthTokens | null) {
	tokenProvider = provider
}

async function getValidAccessToken(): Promise<string | null> {
	const tokens = tokenProvider?.()
	if (!tokens) return null

	const now = Date.now()
	const bufferMs = 60 * 1000
	if (tokens.expiresAt - bufferMs > now) {
		return tokens.accessToken
	}

	const res = await fetch(`${API_URL}/v1/auth/refresh`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refreshToken: tokens.refreshToken })
	})

	if (!res.ok) return null

	const data = await res.json()
	const expiresAt = Date.now() + data.expiresIn * 1000
	tokenProvider = () => ({
		accessToken: data.accessToken,
		refreshToken: tokens.refreshToken,
		expiresAt
	})
	return data.accessToken
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = await getValidAccessToken()
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...options.headers
	}
	if (token) {
		;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
	}

	const res = await fetch(`${API_URL}${path}`, { ...options, headers })

	if (res.status === 401 && token) {
		tokenProvider = null
	}

	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
		throw new Error(err.error?.message ?? res.statusText)
	}

	return res.json()
}

export async function fetchCurrentUser(): Promise<User | null> {
	try {
		return await apiFetch<User>('/v1/auth/me')
	} catch {
		return null
	}
}
