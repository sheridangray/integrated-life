import * as fs from 'fs'
import * as http2 from 'http2'
import * as jwt from 'jsonwebtoken'
import { env } from '../config'
import { logger } from '../lib/logger'

let cachedProviderToken: { token: string; expiresAtMs: number } | null = null

export function isApnsConfigured(): boolean {
	if (!env.APNS_KEY_ID || !env.APNS_TEAM_ID || !env.APNS_KEY_PATH) return false
	try {
		return fs.existsSync(env.APNS_KEY_PATH)
	} catch {
		return false
	}
}

function useProductionApnsHost(): boolean {
	if (env.APNS_USE_SANDBOX === 'true') return false
	if (env.APNS_USE_SANDBOX === 'false') return true
	return env.NODE_ENV === 'production'
}

function getSigningKey(): string {
	return fs.readFileSync(env.APNS_KEY_PATH!, 'utf8')
}

function getProviderJwt(): string {
	const now = Date.now()
	if (cachedProviderToken && cachedProviderToken.expiresAtMs > now + 60_000) {
		return cachedProviderToken.token
	}

	const key = getSigningKey()
	const token = jwt.sign(
		{ iss: env.APNS_TEAM_ID, iat: Math.floor(now / 1000) },
		key,
		{
			algorithm: 'ES256',
			header: { alg: 'ES256', kid: env.APNS_KEY_ID },
			expiresIn: 50 * 60
		}
	)

	cachedProviderToken = { token, expiresAtMs: now + 49 * 60 * 1000 }
	return token
}

export type ApnsAlertPayload = {
	title: string
	body: string
	data?: Record<string, string>
}

/**
 * Send an alert push to a single device token (hex, no spaces).
 */
export function sendApnsAlert(deviceTokenHex: string, alert: ApnsAlertPayload): Promise<boolean> {
	if (!isApnsConfigured()) {
		logger.debug('APNs not configured, skipping push')
		return Promise.resolve(false)
	}

	const host = useProductionApnsHost() ? 'api.push.apple.com' : 'api.development.push.apple.com'
	const path = `/3/device/${deviceTokenHex}`
	const bundleId = env.MOBILE_BUNDLE_ID

	const bodyObj: Record<string, unknown> = {
		aps: {
			alert: { title: alert.title, body: alert.body },
			sound: 'default'
		}
	}
	if (alert.data) {
		for (const [k, v] of Object.entries(alert.data)) {
			bodyObj[k] = v
		}
	}
	const body = JSON.stringify(bodyObj)

	return new Promise((resolve) => {
		let settled = false
		const finish = (ok: boolean) => {
			if (settled) return
			settled = true
			resolve(ok)
		}

		let providerToken: string
		try {
			providerToken = getProviderJwt()
		} catch (err) {
			logger.error('APNs JWT sign failed', { error: (err as Error).message })
			return finish(false)
		}

		const client = http2.connect(`https://${host}`)

		const timeout = setTimeout(() => {
			client.close()
			finish(false)
		}, 15_000)

		client.on('error', (err) => {
			clearTimeout(timeout)
			logger.warn('APNs http2 client error', { error: err.message })
			finish(false)
		})

		const req = client.request({
			':method': 'POST',
			':path': path,
			'apns-topic': bundleId,
			'apns-push-type': 'alert',
			'apns-priority': '10',
			authorization: `bearer ${providerToken}`,
			'content-type': 'application/json',
			'content-length': Buffer.byteLength(body)
		})

		let statusCode = 0
		req.on('response', (headers) => {
			const s = headers[':status']
			statusCode = typeof s === 'string' ? parseInt(s, 10) : 0
		})

		req.setEncoding('utf8')
		let responseData = ''
		req.on('data', (chunk) => {
			responseData += chunk
		})

		req.on('end', () => {
			clearTimeout(timeout)
			client.close()

			if (statusCode === 200) {
				logger.info('APNs alert delivered', { deviceSuffix: deviceTokenHex.slice(-8) })
				finish(true)
			} else {
				logger.warn('APNs alert failed', {
					status: statusCode,
					body: responseData.slice(0, 500),
					sandbox: !useProductionApnsHost()
				})
				finish(false)
			}
		})

		req.on('error', (err) => {
			clearTimeout(timeout)
			client.close()
			logger.warn('APNs request error', { error: err.message })
			finish(false)
		})

		req.write(body)
		req.end()
	})
}

export async function sendApnsAlertToMany(
	deviceTokenHexList: string[],
	alert: ApnsAlertPayload
): Promise<number> {
	let ok = 0
	for (const token of deviceTokenHexList) {
		if (!/^[0-9a-fA-F]{64,256}$/.test(token)) continue
		// eslint-disable-next-line no-await-in-loop
		const sent = await sendApnsAlert(token, alert)
		if (sent) ok += 1
	}
	return ok
}
