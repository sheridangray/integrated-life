import { chatCompletion } from '../../integrations/together'
import type { ContributorDetail } from './scoring'

const SLEEP_COACH_SYSTEM_PROMPT = `You are an AI Sleep Coach for the Integrated Life app. You provide brief, actionable insights about sleep quality and how to improve specific aspects of sleep.

Rules:
- Keep responses to 2-3 sentences
- Be encouraging but honest
- Reference the specific numbers provided
- Focus on actionable suggestions the user can try tonight or this week
- Never give medical advice
- If the score is already good (80+), affirm it briefly and suggest how to maintain it
- Use a warm, supportive tone`

const CONTRIBUTOR_LABELS: Record<string, string> = {
	durationAdequacy: 'Sleep Duration Adequacy',
	consistency: 'Sleep Onset Consistency',
	fragmentation: 'Sleep Fragmentation',
	recoveryPhysiology: 'Recovery Physiology',
	structure: 'Sleep Structure (Stages)',
	timingAlignment: 'Timing Alignment',
}

export async function getContributorAssessment(
	detail: ContributorDetail
): Promise<string | null> {
	const label = CONTRIBUTOR_LABELS[detail.key] ?? detail.key

	let context = `Sleep contributor: ${label}\nScore: ${detail.score}/100\nValue: ${detail.rawLabel}\nWeight in overall sleep score: ${Math.round(detail.weight * 100)}%`

	if (detail.baselineMean !== undefined && detail.baselineStd !== undefined) {
		context += `\nPersonal baseline: mean ${detail.baselineMean}, std ${detail.baselineStd}`
	}

	if (detail.zScore !== undefined) {
		const direction = detail.zScore > 0 ? 'above' : 'below'
		context += `\nDeviation: ${Math.abs(Math.round(detail.zScore * 100) / 100)} std ${direction} average`
	}

	if (detail.subComponents && detail.subComponents.length > 0) {
		const subSummary = detail.subComponents
			.map(s => `${s.name}: ${s.rawValue} (score ${s.score}/100)`)
			.join(', ')
		context += `\nSub-components: ${subSummary}`
	}

	context += `\n\nProvide a brief assessment of this contributor and one specific suggestion to improve or maintain it.`

	return chatCompletion(SLEEP_COACH_SYSTEM_PROMPT, context)
}
