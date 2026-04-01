import Foundation
import SwiftUI

// Manual QA: drag-reorder pillars (persists across launch); verify Sleep/Health cards match detail after navigation;
// airplane mode shows error rows; iPad shows ~2 columns; Time shows placeholder score until product defines a metric.

// MARK: - Attention (0–40 red, 41–70 yellow, 71–100 green, gray neutral)

enum PillarAttentionLevel {
	case needsAttention
	case caution
	case good
	case neutral

	var indicatorColor: Color {
		switch self {
		case .needsAttention: return .red
		case .caution: return .yellow
		case .good: return .green
		case .neutral: return .gray
		}
	}
}

// MARK: - Card presentation (overview UI state, not API DTOs)

struct PillarCardPresentation: Equatable {
	let pillar: Pillar
	let isPlaceholder: Bool
	let scoreText: String
	let deltaText: String?
	let sparklineValues: [Double]
	let attention: PillarAttentionLevel
	let isLoading: Bool
	let errorMessage: String?
	let lastUpdatedText: String?

	static func placeholder(pillar: Pillar) -> PillarCardPresentation {
		PillarCardPresentation(
			pillar: pillar,
			isPlaceholder: true,
			scoreText: "",
			deltaText: nil,
			sparklineValues: [],
			attention: .neutral,
			isLoading: false,
			errorMessage: nil,
			lastUpdatedText: nil
		)
	}
}

// MARK: - Builders

@MainActor
enum PillarOverviewPresentationBuilder {
	/// v1 sleep debt proxy: `readinessBreakdown.sleepDebt` is a 0–100-style component; low values imply worse recovery debt signal.
	private static let sleepDebtStressThreshold = 35

	static func presentation(
		for pillar: Pillar,
		sleepState: SleepState,
		healthState: HealthState,
		lastDataRefresh: Date?
	) -> PillarCardPresentation {
		switch pillar {
		case .sleep:
			return sleepPresentation(sleepState: sleepState, lastDataRefresh: lastDataRefresh)
		case .health:
			return healthPresentation(healthState: healthState, lastDataRefresh: lastDataRefresh)
		case .time:
			return timePresentation(lastDataRefresh: lastDataRefresh)
		case .food, .relationships, .money, .household:
			return .placeholder(pillar: pillar)
		}
	}

	private static func sleepPresentation(
		sleepState: SleepState,
		lastDataRefresh: Date?
	) -> PillarCardPresentation {
		if sleepState.isLoading && sleepState.todayScore == nil && sleepState.history.isEmpty {
			return PillarCardPresentation(
				pillar: .sleep,
				isPlaceholder: false,
				scoreText: "—",
				deltaText: nil,
				sparklineValues: [],
				attention: .neutral,
				isLoading: true,
				errorMessage: nil,
				lastUpdatedText: staleSuffix(lastDataRefresh)
			)
		}
		if let err = sleepState.error, sleepState.todayScore == nil {
			return PillarCardPresentation(
				pillar: .sleep,
				isPlaceholder: false,
				scoreText: "—",
				deltaText: nil,
				sparklineValues: [],
				attention: .neutral,
				isLoading: false,
				errorMessage: err,
				lastUpdatedText: staleSuffix(lastDataRefresh)
			)
		}
		guard let today = sleepState.todayScore else {
			return PillarCardPresentation(
				pillar: .sleep,
				isPlaceholder: false,
				scoreText: "—",
				deltaText: nil,
				sparklineValues: sparklineFromSleepHistory(sleepState.history),
				attention: .neutral,
				isLoading: false,
				errorMessage: nil,
				lastUpdatedText: staleSuffix(lastDataRefresh)
			)
		}

		let score = today.sleepScore
		let debt = today.readinessBreakdown.sleepDebt
		let attention = sleepAttention(score: score, sleepDebtComponent: debt)

		let delta = sleepDeltaShort(todayScore: today, history: sleepState.history)
		let spark = sparklineFromSleepHistory(sleepState.history)

		return PillarCardPresentation(
			pillar: .sleep,
			isPlaceholder: false,
			scoreText: "\(score)",
			deltaText: delta,
			sparklineValues: spark,
			attention: attention,
			isLoading: false,
			errorMessage: nil,
			lastUpdatedText: staleSuffix(lastDataRefresh)
		)
	}

	private static func sleepAttention(score: Int, sleepDebtComponent: Int) -> PillarAttentionLevel {
		if score < 40 || sleepDebtComponent < sleepDebtStressThreshold {
			return .needsAttention
		}
		if score <= 70 {
			return .caution
		}
		return .good
	}

