'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { renderGoogleButton } from '@/lib/google-auth'

type GoogleLoginButtonProps = {
	clientId: string
	onSuccess: (idToken: string) => void
	onError?: (error: Error) => void
}

export function GoogleLoginButton({ clientId, onSuccess, onError }: GoogleLoginButtonProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const handleCallback = useCallback(
		(idToken: string) => {
			try {
				onSuccess(idToken)
			} catch (err) {
				onError?.(err instanceof Error ? err : new Error(String(err)))
			}
		},
		[onSuccess, onError]
	)

	useEffect(() => {
		if (!mounted || !containerRef.current || !clientId) return
		containerRef.current.innerHTML = ''
		renderGoogleButton(containerRef.current, clientId, handleCallback)
	}, [mounted, clientId, handleCallback])

	return <div ref={containerRef} />
}
