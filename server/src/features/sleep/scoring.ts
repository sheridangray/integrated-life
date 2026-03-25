import type { NightlyMetrics, BaselineStats, ComponentBreakdown, ReadinessBreakdown, ActionBucket } from '@integrated-life/shared'

/** v1 config kept for readiness weights / k-values / interaction bounds parity. */
export const SCORING_CONFIG_V1 = {
	modelVersion: 'sleep_readiness_v1.2_rule_based',
	sleepWeights: {
		duration: 0.2,
		efficiency: 0.15,
		deep: 0.15,
		rem: 0.15,
		restfulness: 0.1,
		timing: 0.15,
		physioStability: 0.1,
	},
	readinessWeights: {
		sleepScore: 0.3,
		hrvDeviation: 0.2,
		rhrDeviation: 0.15,
		recoveryIndex: 0.1,
		hrvTrendSlope: 0.1,
		sleepDebt: 0.1,
		activityLoad: 0.05,
	},
	kValues: {
		gentle: 0.9,
		moderate: 1.3,
		steep: 2.0,
	},
	interactionBounds: {
		1: { min: 0.85, max: 1.1 },
		2: { min: 0.75, max: 1.15 },
		3: { min: 0.65, max: 1.2 },
	} as Record<number, { min: number; max: number }>,
	actionThresholds: {
		pushHard: 85,
		maintain: 70,
		activeRecovery: 50,
	},
} as const

export const SCORING_CONFIG_V2 = {
	modelVersion: 'sleep_readiness_v2.0_dci_rst',
	sleepWeights: {
		D: 0.35,
		C: 0.2,
		I: 0.15,
		R: 0.15,
		S: 0.1,
		T: 0.05,
	},
	readinessWeights: SCORING_CONFIG_V1.readinessWeights,
	kValues: SCORING_CONFIG_V1.kValues,
	interactionBounds: SCORING_CONFIG_V1.interactionBounds,
	actionThresholds: SCORING_CONFIG_V1.actionThresholds,
} as const

export type ScoringConfig = typeof SCORING_CONFIG_V2

export function sigmoid(z: number, k: number): number {
	return 100 / (1 + Math.exp(-k * z))
}

export function computeZScore(value: number, mean: number, std: number): number {
	if (std === 0) return 0
	const z = (value - mean) / std
	return Math.max(-3, Math.min(3, z))
}

export function getCalibrationPhase(dataPointCount: number): 1 | 2 | 3 {
	if (dataPointCount < 7) return 1
	if (dataPointCount < 21) return 2
	return 3
}

export function determineActionBucket(readinessScore: number): ActionBucket {
	const t = SCORING_CONFIG_V2.actionThresholds
	if (readinessScore >= t.pushHard) return 'push_hard'
	if (readinessScore >= t.maintain) return 'maintain'
	if (readinessScore >= t.activeRecovery) return 'active_recovery'
	return 'full_rest'
}

// --- Sleep v2 helpers (recentMetrics: oldest → newest; may include the night being scored) ---

function clamp(n: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, n))
}

