import { chatCompletion } from '../../integrations/together'
import * as repo from './repository'
import type { AIInsight } from './types'

const HEALTH_COACH_SYSTEM_PROMPT = `You are an AI Health Coach for the Integrated Life app. You provide brief, actionable insights about exercise performance, trends, and health data.

Rules:
- Keep responses to 1-3 sentences
- Be encouraging but honest
- Reference specific numbers when available (weights, reps, durations)
- Focus on actionable suggestions
- Never give medical advice
- Use a warm, supportive tone`

export async function getExerciseInsight(
	userId: string,
	exerciseId: string
): Promise<AIInsight | null> {
	const logs = await repo.findExerciseLogsByExercise(userId, exerciseId, 10)
	if (logs.length === 0) return null

	const exercise = await repo.findExerciseById(exerciseId)
	if (!exercise) return null

	const logSummary = logs
		.slice(0, 5)
		.map((log) => {
			const setsSummary = log.sets
				.map((s) => {
					const parts: string[] = []
					if (s.weight) parts.push(`${s.weight}lbs`)
					if (s.reps) parts.push(`${s.reps} reps`)
					if (s.minutes || s.seconds) parts.push(`${s.minutes ?? 0}m${s.seconds ?? 0}s`)
					return parts.join(' x ')
				})
				.join(', ')
			return `${log.date}: ${setsSummary}${log.notes ? ` (Note: ${log.notes})` : ''}`
		})
		.join('\n')

	const userMessage = `Exercise: ${exercise.name} (${exercise.measurementType})
Recent logs (most recent first):
${logSummary}

Provide a brief insight about their performance and a suggestion for their next session.`

	const insight = await chatCompletion(HEALTH_COACH_SYSTEM_PROMPT, userMessage)
	if (!insight) return null

	return { insight, generatedAt: new Date().toISOString() }
}

export async function getHistorySummary(userId: string): Promise<AIInsight | null> {
	const recentLogs = await repo.findRecentExerciseLogs(userId, 30)
	if (recentLogs.length === 0) return null

	const bodyPartCounts: Record<string, number> = {}
	const exerciseCounts: Record<string, number> = {}

	for (const log of recentLogs) {
		const exercise = log.exerciseId as unknown as { name: string; bodyParts: string[] }
		if (exercise?.name) {
			exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] ?? 0) + 1
		}
		if (exercise?.bodyParts) {
			for (const bp of exercise.bodyParts) {
				bodyPartCounts[bp] = (bodyPartCounts[bp] ?? 0) + 1
			}
		}
	}

	const userMessage = `Last 30 days exercise summary:
- Total sessions: ${recentLogs.length}
- Body part distribution: ${Object.entries(bodyPartCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Most frequent exercises: ${Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} (${v}x)`).join(', ')}

Provide a brief high-level summary of their progress, identify any muscle groups that may be neglected, and suggest improvements.`

	const insight = await chatCompletion(HEALTH_COACH_SYSTEM_PROMPT, userMessage)
	if (!insight) return null

	return { insight, generatedAt: new Date().toISOString() }
}

const SAMPLE_TYPE_META: Record<string, { name: string; unit: string }> = {
	heartRate: { name: 'Heart Rate', unit: 'bpm' },
	restingHeartRate: { name: 'Resting Heart Rate', unit: 'bpm' },
	walkingHeartRateAverage: { name: 'Walking Heart Rate Average', unit: 'bpm' },
	heartRateVariability: { name: 'Heart Rate Variability (SDNN)', unit: 'ms' },
	vo2Max: { name: 'VO2 Max', unit: 'mL/kg/min' },
	bloodOxygenSaturation: { name: 'Blood Oxygen Saturation', unit: '% (values are 0-1 fractions)' },
	respiratoryRate: { name: 'Respiratory Rate', unit: 'breaths/min' },
	cardioRecovery: { name: 'Cardio Recovery (1-min)', unit: 'bpm' },
	atrialFibrillationBurden: { name: 'AFib Burden', unit: '% (values are 0-1 fractions)' },
	activeEnergy: { name: 'Active Energy Burned', unit: 'kcal' },
	basalEnergy: { name: 'Basal Energy Burned', unit: 'kcal' },
	exerciseTime: { name: 'Exercise Time', unit: 'min' },
	standTime: { name: 'Stand Time', unit: 'min' },
	steps: { name: 'Steps', unit: 'steps' },
	distanceWalkingRunning: { name: 'Walking + Running Distance', unit: 'miles' },
	walkingSpeed: { name: 'Walking Speed', unit: 'mph' },
	walkingAsymmetry: { name: 'Walking Asymmetry', unit: '% (values are 0-1 fractions)' },
	walkingDoubleSupport: { name: 'Double Support Time', unit: '% (values are 0-1 fractions)' },
	flightsClimbed: { name: 'Flights Climbed', unit: 'flights' },
	bodyTemperature: { name: 'Body Temperature', unit: '°F' },
	wristTemperature: { name: 'Wrist Temperature', unit: '°C' },
	environmentalAudioExposure: { name: 'Environmental Sound Levels', unit: 'dB(A)' },
	headphoneAudioExposure: { name: 'Headphone Audio Levels', unit: 'dB(A)' },
	sleepAnalysis: { name: 'Sleep Analysis', unit: 'categorical' },
	mindfulSession: { name: 'Mindful Minutes', unit: 'min' },
}

export async function getMonitorInsight(
	sampleType: string,
	data: Array<{ date: string; value: number }>
): Promise<AIInsight | null> {
	if (data.length === 0) return null

	const meta = SAMPLE_TYPE_META[sampleType]
	const displayName = meta?.name ?? sampleType
	const unitLabel = meta?.unit ?? ''

	const dataSummary = data
		.slice(0, 14)
		.map((d) => `${d.date}: ${d.value}`)
		.join('\n')

	const userMessage = `Health metric: ${displayName}${unitLabel ? ` (${unitLabel})` : ''}
Recent readings (most recent first):
${dataSummary}

Provide a brief observation about the trend. Only suggest an action if there is a meaningful concern or opportunity for improvement — if the readings are consistently healthy, simply affirm that.`

	const insight = await chatCompletion(HEALTH_COACH_SYSTEM_PROMPT, userMessage)
	if (!insight) return null

	return { insight, generatedAt: new Date().toISOString() }
}
