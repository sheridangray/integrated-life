/**
 * Map any *.r2.dev object URL path to a new public R2 base (e.g. pub-….r2.dev).
 */
export function rewriteR2DevUrl(url: string, newBase: string): string | null {
	const trimmedBase = newBase.replace(/\/$/, '')
	try {
		const u = new URL(url)
		if (!u.hostname.endsWith('.r2.dev')) return null
		const prefix = `${trimmedBase}/`
		const normalized = url.startsWith(prefix) || url === trimmedBase
		if (normalized) return null
		const suffix = u.pathname + u.search + u.hash
		if (!suffix || suffix === '/') return null
		return `${trimmedBase}${suffix}`
	} catch {
		return null
	}
}
