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
    "fiber": <number in grams>,
    "sugar": <number in grams>,
    "saturatedFat": <number in grams>,
    "monounsaturatedFat": <number in grams>,
    "polyunsaturatedFat": <number in grams>,
    "cholesterol": <number in mg>,
    "transFat": <number in grams>,
    "vitaminA": <number in mcg>,
    "vitaminB6": <number in mg>,
    "vitaminB12": <number in mcg>,
    "vitaminC": <number in mg>,
    "vitaminD": <number in mcg>,
    "vitaminE": <number in mg>,
    "vitaminK": <number in mcg>,
    "thiamin": <number in mg>,
    "riboflavin": <number in mg>,
    "niacin": <number in mg>,
    "folate": <number in mcg>,
    "pantothenicAcid": <number in mg>,
    "biotin": <number in mcg>,
    "calcium": <number in mg>,
    "iron": <number in mg>,
    "magnesium": <number in mg>,
    "manganese": <number in mg>,
    "phosphorus": <number in mg>,
    "potassium": <number in mg>,
    "zinc": <number in mg>,
    "selenium": <number in mcg>,
    "copper": <number in mg>,
    "chromium": <number in mcg>,
    "molybdenum": <number in mcg>,
    "chloride": <number in mg>,
    "iodine": <number in mcg>,
    "sodium": <number in mg>,
    "caffeine": <number in mg>,
    "water": <number in mL>
  }
}

Include all fields. Use 0 for nutrients you cannot reasonably estimate. Be as accurate as possible based on visible portion sizes.`

export type PhotoAnalysisResult = {
	name: string
	servingSize: string
	nutrition: {
		calories: number
		protein: number
		carbs: number
		fat: number
		fiber: number
		sugar?: number
		water?: number
		saturatedFat?: number
		monounsaturatedFat?: number
		polyunsaturatedFat?: number
		cholesterol?: number
		transFat?: number
		vitaminA?: number
		vitaminB6?: number
		vitaminB12?: number
		vitaminC?: number
		vitaminD?: number
		vitaminE?: number
		vitaminK?: number
		thiamin?: number
		riboflavin?: number
		niacin?: number
		folate?: number
		pantothenicAcid?: number
		biotin?: number
		calcium?: number
		iron?: number
		magnesium?: number
		manganese?: number
		phosphorus?: number
		potassium?: number
		zinc?: number
		selenium?: number
		copper?: number
		chromium?: number
		molybdenum?: number
		chloride?: number
		iodine?: number
		sodium?: number
		caffeine?: number
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
