import { chatCompletion } from '../../integrations/together'
import { logger } from '../../lib/logger'
import * as repo from './repository'
import type { AIInsight, WorkoutInsight } from './types'

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
	mindfulSession: { name: 'Mindful Minutes', unit: 'min' },
	// Body Composition
	bodyMass: { name: 'Body Weight', unit: 'lb' },
	bodyMassIndex: { name: 'BMI', unit: 'kg/m²' },
	bodyFatPercentage: { name: 'Body Fat Percentage', unit: '% (values are 0-1 fractions)' },
	leanBodyMass: { name: 'Lean Body Mass', unit: 'lb' },
	height: { name: 'Height', unit: 'inches' },
	fatMass: { name: 'Fat Mass', unit: 'lb' },
	ffmi: { name: 'Fat-Free Mass Index (FFMI)', unit: 'kg/m²' },
	estimatedBodyWater: { name: 'Estimated Body Water', unit: '% (values are 0-1 fractions)' },
	estimatedBoneMass: { name: 'Estimated Bone Mass', unit: 'lb' },
	estimatedMuscleMass: { name: 'Estimated Muscle Mass', unit: 'lb' },
	// Nutrition
	dietaryEnergyConsumed: { name: 'Calories Consumed', unit: 'kcal' },
	dietaryProtein: { name: 'Protein', unit: 'g' },
	dietaryFatTotal: { name: 'Total Fat', unit: 'g' },
	dietaryCarbohydrates: { name: 'Carbohydrates', unit: 'g' },
	dietaryFiber: { name: 'Fiber', unit: 'g' },
	dietarySugar: { name: 'Sugar', unit: 'g' },
	dietarySodium: { name: 'Sodium', unit: 'mg' },
	dietaryWater: { name: 'Water', unit: 'mL' },
	dietaryFatSaturated: { name: 'Saturated Fat', unit: 'g' },
	dietaryFatMonounsaturated: { name: 'Monounsaturated Fat', unit: 'g' },
	dietaryFatPolyunsaturated: { name: 'Polyunsaturated Fat', unit: 'g' },
	dietaryCholesterol: { name: 'Cholesterol', unit: 'mg' },
	dietaryVitaminA: { name: 'Vitamin A', unit: 'mcg' },
	dietaryVitaminB6: { name: 'Vitamin B6', unit: 'mg' },
	dietaryVitaminB12: { name: 'Vitamin B12', unit: 'mcg' },
	dietaryVitaminC: { name: 'Vitamin C', unit: 'mg' },
	dietaryVitaminD: { name: 'Vitamin D', unit: 'mcg' },
	dietaryVitaminE: { name: 'Vitamin E', unit: 'mg' },
	dietaryVitaminK: { name: 'Vitamin K', unit: 'mcg' },
	dietaryThiamin: { name: 'Thiamin (B1)', unit: 'mg' },
	dietaryRiboflavin: { name: 'Riboflavin (B2)', unit: 'mg' },
	dietaryNiacin: { name: 'Niacin (B3)', unit: 'mg' },
	dietaryFolate: { name: 'Folate', unit: 'mcg' },
	dietaryPantothenicAcid: { name: 'Pantothenic Acid (B5)', unit: 'mg' },
	dietaryBiotin: { name: 'Biotin', unit: 'mcg' },
	dietaryCalcium: { name: 'Calcium', unit: 'mg' },
	dietaryIron: { name: 'Iron', unit: 'mg' },
	dietaryMagnesium: { name: 'Magnesium', unit: 'mg' },
	dietaryManganese: { name: 'Manganese', unit: 'mg' },
	dietaryPhosphorus: { name: 'Phosphorus', unit: 'mg' },
	dietaryPotassium: { name: 'Potassium', unit: 'mg' },
	dietaryZinc: { name: 'Zinc', unit: 'mg' },
	dietarySelenium: { name: 'Selenium', unit: 'mcg' },
	dietaryCopper: { name: 'Copper', unit: 'mg' },
	dietaryChromium: { name: 'Chromium', unit: 'mcg' },
	dietaryMolybdenum: { name: 'Molybdenum', unit: 'mcg' },
	dietaryChloride: { name: 'Chloride', unit: 'mg' },
	dietaryIodine: { name: 'Iodine', unit: 'mcg' },
	dietaryCaffeine: { name: 'Caffeine', unit: 'mg' },
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