function median(values: number[]): number {
	if (values.length === 0) return 0
	const s = [...values].sort((a, b) => a - b)
	const mid = Math.floor(s.length / 2)
	return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

function tail<T>(arr: T[], n: number): T[] {
	if (arr.length <= n) return arr
	return arr.slice(-n)
}

/** Nights strictly before scoring date (same calendar `date` string excluded). */
function priorNights(recentMetrics: NightlyMetrics[], scoringDate: string): NightlyMetrics[] {
	return recentMetrics.filter(m => m.date < scoringDate)
}

/** Last `n` nights on or before `upToDate`, sorted by date ascending. */
function lastNightsUpTo(recentMetrics: NightlyMetrics[], upToDate: string, n: number): NightlyMetrics[] {
	const sorted = [...recentMetrics].filter(m => m.date <= upToDate).sort((a, b) => a.date.localeCompare(b.date))
	return sorted.slice(-n)
}

function minutesSinceUtcMidnight(iso: string): number {
	const d = new Date(iso)
	return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60
}

/** Shortest arc between two clock times on a 24h circle (minutes). */
function circularDeltaMinutes(a: number, b: number): number {
	const max = 24 * 60
	let d = Math.abs(a - b)
	if (d > max / 2) d = max - d
	return d
}

function meanStd(values: number[]): { mean: number; std: number } | null {
	if (values.length < 3) return null
	const mean = values.reduce((s, v) => s + v, 0) / values.length
	const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
	const std = Math.sqrt(variance)
	return { mean, std: std || 1e-9 }
}

function computeNeedMinutes(prior: NightlyMetrics[]): number {
	if (prior.length === 0) return 480
	const tst = tail(prior, 28).map(m => m.totalAsleepDuration)
	return clamp(median(tst), 420, 540)
}

function computeDurationAdequacy(tst: number, need: number): number {
	let D = 100 * Math.min(1, tst / need)
	const oversleep = tst - need - 90
	if (oversleep > 0) D -= Math.min(25, oversleep * 0.12)
	return clamp(D, 0, 100)
}

function computeConsistency(metrics: NightlyMetrics, prior: NightlyMetrics[]): number {
	const window = tail(prior, 28)
	const minNights = 5
	if (window.length < minNights) return 72
	const medOnset = median(window.map(m => minutesSinceUtcMidnight(m.sleepStartTime)))
	const tonight = minutesSinceUtcMidnight(metrics.sleepStartTime)
	const delta = circularDeltaMinutes(medOnset, tonight)
	return clamp(100 * Math.exp(-Math.pow(delta / 75, 1.6)), 0, 100)
}

function computeFragmentation(metrics: NightlyMetrics): number {
	const an = metrics.awakeningCountOver2m
	const at = metrics.awakeAfterOnsetMinutes
	const lmax = metrics.longestAwakeEpisodeMinutes
	if (an !== undefined && at !== undefined && lmax !== undefined) {
		return clamp(100 - (3 * an + 0.8 * at + 0.7 * lmax), 0, 100)
	}
	const waso = metrics.wasoDuration ?? metrics.awakeAfterOnsetMinutes ?? 0
	const eff = metrics.totalInBedDuration > 0 ? (metrics.totalAsleepDuration / metrics.totalInBedDuration) * 100 : 0
	return clamp(100 - waso * 0.35 - Math.max(0, 82 - eff) * 1.2, 0, 100)
}

function computeRecoveryPhysiology(
	metrics: NightlyMetrics,
	prior30: NightlyMetrics[],
	k: ScoringConfig['kValues']
): number | null {
	const hrVals = prior30.map(m => m.avgHr).filter(v => v > 0)
	const hrvVals = prior30.map(m => m.hrvMean).filter((v): v is number => v !== undefined && v >= 0)
	const rrVals = prior30.map(m => m.respiratoryRateMean).filter((v): v is number => v !== undefined && v >= 0)
	const tempVals = prior30.map(m => m.temperatureDeviation).filter((v): v is number => v !== undefined)

	let sum = 0
	let n = 0

	if (metrics.hrvMean !== undefined) {
		const st = meanStd(hrvVals)
		if (st) {
			sum += sigmoid(computeZScore(metrics.hrvMean, st.mean, st.std), k.moderate)
			n++
		}
	}

	const hrSt = meanStd(hrVals)
	if (hrSt) {
		sum += sigmoid(-computeZScore(metrics.avgHr, hrSt.mean, hrSt.std), k.moderate)
		n++
	}

	if (metrics.respiratoryRateMean !== undefined) {
		const st = meanStd(rrVals)
		if (st) {
			const z = computeZScore(metrics.respiratoryRateMean, st.mean, st.std)
			sum += sigmoid(-Math.abs(z), k.steep)
			n++
		}
	}

	if (metrics.temperatureDeviation !== undefined) {
		const st = meanStd(tempVals)
		if (st) {
			const z = computeZScore(metrics.temperatureDeviation, st.mean, st.std)
			sum += sigmoid(-Math.abs(z), k.steep)
			n++
		}
	}

	if (n === 0) return null
	return clamp(sum / n, 0, 100)
}

function computeStructure(metrics: NightlyMetrics, baseline: BaselineStats | null): number | null {
	if (!baseline?.deepPct || !baseline.remPct) return null
	if (metrics.deepDuration === undefined || metrics.remDuration === undefined || metrics.totalAsleepDuration <= 0) {
		return null
	}
	const eff = metrics.totalInBedDuration > 0 ? (metrics.totalAsleepDuration / metrics.totalInBedDuration) * 100 : 0
	const deepPct = (metrics.deepDuration / metrics.totalAsleepDuration) * 100
	const remPct = (metrics.remDuration / metrics.totalAsleepDuration) * 100
	const corePct = metrics.coreDuration !== undefined ? (metrics.coreDuration / metrics.totalAsleepDuration) * 100 : 0
	const awakePct = Math.max(0, 100 - deepPct - remPct - corePct)

	const zEff = computeZScore(eff, baseline.efficiency.mean, baseline.efficiency.std)
	const zDeep = computeZScore(deepPct, baseline.deepPct.mean, baseline.deepPct.std)
	const zRem = computeZScore(remPct, baseline.remPct.mean, baseline.remPct.std)
	const typicalAwake = clamp(100 - baseline.deepPct.mean - baseline.remPct.mean - 55, 3, 40)
	const zAwake = -computeZScore(awakePct, typicalAwake, 6)
	const zStage = (zDeep + zRem + zAwake) / 3
	const q = clamp(0.5 + 0.25 * (zEff / 3) + 0.25 * (zStage / 3), 0, 1)
	return Math.round(100 * q)
}

function computeTimingAlignment(metrics: NightlyMetrics, prior: NightlyMetrics[]): number {
	const window = tail(prior, 28)
	if (window.length < 5) return 72
	const medMid = median(window.map(m => minutesSinceUtcMidnight(m.sleepMidpoint)))
	const tonight = minutesSinceUtcMidnight(metrics.sleepMidpoint)
	const delta = circularDeltaMinutes(medMid, tonight)
	return clamp(100 * Math.exp(-Math.pow(delta / 90, 1.5)), 0, 100)
}

export type SleepV2Context = {
	need: number
	D: number
	C: number
	I: number
	R: number | null
	S: number | null
	T: number
}

export function buildSleepV2Context(
	metrics: NightlyMetrics,
	baseline: BaselineStats | null,
	recentMetrics: NightlyMetrics[],
	config: ScoringConfig = SCORING_CONFIG_V2
): SleepV2Context {
	const prior = priorNights(recentMetrics, metrics.date)
	const need = computeNeedMinutes(prior)
	const tst = metrics.totalAsleepDuration
	const D = computeDurationAdequacy(tst, need)
	const C = computeConsistency(metrics, prior)
	const I = computeFragmentation(metrics)
	const R = computeRecoveryPhysiology(metrics, tail(prior, 30), config.kValues)
	const S = computeStructure(metrics, baseline)
	const T = computeTimingAlignment(metrics, prior)
	return { need, D, C, I, R, S, T }
}

export function computeSleepScore(
	metrics: NightlyMetrics,
	baseline: BaselineStats | null,
	recentMetrics: NightlyMetrics[],
	config: ScoringConfig = SCORING_CONFIG_V2
): { score: number; breakdown: ComponentBreakdown } {
	const w = config.sleepWeights
	const ctx = buildSleepV2Context(metrics, baseline, recentMetrics, config)

	type Key = keyof typeof w
	const entries: Array<{ key: Key; value: number; use: boolean }> = [
		{ key: 'D', value: ctx.D, use: true },
		{ key: 'C', value: ctx.C, use: true },
		{ key: 'I', value: ctx.I, use: true },
		{ key: 'R', value: ctx.R ?? 0, use: ctx.R !== null },
		{ key: 'S', value: ctx.S ?? 0, use: ctx.S !== null },
		{ key: 'T', value: ctx.T, use: true },
	]

	const active = entries.filter(e => e.use)
	const sumW = active.reduce((s, e) => s + w[e.key], 0)
	let preliminary = active.reduce((s, e) => s + (w[e.key] / sumW) * e.value, 0)
	preliminary = Math.round(preliminary)

	let penalty = 0
	const penaltyFlags: string[] = []

	if (ctx.D < 50 && ctx.I < 50) {
		penalty += 8
		penaltyFlags.push('short_sleep_fragmented')
	}
	if (ctx.D > 75 && ctx.R !== null && ctx.R < 45) {
		penalty += 6
		penaltyFlags.push('adequate_duration_low_recovery')
	}
	if (ctx.C < 45 && ctx.R !== null && ctx.R < 45) {
		penalty += 6
		penaltyFlags.push('low_consistency_low_recovery')
	}

	const debtNights = lastNightsUpTo(recentMetrics, metrics.date, 7)
	const debtSum = debtNights.reduce((s, m) => s + Math.max(0, ctx.need - m.totalAsleepDuration), 0)
	if (debtSum > 0) {
		const p = Math.min(18, debtSum * 0.06)
		penalty += p
		penaltyFlags.push('sleep_debt_7d')
	}

	const penaltyTotal = Math.round(penalty)
	const score = clamp(preliminary - penaltyTotal, 0, 100)

	const breakdown: ComponentBreakdown = {
		durationAdequacy: Math.round(ctx.D),
		consistency: Math.round(ctx.C),
		fragmentation: Math.round(ctx.I),
		recoveryPhysiology: ctx.R !== null ? Math.round(ctx.R) : 0,
		structure: ctx.S !== null ? ctx.S : undefined,
		timingAlignment: Math.round(ctx.T),
		preliminaryScore: preliminary,
		penaltyTotal,
		penaltyFlags,
	}

	return { score, breakdown }
}

// MARK: - Contributor Detail

export type ContributorDetailField = {
	label: string
	value: string
	/** ISO8601 instant; clients should format in the user's local timezone when present. */
	localDisplayIso?: string
	/** UTC time-of-day as minutes since midnight (scoring uses this); clients map to local clock for display. */
	utcMinutesFromMidnight?: number
}

export type ContributorDetail = {
	key: string
	score: number
	rawValue: number
	rawLabel: string
	baselineMean?: number
	baselineStd?: number
	zScore?: number
	formula: string
	weight: number
	/** Extra labeled values for the detail screen (e.g. tonight vs baseline onset). */
	detailFields?: ContributorDetailField[]
	subComponents?: Array<{
		name: string
		rawValue: number
		score: number
		baselineMean?: number
		baselineStd?: number
		zScore?: number
	}>
}

function formatMinutes(mins: number): string {
	const total = Math.max(0, Math.round(mins))
	const h = Math.floor(total / 60)
	const m = total % 60
	if (h > 0 && m > 0) return `${h}h ${m}m`
	if (h > 0) return `${h}h`
	return `${m}m`
}

/** Wall-clock label in UTC (matches onset/midpoint math in scoring). */
function utcClockLabelFromIso(iso: string): string {
	const d = new Date(iso)
	const h24 = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
	return midpointToTimeLabel(h24)
}

function utcClockLabelFromMinutesSinceMidnight(mins: number): string {
	return midpointToTimeLabel(mins / 60)
}

function midpointToTimeLabel(hour: number): string {
	let h24 = hour < 0 ? hour + 24 : hour
	const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
	const suffix = h24 < 12 ? 'AM' : 'PM'
	const mins = Math.round((h24 % 1) * 60)
	return `${Math.floor(h12)}:${mins.toString().padStart(2, '0')} ${suffix}`
}

export function computeContributorDetail(
	key: string,
	metrics: NightlyMetrics,
	baseline: BaselineStats | null,
	recentMetrics: NightlyMetrics[],
	config: ScoringConfig = SCORING_CONFIG_V2
): ContributorDetail | null {
	const w = config.sleepWeights
	const k = config.kValues
	const prior = priorNights(recentMetrics, metrics.date)
	const ctx = buildSleepV2Context(metrics, baseline, recentMetrics, config)

	switch (key) {
		case 'durationAdequacy': {
			const need = ctx.need
			const tst = metrics.totalAsleepDuration
			const priorWindow = tail(prior, 28)
			const medianTstRaw =
				prior.length === 0 ? null : median(priorWindow.map(m => m.totalAsleepDuration))

			const detailFields: ContributorDetailField[] = [
				{ label: 'Total sleep time', value: formatMinutes(tst) },
			]
			if (medianTstRaw !== null) {
				detailFields.push({
					label: 'Median sleep (L28)',
					value: formatMinutes(medianTstRaw),
				})
			} else {
				detailFields.push({
					label: 'Median sleep (L28)',
					value: 'No L28 data yet',
				})
			}
			detailFields.push({
				label: 'Need used in formula',
				value:
					medianTstRaw === null
						? `${formatMinutes(need)} (default until L28 available)`
						: `${formatMinutes(need)} (L28 median clamped to 7–9h)`,
			})

			return {
				key,
				score: Math.round(ctx.D),
				weight: w.D,
				rawValue: tst,
				rawLabel: `${formatMinutes(tst)} asleep vs ${formatMinutes(need)} need (scoring baseline)`,
				detailFields,
				formula:
					'D = 100 × min(1, TST/Need), minus oversleep penalty beyond Need+90m. Need = clamp(L28 median TST, 7h–9h); Values shows the raw L28 median separately.',
			}
		}
		case 'consistency': {
			const window = tail(prior, 28)
			if (window.length < 5) {
				return {
					key,
					score: Math.round(ctx.C),
					weight: w.C,
					rawValue: 0,
					rawLabel: 'Building history',
					formula: 'Default until L28 has at least 5 nights for onset median.',
				}
			}
			const medOnset = median(window.map(m => minutesSinceUtcMidnight(m.sleepStartTime)))
			const tonight = minutesSinceUtcMidnight(metrics.sleepStartTime)
			const delta = circularDeltaMinutes(medOnset, tonight)
			return {
				key,
				score: Math.round(ctx.C),
				weight: w.C,
				rawValue: Math.round(delta * 10) / 10,
				rawLabel: `${formatMinutes(delta)} from your typical onset`,
				detailFields: [
					{
						label: 'Sleep onset (this night)',
						value: utcClockLabelFromIso(metrics.sleepStartTime),
						localDisplayIso: metrics.sleepStartTime,
					},
					{
						label: 'Typical onset (L28 median)',
						value: utcClockLabelFromMinutesSinceMidnight(medOnset),
						utcMinutesFromMidnight: medOnset,
					},
					{ label: 'Deviation (shortest arc)', value: formatMinutes(delta) },
				],
				formula: 'C = 100 × exp(−(Δonset/75)^1.6) vs L28 median sleep onset (UTC clock).',
			}
		}
		case 'fragmentation': {
			const an = metrics.awakeningCountOver2m
			const at = metrics.awakeAfterOnsetMinutes
			const lmax = metrics.longestAwakeEpisodeMinutes
			if (an !== undefined && at !== undefined && lmax !== undefined) {
				return {
					key,
					score: Math.round(ctx.I),
					weight: w.I,
					rawValue: an,
					rawLabel: `${an} awakenings >2m · ${formatMinutes(at)} awake · longest ${formatMinutes(lmax)}`,
					detailFields: [
						{ label: 'Awakenings over 2 minutes', value: String(an) },
						{ label: 'Total awake after sleep onset', value: formatMinutes(at) },
						{ label: 'Longest awake episode', value: formatMinutes(lmax) },
					],
					formula: 'I = 100 − (3×A_n + 0.8×A_t + 0.7×L_max), post sleep onset.',
				}
			}
			return {
				key,
				score: Math.round(ctx.I),
				weight: w.I,
				rawValue: metrics.wasoDuration ?? 0,
				rawLabel: `WASO ~${formatMinutes(metrics.wasoDuration ?? 0)} (estimated)`,
				detailFields: [
					{
						label: 'WASO (in-bed estimate)',
						value: formatMinutes(metrics.wasoDuration ?? 0),
					},
				],
				formula: 'Fallback: WASO and efficiency-based estimate when post-onset fragmentation fields are missing.',
			}
		}
		case 'recoveryPhysiology': {
			const r = computeRecoveryPhysiology(metrics, tail(prior, 30), k)
			if (r === null) {
				return {
					key,
					score: 0,
					weight: w.R,
					rawValue: 0,
					rawLabel: 'Insufficient L30 history',
					formula: 'Dropped from weighted sum when no L30 rolling baselines for available metrics.',
				}
			}
			const subs: ContributorDetail['subComponents'] = []
			const prior30 = tail(prior, 30)
			const hrVals = prior30.map(m => m.avgHr).filter(v => v > 0)
			const hrvVals = prior30.map(m => m.hrvMean).filter((v): v is number => v !== undefined && v >= 0)
			const rrVals = prior30.map(m => m.respiratoryRateMean).filter((v): v is number => v !== undefined && v >= 0)
			const tempVals = prior30.map(m => m.temperatureDeviation).filter((v): v is number => v !== undefined)

			if (metrics.hrvMean !== undefined) {
				const st = meanStd(hrvVals)
				if (st) {
					const z = computeZScore(metrics.hrvMean, st.mean, st.std)
					subs.push({
						name: 'HRV',
						rawValue: Math.round(metrics.hrvMean * 10) / 10,
						score: Math.round(sigmoid(z, k.moderate)),
						baselineMean: st.mean,
						baselineStd: st.std,
						zScore: z,
					})
				}
			}
			const hrSt = meanStd(hrVals)
			if (hrSt) {
				const z = computeZScore(metrics.avgHr, hrSt.mean, hrSt.std)
				subs.push({
					name: 'Heart rate',
					rawValue: Math.round(metrics.avgHr * 10) / 10,
					score: Math.round(sigmoid(-z, k.moderate)),
					baselineMean: hrSt.mean,
					baselineStd: hrSt.std,
					zScore: z,
				})
			}
			if (metrics.respiratoryRateMean !== undefined) {
				const st = meanStd(rrVals)
				if (st) {
					const z = computeZScore(metrics.respiratoryRateMean, st.mean, st.std)
					subs.push({
						name: 'Respiratory rate',
						rawValue: Math.round(metrics.respiratoryRateMean * 10) / 10,
						score: Math.round(sigmoid(-Math.abs(z), k.steep)),
						baselineMean: st.mean,
						baselineStd: st.std,
						zScore: z,
					})
				}
			}
			if (metrics.temperatureDeviation !== undefined) {
				const st = meanStd(tempVals)
				if (st) {
					const z = computeZScore(metrics.temperatureDeviation, st.mean, st.std)
					subs.push({
						name: 'Temperature deviation',
						rawValue: Math.round(metrics.temperatureDeviation * 1000) / 1000,
						score: Math.round(sigmoid(-Math.abs(z), k.steep)),
						baselineMean: st.mean,
						baselineStd: st.std,
						zScore: z,
					})
				}
			}

			const physioFields: ContributorDetailField[] = [
				{ label: 'Nights in rolling window', value: `${prior30.length} (L30 max)` },
				{ label: 'Sleep heart rate (avg)', value: `${Math.round(metrics.avgHr * 10) / 10} bpm` },
			]
			if (metrics.hrvMean !== undefined) {
				physioFields.push({
					label: 'HRV (SDNN, mean)',
					value: `${Math.round(metrics.hrvMean * 10) / 10} ms`,
				})
			}
			if (metrics.respiratoryRateMean !== undefined) {
				physioFields.push({
					label: 'Respiratory rate (mean)',
					value: `${Math.round(metrics.respiratoryRateMean * 10) / 10} br/min`,
				})
			}
			if (metrics.temperatureDeviation !== undefined) {
				physioFields.push({
					label: 'Wrist temp deviation',
					value: String(Math.round(metrics.temperatureDeviation * 1000) / 1000),
				})
			}

			return {
				key,
				score: Math.round(r),
				weight: w.R,
				rawValue: Math.round(r * 10) / 10,
				rawLabel: `${Math.round(r)}/100`,
				detailFields: physioFields,
				formula: 'Average of sigmoid z-scores vs L30 (HRV, HR, RR, temperature when present).',
				subComponents: subs.length > 0 ? subs : undefined,
			}
		}
		case 'structure': {
			const s = computeStructure(metrics, baseline)
			if (s === null) {
				return null
			}
			const eff = metrics.totalInBedDuration > 0 ? (metrics.totalAsleepDuration / metrics.totalInBedDuration) * 100 : 0
			const tst = metrics.totalAsleepDuration
			const deepPct = metrics.deepDuration !== undefined && tst > 0 ? (metrics.deepDuration / tst) * 100 : 0
			const remPct = metrics.remDuration !== undefined && tst > 0 ? (metrics.remDuration / tst) * 100 : 0
			const corePct = metrics.coreDuration !== undefined && tst > 0 ? (metrics.coreDuration / tst) * 100 : 0
			const awakePct = Math.max(0, 100 - deepPct - remPct - corePct)
			return {
				key,
				score: s,
				weight: w.S,
				rawValue: Math.round(eff * 10) / 10,
				rawLabel: `${Math.round(eff)}% sleep efficiency`,
				detailFields: [
					{ label: 'Sleep efficiency', value: `${Math.round(eff * 10) / 10}%` },
					{ label: 'Deep sleep', value: `${Math.round(deepPct * 10) / 10}% of asleep time` },
					{ label: 'REM sleep', value: `${Math.round(remPct * 10) / 10}% of asleep time` },
					{ label: 'Awake (within asleep window)', value: `${Math.round(awakePct * 10) / 10}% of asleep time` },
				],
				formula:
					'S = 100 × clamp(0.5 + 0.25×z_eff + 0.25×z_stage) using efficiency, deep%, REM%, awake% vs baselines.',
			}
		}
		case 'timingAlignment': {
			const window = tail(prior, 28)
			if (window.length < 5) {
				return {
					key,
					score: Math.round(ctx.T),
					weight: w.T,
					rawValue: 0,
					rawLabel: 'Building history',
					formula: 'Default until L28 has at least 5 nights for midpoint median.',
				}
			}
			const medMid = median(window.map(m => minutesSinceUtcMidnight(m.sleepMidpoint)))
			const tonight = minutesSinceUtcMidnight(metrics.sleepMidpoint)
			const delta = circularDeltaMinutes(medMid, tonight)
			return {
				key,
				score: Math.round(ctx.T),
				weight: w.T,
				rawValue: Math.round(delta * 10) / 10,
				rawLabel: `${formatMinutes(delta)} from typical sleep midpoint`,
				detailFields: [
					{
						label: 'Sleep midpoint (this night)',
						value: utcClockLabelFromIso(metrics.sleepMidpoint),
						localDisplayIso: metrics.sleepMidpoint,
					},
					{
						label: 'Typical midpoint (L28 median)',
						value: utcClockLabelFromMinutesSinceMidnight(medMid),
						utcMinutesFromMidnight: medMid,
					},
					{ label: 'Deviation (shortest arc)', value: formatMinutes(delta) },
				],
				formula: 'T = 100 × exp(−(Δmidpoint/90)^1.5) vs L28 median sleep midpoint (UTC clock).',
			}
		}
		default:
			return null
	}
}

export type InteractionResult = {
	factor: number
	flags: string[]
}

/**
 * Readiness-only interactions. Sleep duration / fragmentation penalties live in sleep v2 scoring
 * to avoid double-counting against readiness.
 */
export function applyInteractionRules(
	baseScore: number,
	metrics: NightlyMetrics,
	baseline: BaselineStats | null,
	calibrationPhase: number
): InteractionResult {
	const flags: string[] = []
	let factor = 1.0

	if (baseline?.hrv && metrics.hrvMean !== undefined && baseline?.restingHr) {
		const hrvLow = metrics.hrvMean < baseline.hrv.mean - baseline.hrv.std
		const rhrHigh = metrics.avgHr > baseline.restingHr.mean + baseline.restingHr.std

		if (hrvLow && rhrHigh) {
			flags.push('sympathetic_stress')
			factor *= 0.9
		}
	}

	if (baseline?.restingHr) {
		const hrNadirHour = new Date(metrics.minHrTimestamp).getUTCHours()
		const sleepEndHour = new Date(metrics.sleepEndTime).getUTCHours()
		const windowEnd = sleepEndHour - 1
		if (hrNadirHour >= windowEnd && hrNadirHour <= sleepEndHour) {
			flags.push('hr_nadir_late')
			factor *= 0.95
		}
	}

	if (metrics.temperatureDeviation !== undefined && baseline?.tempDeviation) {
		const tempZ = Math.abs(
			computeZScore(metrics.temperatureDeviation, baseline.tempDeviation.mean, baseline.tempDeviation.std)
		)
		if (tempZ > 2.0) {
			flags.push('temperature_anomaly')
			factor *= 0.93
		}
	}

	const bounds = SCORING_CONFIG_V2.interactionBounds[calibrationPhase] ?? SCORING_CONFIG_V2.interactionBounds[3]
	factor = Math.max(bounds.min, Math.min(bounds.max, factor))

	return { factor, flags }
}

export function computeReadinessScore(
	sleepScore: number,
	metrics: NightlyMetrics,
	baseline: BaselineStats | null,
	sleepDebt: number,
	calibrationPhase: number,
	config: ScoringConfig = SCORING_CONFIG_V2
): { score: number; breakdown: ReadinessBreakdown; interactionFactor: number; interactionFlags: string[] } {
	const w = config.readinessWeights
	const k = config.kValues

	const sleepScoreContrib = sleepScore

	let hrvDeviation = 50
	if (metrics.hrvMean !== undefined && baseline?.hrv) {
		const z = computeZScore(metrics.hrvMean, baseline.hrv.mean, baseline.hrv.std)
		hrvDeviation = sigmoid(z, k.moderate)
	}

	let rhrDeviation = 50
	if (baseline?.restingHr) {
		const z = computeZScore(metrics.avgHr, baseline.restingHr.mean, baseline.restingHr.std)
		rhrDeviation = sigmoid(-z, k.moderate)
	}

	let recoveryIndex = 50
	if (baseline?.restingHr) {
		const hrDrop = metrics.avgHr - metrics.minHrValue
		const expectedDrop = baseline.restingHr.mean * 0.15
		recoveryIndex = Math.min(100, (hrDrop / expectedDrop) * 75)
	}

	let hrvTrendSlope = 50
	if (baseline?.hrvSlope14d !== undefined) {
		hrvTrendSlope =
			baseline.hrvSlope14d > 0 ? Math.min(100, 50 + baseline.hrvSlope14d * 10) : Math.max(0, 50 + baseline.hrvSlope14d * 10)
	}

	const sleepDebtScore = Math.max(0, Math.min(100, 100 - sleepDebt * 3))
	const activityLoad = 50

	const baseScore =
		sleepScoreContrib * w.sleepScore +
		hrvDeviation * w.hrvDeviation +
		rhrDeviation * w.rhrDeviation +
		recoveryIndex * w.recoveryIndex +
		hrvTrendSlope * w.hrvTrendSlope +
		sleepDebtScore * w.sleepDebt +
		activityLoad * w.activityLoad

	const interaction = applyInteractionRules(baseScore, metrics, baseline, calibrationPhase)
	const adjustedScore = Math.round(Math.max(0, Math.min(100, baseScore * interaction.factor)))

	return {
		score: adjustedScore,
		breakdown: {
			sleepScoreContrib: Math.round(sleepScoreContrib),
			hrvDeviation: Math.round(hrvDeviation),
			rhrDeviation: Math.round(rhrDeviation),
			recoveryIndex: Math.round(recoveryIndex),
			hrvTrendSlope: Math.round(hrvTrendSlope),
			sleepDebt: Math.round(sleepDebtScore),
			activityLoad: Math.round(activityLoad),
		},
		interactionFactor: interaction.factor,
		interactionFlags: interaction.flags,
	}
}