	private static func sleepDeltaShort(todayScore: SleepScoreResponse, history: [SleepScoreResponse]) -> String? {
		let sortedAsc = history.sorted { $0.date < $1.date }
		let prevScore: Int? = {
			if let idx = sortedAsc.firstIndex(where: { $0.date == todayScore.date }) {
				guard idx > 0 else { return nil }
				return sortedAsc[idx - 1].sleepScore
			}
			return sortedAsc.last?.sleepScore
		}()
		guard let prev = prevScore else { return nil }
		let d = todayScore.sleepScore - prev
		if d == 0 { return "no change" }
		let arrow = d > 0 ? "↑" : "↓"
		return "\(arrow) \(abs(d)) pts"
	}

	private static func sparklineFromSleepHistory(_ history: [SleepScoreResponse]) -> [Double] {
		let sortedAsc = history.sorted { $0.date < $1.date }
		return sortedAsc.suffix(7).map { Double($0.sleepScore) }
	}

	private static func healthPresentation(
		healthState: HealthState,
		lastDataRefresh: Date?
	) -> PillarCardPresentation {
		if healthState.isLoading && healthState.history == nil {
			return PillarCardPresentation(
				pillar: .health,
				isPlaceholder: false,
				scoreText: "—",
				deltaText: nil,
				sparklineValues: [],
				attention: .neutral,
				isLoading: true,
				errorMessage: nil,
				lastUpdatedText: staleSuffix(lastDataRefresh)
			)
		}
		if let err = healthState.error, healthState.history == nil {
			return PillarCardPresentation(
				pillar: .health,
				isPlaceholder: false,
				scoreText: "—",
				deltaText: nil,
				sparklineValues: [],
				attention: .neutral,
				isLoading: false,
				errorMessage: err,
				lastUpdatedText: staleSuffix(lastDataRefresh)
			)
		}

		let items = healthState.history?.items ?? []
		let counts = workoutCountsLast7Days(from: items)
		let total = counts.reduce(0, +)
		let attention = healthAttention(totalWorkouts7d: Int(total))

		let delta = healthDelta(counts: counts)

		return PillarCardPresentation(
			pillar: .health,
			isPlaceholder: false,
			scoreText: "\(Int(total))",
			deltaText: delta,
			sparklineValues: counts,
			attention: attention,
			isLoading: false,
			errorMessage: nil,
			lastUpdatedText: staleSuffix(lastDataRefresh)
		)
	}

	/// v1: total workouts in trailing 7 days; targets for color bands.
	private static func healthAttention(totalWorkouts7d: Int) -> PillarAttentionLevel {
		if totalWorkouts7d == 0 { return .needsAttention }
		if totalWorkouts7d < 3 { return .caution }
		return .good
	}

	private static func healthDelta(counts: [Double]) -> String? {
		guard counts.count >= 2 else { return nil }
		let last = counts[counts.count - 1]
		let prev = counts[counts.count - 2]
		let d = last - prev
		if d == 0 { return nil }
		let arrow = d > 0 ? "↑" : "↓"
		return "\(arrow) \(Int(abs(d))) vs prior day"
	}

	private static func workoutCountsLast7Days(from items: [HistoryItem]) -> [Double] {
		let cal = Calendar.current
		let today = cal.startOfDay(for: Date())
		guard let start = cal.date(byAdding: .day, value: -6, to: today) else { return Array(repeating: 0, count: 7) }

		var byDay: [Date: Int] = [:]
		for i in 0..<7 {
			if let d = cal.date(byAdding: .day, value: i, to: start) {
				byDay[cal.startOfDay(for: d)] = 0
			}
		}

		let df = DateFormatter()
		df.calendar = cal
		df.timeZone = cal.timeZone
		df.dateFormat = "yyyy-MM-dd"

		for item in items where item.type == "workout" {
			guard let day = df.date(from: item.date).map({ cal.startOfDay(for: $0) }),
				  day >= start, day <= today else { continue }
			byDay[day, default: 0] += 1
		}

		var result: [Double] = []
		for i in 0..<7 {
			if let d = cal.date(byAdding: .day, value: i, to: start) {
				let key = cal.startOfDay(for: d)
				result.append(Double(byDay[key] ?? 0))
			}
		}
		return result
	}

	private static func timePresentation(lastDataRefresh: Date?) -> PillarCardPresentation {
		PillarCardPresentation(
			pillar: .time,
			isPlaceholder: false,
			scoreText: "—",
			deltaText: nil,
			sparklineValues: [],
			attention: .neutral,
			isLoading: false,
			errorMessage: nil,
			lastUpdatedText: staleSuffix(lastDataRefresh)
		)
	}

	private static func staleSuffix(_ last: Date?) -> String? {
		guard let last else { return nil }
		let secs = Date().timeIntervalSince(last)
		if secs < 120 { return nil }
		let hours = Int(secs / 3600)
		if hours < 1 { return "Updated \(Int(secs / 60))m ago" }
		if hours < 24 { return "Updated \(hours)h ago" }
		return "Updated \(hours / 24)d ago"
	}
}
