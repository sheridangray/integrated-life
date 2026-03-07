import Together from 'together-ai'
import { env } from '../config'
import { logger } from '../lib/logger'

let client: Together | null = null

function getClient(): Together | null {
	if (!env.TOGETHER_AI_API_KEY) {
		logger.debug('Together AI API key not configured, AI features disabled')
		return null
	}
	if (!client) {
		client = new Together({ apiKey: env.TOGETHER_AI_API_KEY })
	}
	return client
}

export async function chatCompletion(
	systemPrompt: string,
	userMessage: string,
	options?: { maxTokens?: number }
): Promise<string | null> {
	const together = getClient()
	if (!together) return null

	try {
		const response = await together.chat.completions.create({
			model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userMessage }
			],
			max_tokens: options?.maxTokens ?? 300,
			temperature: 0.7
		})

		return response.choices[0]?.message?.content ?? null
	} catch (err) {
		logger.error('Together AI request failed', { error: (err as Error).message })
		return null
	}
}
