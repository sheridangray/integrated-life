import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { env } from '../config'
import { logger } from '../lib/logger'

let r2Client: S3Client | null = null

function getClient(): S3Client | null {
	if (!env.CLOUDFLARE_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
		logger.debug('R2 credentials not configured, image upload disabled')
		return null
	}
	if (!r2Client) {
		r2Client = new S3Client({
			region: 'auto',
			endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: env.R2_ACCESS_KEY_ID,
				secretAccessKey: env.R2_SECRET_ACCESS_KEY
			}
		})
	}
	return r2Client
}

export async function uploadImage(buffer: Buffer, key: string, contentType: string): Promise<string> {
	const client = getClient()
	if (!client) {
		throw new Error('R2 storage not configured')
	}

	await client.send(
		new PutObjectCommand({
			Bucket: env.R2_BUCKET_NAME,
			Key: key,
			Body: buffer,
			ContentType: contentType
		})
	)

	return getPublicUrl(key)
}

export async function deleteImage(key: string): Promise<void> {
	const client = getClient()
	if (!client) return

	try {
		await client.send(
			new DeleteObjectCommand({
				Bucket: env.R2_BUCKET_NAME,
				Key: key
			})
		)
	} catch (err) {
		logger.error('Failed to delete image from R2', { key, error: (err as Error).message })
	}
}

export function getPublicUrl(key: string): string {
	if (env.R2_PUBLIC_URL) {
		return `${env.R2_PUBLIC_URL}/${key}`
	}
	return `https://${env.R2_BUCKET_NAME}.${env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${key}`
}
