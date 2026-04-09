import Together from 'together-ai'
import { env } from '../config'
import { logger } from '../lib/logger'

let client: Together | null = null

function getClient(): Together | null {
	if (!env.TOGETHER_AI_API_KEY) {
		logger.debug('Together AI API key not configured, image generation disabled')
		return null
	}
	if (!client) {
		client = new Together({ apiKey: env.TOGETHER_AI_API_KEY })
	}
	return client
}

export async function generateRecipeImage(recipeName: string, description?: string): Promise<Buffer | null> {
	const together = getClient()
	if (!together) return null

	const prompt = `Professional food photography of ${recipeName}${description ? `, ${description}` : ''}, styled on a white plate, soft lighting, overhead shot, high quality`

	try {
		const response = await together.images.generate({
			model: 'black-forest-labs/FLUX.1-schnell',
			prompt,
			width: 1024,
			height: 1024,
			steps: 4,
			n: 1,
			response_format: 'base64'
		})

		const imageData = response.data?.[0]
		if (!imageData || !imageData.b64_json) {
			logger.warn('Together AI returned no image data')
			return null
		}

		return Buffer.from(imageData.b64_json, 'base64')
	} catch (err) {
		logger.error('Together AI image generation failed', { error: (err as Error).message })
		return null
	}
}
