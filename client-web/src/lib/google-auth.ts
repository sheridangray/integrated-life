declare global {
	interface Window {
		google?: {
			accounts: {
				id: {
					initialize: (config: {
						client_id: string
						callback: (response: { credential: string }) => void
						auto_select?: boolean
					}) => void
					prompt: () => void
					renderButton: (
						element: HTMLElement,
						config: {
							type?: string
							theme?: string
							size?: string
							text?: string
							callback: (response: { credential: string }) => void
						}
					) => void
				}
			}
		}
	}
}

const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

export function loadGoogleScript(): Promise<void> {
	if (typeof window === 'undefined') return Promise.resolve()
	if (window.google?.accounts?.id) return Promise.resolve()

	return new Promise((resolve, reject) => {
		const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`)
		if (existing) {
			resolve()
			return
		}
		const script = document.createElement('script')
		script.src = GOOGLE_SCRIPT_URL
		script.async = true
		script.defer = true
		script.onload = () => resolve()
		script.onerror = () => reject(new Error('Failed to load Google script'))
		document.head.appendChild(script)
	})
}

export function initGoogleSignIn(
	clientId: string,
	callback: (idToken: string) => void
) {
	loadGoogleScript().then(() => {
		if (!window.google?.accounts?.id) {
			console.error('Google Identity Services not available')
			return
		}
		window.google.accounts.id.initialize({
			client_id: clientId,
			callback: (response) => callback(response.credential)
		})
	})
}

export function renderGoogleButton(
	element: HTMLElement,
	clientId: string,
	callback: (idToken: string) => void
) {
	loadGoogleScript().then(() => {
		if (!window.google?.accounts?.id) return
		window.google.accounts.id.renderButton(element, {
			type: 'standard',
			theme: 'outline',
			size: 'large',
			text: 'signin_with',
			callback: (response) => callback(response.credential)
		})
	})
}
