import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config'
import { logger } from '../lib/logger'

let client: Anthropic | null = null

function getClient(): Anthropic | null {
	if (!env.ANTHROPIC_API_KEY) {
		logger.debug('Anthropic API key not configured, photo scan disabled')
		return null
	}
	if (!client) {
		client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
	}
	return client
}

const FOOD_ANALYSIS_PROMPT = `Analyze this meal photo. Identify the food items visible and estimate the nutritional content.

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "name": "Brief description of the meal",
  "servingSize": "Estimated portion size (e.g. '1 plate', '1 bowl', '250g')",
  "nutrition": {
    "calories": <number>,
    "protein": <number in grams>,
    "carbs": <number in grams>,
    "fat": <number in grams>,
    "fiber": <number in grams>
  }
}

Be as accurate as possible with your estimates based on the visible portion sizes.`

export type PhotoAnalysisResult = {
	name: string
	servingSize: string
	nutrition: {
		calories: number
		protein: number
		carbs: number
		fat: number
		fiber: number
	}
}

export async function analyzeImage(
	imageBase64: string,
	mimeType: string
): Promise<PhotoAnalysisResult | null> {
	const anthropic = getClient()
	if (!anthropic) return null

	try {
		const response = await anthropic.messages.create({
			model: 'claude-sonnet-4-6',
			max_tokens: 1024,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'image',
							source: {
								type: 'base64',
								media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
								data: imageBase64
							}
						},
						{ type: 'text', text: FOOD_ANALYSIS_PROMPT }
					]
				}
			]
		})

		const textBlock = response.content.find((b) => b.type === 'text')
		if (!textBlock || textBlock.type !== 'text') return null

		const parsed = JSON.parse(textBlock.text) as PhotoAnalysisResult
		if (!parsed.name || !parsed.nutrition || typeof parsed.nutrition.calories !== 'number') {
			logger.warn('Anthropic returned invalid food analysis structure')
			return null
		}

		return parsed
	} catch (err) {
		logger.error('Anthropic food photo analysis failed', { error: (err as Error).message })
		return null
	}
}
