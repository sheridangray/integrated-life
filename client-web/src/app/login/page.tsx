'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { GoogleLoginButton } from '@/components/features/google-login-button'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? ''

export default function LoginPage() {
	const { login, user } = useAuth()
	const router = useRouter()

	if (user) {
		router.replace('/dashboard')
		return null
	}

	const handleGoogleSuccess = async (idToken: string) => {
		const res = await fetch(`${API_URL}/v1/auth/google`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ idToken })
		})

		if (!res.ok) {
			const err = await res.json().catch(() => ({}))
			throw new Error(err.error?.message ?? 'Authentication failed')
		}

		const data = await res.json()
		login(data.accessToken, data.refreshToken, data.expiresIn)
		router.replace('/dashboard')
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
			<main className="flex w-full max-w-md flex-col items-center gap-8 rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
				<h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
					Integrated Life
				</h1>
				<p className="text-center text-zinc-600 dark:text-zinc-400">
					Sign in to continue
				</p>
				{GOOGLE_CLIENT_ID ? (
					<GoogleLoginButton clientId={GOOGLE_CLIENT_ID} onSuccess={handleGoogleSuccess} />
				) : (
					<p className="text-sm text-amber-600 dark:text-amber-400">
						NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB is not configured
					</p>
				)}
			</main>
		</div>
	)
}
