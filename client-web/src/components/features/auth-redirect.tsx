'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export function AuthRedirect() {
	const { user, isLoading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (isLoading) return
		if (user) {
			router.replace('/dashboard')
		} else {
			router.replace('/login')
		}
	}, [user, isLoading, router])

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
			<div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
		</div>
	)
}
