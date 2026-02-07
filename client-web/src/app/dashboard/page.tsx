'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function DashboardPage() {
	const { user, isLoading, logout } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!isLoading && !user) {
			router.replace('/login')
		}
	}, [user, isLoading, router])

	if (isLoading || !user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
			</div>
		)
	}

	return (
		<div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
			<header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
				<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
					Integrated Life
				</h1>
				<button
					onClick={logout}
					className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
				>
					Sign out
				</button>
			</header>
			<main className="flex flex-1 flex-col items-center justify-center p-8">
				<div className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
					<p className="text-zinc-600 dark:text-zinc-400">Welcome,</p>
					<p className="text-xl font-medium text-zinc-900 dark:text-zinc-50">
						{user?.name ?? user?.email ?? 'User'}
					</p>
					{user?.email && (
						<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
							{user.email}
						</p>
					)}
				</div>
			</main>
		</div>
	)
}
