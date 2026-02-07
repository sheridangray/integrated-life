'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { User } from '@integrated-life/shared'
import { fetchCurrentUser, setTokenProvider } from '@/lib/api-client'

type AuthState = {
	user: User | null
	isLoading: boolean
	login: (accessToken: string, refreshToken: string, expiresIn: number) => void
	logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

type Tokens = {
	accessToken: string
	refreshToken: string
	expiresAt: number
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [tokens, setTokens] = useState<Tokens | null>(null)
	const tokensRef = useRef<Tokens | null>(null)

	tokensRef.current = tokens

	useEffect(() => {
		const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_tokens') : null
		if (stored) {
			try {
				const parsed = JSON.parse(stored)
				if (parsed.accessToken && parsed.refreshToken && parsed.expiresAt) {
					setTokens(parsed)
				} else {
					localStorage.removeItem('auth_tokens')
				}
			} catch {
				localStorage.removeItem('auth_tokens')
			}
		} else {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		if (!tokens) {
			setTokenProvider(() => null)
			setUser(null)
			setIsLoading(false)
			return
		}

		setTokenProvider(() => tokensRef.current)

		fetchCurrentUser()
			.then(setUser)
			.catch(() => {
				setTokens(null)
				localStorage.removeItem('auth_tokens')
			})
			.finally(() => setIsLoading(false))
	}, [tokens])

	const login = useCallback((accessToken: string, refreshToken: string, expiresIn: number) => {
		const expiresAt = Date.now() + expiresIn * 1000
		const t = { accessToken, refreshToken, expiresAt }
		setTokens(t)
		localStorage.setItem('auth_tokens', JSON.stringify(t))
	}, [])

	const logout = useCallback(() => {
		setTokens(null)
		setUser(null)
		localStorage.removeItem('auth_tokens')
		setTokenProvider(() => null)
	}, [])

	return (
		<AuthContext.Provider value={{ user, isLoading, login, logout }}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be used within AuthProvider')
	return ctx
}
