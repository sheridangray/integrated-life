import { describe, expect, it } from 'vitest'
import { rewriteR2DevUrl } from '../../lib/r2DevUrlRewrite'

describe('rewriteR2DevUrl', () => {
	const pub = 'https://pub-5c2a968502d043fe9423dc04e75e584f.r2.dev'

	it('rewrites legacy bucket.account.r2.dev URLs', () => {
		const old =
			'https://integrated-life-images.d5e10f882f1bd3dbc97ea41722aeaa28.r2.dev/recipes/foo.png'
		expect(rewriteR2DevUrl(old, pub)).toBe(`${pub}/recipes/foo.png`)
	})

	it('returns null when already using new base', () => {
		const same = `${pub}/recipes/foo.png`
		expect(rewriteR2DevUrl(same, pub)).toBeNull()
	})

	it('returns null for non-r2 URLs', () => {
		expect(rewriteR2DevUrl('https://example.com/a.png', pub)).toBeNull()
	})

	it('strips trailing slash on new base', () => {
		const old = 'https://bucket.acc.r2.dev/key'
		expect(rewriteR2DevUrl(old, `${pub}/`)).toBe(`${pub}/key`)
	})
})
