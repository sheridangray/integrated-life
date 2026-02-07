import { logger } from '../lib/logger'

export type AgentContext = {
	userId: string
	trigger: 'event' | 'app' | 'schedule'
	triggerId: string
	payload: Record<string, unknown>
	timestamp: string
}

export type AgentResult = {
	success: boolean
	message?: string
}

const agentMap: Map<string, (ctx: AgentContext) => Promise<AgentResult>> = new Map()

export function registerAgent(triggerId: string, handler: (ctx: AgentContext) => Promise<AgentResult>) {
	agentMap.set(triggerId, handler)
}

export async function runAgent(ctx: AgentContext): Promise<AgentResult> {
	const handler = agentMap.get(ctx.triggerId)
	if (!handler) {
		logger.debug('No agent registered for trigger', { triggerId: ctx.triggerId })
		return { success: true }
	}

	logger.info('Running agent', { triggerId: ctx.triggerId, userId: ctx.userId })
	return handler(ctx)
}
