import type { NightlyMetrics, SleepScore, BaselineStats } from '@integrated-life/shared'
import * as repository from './repository'
import { computeSleepScore, computeReadinessScore, getCalibrationPhase, determineActionBucket, SCORING_CONFIG_V1 } from './scoring'
import { updateBaseline, computeSlopes } from './baseline'
import { computeSleepDebt, getOptimalDuration } from './sleep-debt'
import type { ScoringResult } from './types'

function docToSleepScore(doc: any): SleepScore {
	return {
		id: doc._id?.toString() ?? doc.id,
		date: doc.date,
		sleepScore: doc.sleepScore,
		readinessScore: doc.readinessScore,
		sleepBreakdown: doc.sleepBreakdown,
		readinessBreakdown: doc.readinessBreakdown,
		interactionFlags: doc.interactionFlags,
		interactionFactor: doc.interactionFactor,
		actionBucket: doc.actionBucket,
		modelVersion: doc.modelVersion,
		calibrationPhase: doc.calibrationPhase,
		deviceTier: doc.deviceTier,
	}
}

export async function processNightlyData(
	userId: string,
	metrics: NightlyMetrics
): Promise<SleepScore> {
	await repository.upsertNightlyMetrics(userId, metrics.date, metrics)

	const existingBaseline = await repository.findBaseline(userId) as BaselineStats | null
	const recentMetricDocs = await repository.findNightlyMetrics(userId, 60)
	const recentMetrics: NightlyMetrics[] = recentMetricDocs.map(d => ({
		date: d.date,
		sleepStartTime: d.sleepStartTime,
		sleepEndTime: d.sleepEndTime,
		sleepMidpoint: d.sleepMidpoint,
		totalAsleepDuration: d.totalAsleepDuration,
		totalInBedDuration: d.totalInBedDuration,
		deepDuration: d.deepDuration,
		remDuration: d.remDuration,
		coreDuration: d.coreDuration,
		wasoDuration: d.wasoDuration,
		minHrValue: d.minHrValue,
		minHrTimestamp: d.minHrTimestamp,
		avgHr: d.avgHr,
		hrvMean: d.hrvMean,
		respiratoryRateMean: d.respiratoryRateMean,
		temperatureDeviation: d.temperatureDeviation,
		deviceTier: d.deviceTier as 'A' | 'B' | 'C',
	}))

	const dataPointCount = existingBaseline?.dataPointCount ?? recentMetrics.length
	const calibrationPhase = getCalibrationPhase(dataPointCount)
	const baseline = existingBaseline ?? updateBaseline(null, recentMetrics)

	const { score: sleepScore, breakdown: sleepBreakdown } = computeSleepScore(
		metrics,
		baseline,
		SCORING_CONFIG_V1
	)

	const optimalDuration = getOptimalDuration(baseline)
	const sleepDebt = computeSleepDebt(recentMetrics, optimalDuration)

	const {
		score: readinessScore,
		breakdown: readinessBreakdown,
		interactionFactor,
		interactionFlags,
	} = computeReadinessScore(
		sleepScore,
		metrics,
		baseline,
		sleepDebt,
		calibrationPhase,
		SCORING_CONFIG_V1
	)

	const actionBucket = determineActionBucket(readinessScore)

	const scoringResult: ScoringResult = {
		sleepScore,
		readinessScore,
		sleepBreakdown,
		readinessBreakdown,
		interactionFlags,
		interactionFactor,
		actionBucket,
		modelVersion: SCORING_CONFIG_V1.modelVersion,
		calibrationPhase,
		deviceTier: metrics.deviceTier,
	}

	const scoreDoc = await repository.upsertScore(userId, metrics.date, scoringResult)

	const recentScoreDocs = await repository.findScores(userId, 14)
	const recentScoreValues = recentScoreDocs.map(d => d.sleepScore)
	const slopes = computeSlopes(recentMetrics.slice(-14), recentScoreValues, baseline)

	const updatedBaseline = updateBaseline(existingBaseline, recentMetrics)
	await repository.upsertBaseline(userId, {
		...updatedBaseline,
		hrvSlope14d: slopes.hrvSlope14d,
		durationSlope14d: slopes.durationSlope14d,
		sleepScoreSlope14d: slopes.sleepScoreSlope14d,
	})

	return docToSleepScore(scoreDoc)
}

export async function getTodayScores(userId: string): Promise<SleepScore | null> {
	const doc = await repository.findLatestScore(userId)
	return doc ? docToSleepScore(doc) : null
}

export async function getScoreHistory(
	userId: string,
	days: number
): Promise<SleepScore[]> {
	const docs = await repository.findScores(userId, days)
	return docs.map(docToSleepScore)
}
