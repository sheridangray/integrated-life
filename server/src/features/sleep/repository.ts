import { SleepNightlyMetrics, type SleepNightlyMetricsDocument } from '../../models/SleepNightlyMetrics'
import { SleepScoreModel, type SleepScoreDocument } from '../../models/SleepScore'
import { SleepBaseline, type SleepBaselineDocument } from '../../models/SleepBaseline'
import type { NightlyMetrics, BaselineStats } from '@integrated-life/shared'
import type { ScoringResult } from './types'

export async function upsertNightlyMetrics(
	userId: string,
	date: string,
	metrics: NightlyMetrics
): Promise<SleepNightlyMetricsDocument> {
	return SleepNightlyMetrics.findOneAndUpdate(
		{ userId, date },
		{ ...metrics, userId },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	)
}

export async function findNightlyMetrics(
	userId: string,
	days: number
): Promise<SleepNightlyMetricsDocument[]> {
	const cutoff = new Date()
	cutoff.setDate(cutoff.getDate() - days)
	return SleepNightlyMetrics.find({
		userId,
		date: { $gte: cutoff.toISOString().split('T')[0] },
	})
		.sort({ date: 1 })
		.lean()
}

export async function findBaseline(
	userId: string
): Promise<SleepBaselineDocument | null> {
	return SleepBaseline.findOne({ userId }).lean()
}

export async function upsertBaseline(
	userId: string,
	stats: BaselineStats
): Promise<SleepBaselineDocument> {
	return SleepBaseline.findOneAndUpdate(
		{ userId },
		{ ...stats, userId },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	)
}

export async function upsertScore(
	userId: string,
	date: string,
	result: ScoringResult
): Promise<SleepScoreDocument> {
	return SleepScoreModel.findOneAndUpdate(
		{ userId, date },
		{ ...result, userId, date },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	)
}

export async function findScores(
	userId: string,
	days: number
): Promise<SleepScoreDocument[]> {
	const cutoff = new Date()
	cutoff.setDate(cutoff.getDate() - days)
	return SleepScoreModel.find({
		userId,
		date: { $gte: cutoff.toISOString().split('T')[0] },
	})
		.sort({ date: -1 })
		.lean()
}

export async function findLatestScore(
	userId: string
): Promise<SleepScoreDocument | null> {
	return SleepScoreModel.findOne({ userId })
		.sort({ date: -1 })
		.lean()
}