const MONITOR_ANALYSIS_SYSTEM_PROMPT = `You are a medically-trained fitness instructor analyzing Apple HealthKit data for the Integrated Life app.

Provide a thorough analysis including:
- What this metric means and how the user's values compare to healthy ranges
- Interpretation of trends (improving, declining, stable)
- Reasonable targets for improvement, if applicable
- Specific actionable steps the user can take
- If values are consistently healthy, affirm that and do not suggest unnecessary changes

Consider the user's age and gender when interpreting values (if provided).
Use a knowledgeable but approachable tone. Keep the response to 2-4 paragraphs.`

export async function getMonitorAnalysis(
	sampleType: string,
	data: Array<{ date: string; value: number }>,
	timeRange: string,
	userProfile?: { gender?: string; dateOfBirth?: Date }
): Promise<AIInsight | null> {
	if (data.length === 0) return null

	const meta = SAMPLE_TYPE_META[sampleType]
	const displayName = meta?.name ?? sampleType
	const unitLabel = meta?.unit ?? ''

	const dataSummary = data
		.map((d) => `${d.date}: ${d.value}`)
		.join('\n')

	let profileContext = ''
	if (userProfile?.gender || userProfile?.dateOfBirth) {
		const parts: string[] = []
		if (userProfile.gender) parts.push(`Gender: ${userProfile.gender}`)
		if (userProfile.dateOfBirth) {
			const age = Math.floor((Date.now() - userProfile.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
			parts.push(`Age: ${age}`)
		}
		profileContext = `\nUser profile: ${parts.join(', ')}`
	}

	const userMessage = `Health metric: ${displayName}${unitLabel ? ` (${unitLabel})` : ''}
Time range: ${timeRange}${profileContext}

Data points:
${dataSummary}

Analyze this data thoroughly. Provide insights on the trend, whether the values are within healthy ranges, and actionable recommendations if appropriate.`

	const insight = await chatCompletion(MONITOR_ANALYSIS_SYSTEM_PROMPT, userMessage)
	if (!insight) return null

	return { insight, generatedAt: new Date().toISOString() }
}

const COMPREHENSIVE_REPORT_SYSTEM_PROMPT = `You are a medically-trained health analyst generating a comprehensive weekly health report for the Integrated Life app.

You are analyzing Apple HealthKit data across multiple health domains: cardiovascular, activity, body composition, nutrition, sleep, and more.

Structure your report with these sections using markdown:
## Overview
A 2-3 sentence summary of the week's health picture.

## Key Observations
Bullet points highlighting the most notable findings from the past week.

## Trends & Patterns
Analyze long-term trends across metrics. Compare this week's averages to the prior period. Note improvements, declines, or stability.

## Cross-Metric Correlations
Identify relationships between different metrics (e.g., sleep quality vs resting HR, nutrition vs energy levels, body composition vs activity). Only include correlations supported by the data.

## Concerns & Flags
Flag any values outside healthy ranges, sudden changes, or patterns that warrant attention. Be specific about which metrics and values are concerning.

## Recommendations
Provide 3-5 specific, actionable recommendations based on the data. Prioritize by impact.

Rules:
- Reference specific numbers and date ranges
- Compare to healthy population ranges when relevant
- Consider the user's age and gender when interpreting values
- Be honest about concerning patterns but avoid alarmism
- Never give specific medical diagnoses
- If data is limited, acknowledge that and adjust analysis accordingly
- Use a knowledgeable but approachable tone`

export async function getComprehensiveReport(
	allSamples: Record<string, Array<{ date: string; value: number }>>,
	priorSamples: Record<string, Array<{ date: string; value: number }>>,
	periodStart: string,
	periodEnd: string,
	userProfile?: { gender?: string; dateOfBirth?: Date }
): Promise<string | null> {
	const metricSections: string[] = []

	for (const [sampleType, samples] of Object.entries(allSamples)) {
		if (samples.length === 0) continue
		const meta = SAMPLE_TYPE_META[sampleType]
		const name = meta?.name ?? sampleType
		const unit = meta?.unit ?? ''

		const values = samples.map((s) => s.value)
		const avg = values.reduce((a, b) => a + b, 0) / values.length
		const min = Math.min(...values)
		const max = Math.max(...values)

		let section = `### ${name} (${unit})\nCount: ${samples.length} | Avg: ${avg.toFixed(1)} | Min: ${min.toFixed(1)} | Max: ${max.toFixed(1)}`

		const prior = priorSamples[sampleType]
		if (prior && prior.length > 0) {
			const priorValues = prior.map((s) => s.value)
			const priorAvg = priorValues.reduce((a, b) => a + b, 0) / priorValues.length
			const change = ((avg - priorAvg) / priorAvg * 100).toFixed(1)
			section += `\nPrior period avg: ${priorAvg.toFixed(1)} | Change: ${change}%`
		}

		metricSections.push(section)
	}

	if (metricSections.length === 0) return null

	let profileContext = ''
	if (userProfile?.gender || userProfile?.dateOfBirth) {
		const parts: string[] = []
		if (userProfile.gender) parts.push(`Gender: ${userProfile.gender}`)
		if (userProfile.dateOfBirth) {
			const age = Math.floor((Date.now() - userProfile.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
			parts.push(`Age: ${age}`)
		}
		profileContext = `\nUser profile: ${parts.join(', ')}`
	}

	const userMessage = `Report period: ${periodStart} to ${periodEnd}${profileContext}

Health data across ${Object.keys(allSamples).length} metrics:

${metricSections.join('\n\n')}

Generate a comprehensive health report analyzing all this data together.`

	return chatCompletion(COMPREHENSIVE_REPORT_SYSTEM_PROMPT, userMessage, { maxTokens: 2000 })
}

const WORKOUT_SUMMARY_SYSTEM_PROMPT = `You are an AI Health Coach providing a post-workout summary for the Integrated Life app.

Rules:
- Provide a brief per-exercise insight (1 sentence each) followed by an overall workout assessment (2-3 sentences)
- Be encouraging but honest about performance
- Reference specific numbers (weights, reps, durations) when available
- Highlight improvements, consistency, or areas to focus on next time
- Never give medical advice
- Use a warm, supportive tone
- Output valid JSON only, with no extra text

Output format:
{"exercises":[{"exerciseId":"...","insight":"..."}],"overall":"..."}`

export async function getWorkoutInsight(
	userId: string,
	exerciseLogIds: string[]
): Promise<WorkoutInsight | null> {
	if (exerciseLogIds.length === 0) return null

	const logs = await repo.findExerciseLogsByIds(userId, exerciseLogIds)
	if (logs.length === 0) return null

	const exerciseSummaries = logs.map((log) => {
		const exercise = log.exerciseId as unknown as { _id: { toString(): string }; name: string }
		const setsSummary = log.sets
			.map((s) => {
				const parts: string[] = []
				if (s.weight) parts.push(`${s.weight}lbs`)
				if (s.reps) parts.push(`${s.reps} reps`)
				if (s.minutes || s.seconds) parts.push(`${s.minutes ?? 0}m${s.seconds ?? 0}s`)
				return parts.join(' x ')
			})
			.join(', ')

		return {
			exerciseId: exercise._id.toString(),
			exerciseName: exercise.name,
			summary: `${exercise.name}: ${setsSummary}${log.notes ? ` (Note: ${log.notes})` : ''}`
		}
	})

	const userMessage = `Workout just completed with ${exerciseSummaries.length} exercise(s):

${exerciseSummaries.map((e) => `- ${e.summary}`).join('\n')}

Provide per-exercise insights and an overall workout assessment. Return valid JSON matching the specified format. Use the exerciseId values provided: ${exerciseSummaries.map((e) => e.exerciseId).join(', ')}`

	const maxTokens = 150 + exerciseSummaries.length * 100
	const response = await chatCompletion(WORKOUT_SUMMARY_SYSTEM_PROMPT, userMessage, { maxTokens })
	if (!response) {
		logger.warn('Workout insight chatCompletion returned null', { exerciseCount: exerciseSummaries.length })
		return null
	}

	try {
		const jsonMatch = response.match(/\{[\s\S]*\}/)
		if (!jsonMatch) {
			logger.warn('Workout insight response had no JSON', { response: response.slice(0, 500) })
			return null
		}

		const parsed = JSON.parse(jsonMatch[0]) as {
			exercises: Array<{ exerciseId: string; insight: string }>
			overall: string
		}

		return {
			exerciseInsights: parsed.exercises.map((e) => {
				const matched = exerciseSummaries.find((s) => s.exerciseId === e.exerciseId)
				return {
					exerciseId: e.exerciseId,
					exerciseName: matched?.exerciseName ?? 'Exercise',
					insight: e.insight
				}
			}),
			overallInsight: parsed.overall,
			generatedAt: new Date().toISOString()
		}
	} catch (err) {
		logger.warn('Workout insight JSON parse failed', {
			error: (err as Error).message,
			response: response.slice(0, 500)
		})
		return null
	}
}
