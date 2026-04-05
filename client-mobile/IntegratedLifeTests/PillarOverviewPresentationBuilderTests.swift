import XCTest
@testable import IntegratedLife

@MainActor
final class PillarOverviewPresentationBuilderTests: XCTestCase {
    
    // MARK: - Attention Level Tests
    
    func testSleepAttention_needsAttention_whenScoreBelow40() {
        let attention = PillarOverviewPresentationBuilder.sleepAttention(score: 25, sleepDebtComponent: 50)
        XCTAssertEqual(attention, .needsAttention, "Score 25 should need attention")
    }
    
    func testSleepAttention_needsAttention_whenSleepDebtBelowThreshold() {
        let attention = PillarOverviewPresentationBuilder.sleepAttention(score: 75, sleepDebtComponent: 20)
        XCTAssertEqual(attention, .needsAttention, "Low sleep debt should need attention")
    }
    
    func testSleepAttention_caution_whenScore40To70() {
        let attention = PillarOverviewPresentationBuilder.sleepAttention(score: 55, sleepDebtComponent: 50)
        XCTAssertEqual(attention, .caution, "Score 55 should be caution")
    }
    
    func testSleepAttention_good_whenScoreAbove70() {
        let attention = PillarOverviewPresentationBuilder.sleepAttention(score: 85, sleepDebtComponent: 50)
        XCTAssertEqual(attention, .good, "Score 85 should be good")
    }
    
    // MARK: - Health Attention Tests
    
    func testHealthAttention_needsAttention_whenZeroWorkouts() {
        let attention = PillarOverviewPresentationBuilder.healthAttention(totalWorkouts7d: 0)
        XCTAssertEqual(attention, .needsAttention, "Zero workouts should need attention")
    }
    
    func testHealthAttention_caution_when1To2Workouts() {
        let attention1 = PillarOverviewPresentationBuilder.healthAttention(totalWorkouts7d: 1)
        let attention2 = PillarOverviewPresentationBuilder.healthAttention(totalWorkouts7d: 2)
        XCTAssertEqual(attention1, .caution, "1 workout should be caution")
        XCTAssertEqual(attention2, .caution, "2 workouts should be caution")
    }
    
    func testHealthAttention_good_when3PlusWorkouts() {
        let attention = PillarOverviewPresentationBuilder.healthAttention(totalWorkouts7d: 3)
        XCTAssertEqual(attention, .good, "3 workouts should be good")
    }
    
    // MARK: - Stale Suffix Tests
    
    func testStaleSuffix_nilWhenRecent() {
        let recent = Date().addingTimeInterval(-60)
        let suffix = PillarOverviewPresentationBuilder.staleSuffix(recent)
        XCTAssertNil(suffix, "Should not show stale for recent data")
    }
    
    func testStaleSuffix_showsMinutes() {
        let fiveMinAgo = Date().addingTimeInterval(-5 * 60)
        let suffix = PillarOverviewPresentationBuilder.staleSuffix(fiveMinAgo)
        XCTAssertTrue(suffix?.contains("m ago") ?? false, "Should show minutes ago")
    }
    
    func testStaleSuffix_showsHours() {
        let threeHoursAgo = Date().addingTimeInterval(-3 * 3600)
        let suffix = PillarOverviewPresentationBuilder.staleSuffix(threeHoursAgo)
        XCTAssertTrue(suffix?.contains("h ago") ?? false, "Should show hours ago")
    }
    
    func testStaleSuffix_showsDays() {
        let threeDaysAgo = Date().addingTimeInterval(-3 * 24 * 3600)
        let suffix = PillarOverviewPresentationBuilder.staleSuffix(threeDaysAgo)
        XCTAssertTrue(suffix?.contains("d ago") ?? false, "Should show days ago")
    }
    
    func testStaleSuffix_nilWhenNil() {
        let suffix = PillarOverviewPresentationBuilder.staleSuffix(nil)
        XCTAssertNil(suffix, "Should be nil when date is nil")
    }
    
    // MARK: - Sparkline Tests
    
    func testSparklineFromSleepHistory_returnsLast7Days() {
        let history = (0..<10).map { i in
            createSleepScore(date: dateStr(daysAgo: i), score: 70 + i, debt: 50)
        }
        let sparkline = PillarOverviewPresentationBuilder.sparklineFromSleepHistory(history)
        XCTAssertEqual(sparkline.count, 7, "Should return 7 days")
    }
    
    func testSparklineFromSleepHistory_sortedAscending() {
        let history = [
            createSleepScore(date: dateStr(daysAgo: 3), score: 73, debt: 50),
            createSleepScore(date: dateStr(daysAgo: 1), score: 71, debt: 50),
            createSleepScore(date: dateStr(daysAgo: 2), score: 72, debt: 50),
        ]
        let sparkline = PillarOverviewPresentationBuilder.sparklineFromSleepHistory(history)
        XCTAssertEqual(sparkline, [73.0, 72.0, 71.0], "Should be sorted ascending")
    }
    
    // MARK: - Delta Tests
    
    func testSleepDelta_showsUpArrowWhenIncrease() {
        let today = createSleepScore(date: dateStr(daysAgo: 0), score: 80, debt: 50)
        let history = [createSleepScore(date: dateStr(daysAgo: 1), score: 75, debt: 50)]
        let delta = PillarOverviewPresentationBuilder.sleepDeltaShort(todayScore: today, history: history)
        XCTAssertTrue(delta?.contains("↑") ?? false, "Should show up arrow for increase")
        XCTAssertTrue(delta?.contains("5") ?? false, "Should show delta of 5")
    }
    
    func testSleepDelta_showsDownArrowWhenDecrease() {
        let today = createSleepScore(date: dateStr(daysAgo: 0), score: 70, debt: 50)
        let history = [createSleepScore(date: dateStr(daysAgo: 1), score: 75, debt: 50)]
        let delta = PillarOverviewPresentationBuilder.sleepDeltaShort(todayScore: today, history: history)
        XCTAssertTrue(delta?.contains("↓") ?? false, "Should show down arrow for decrease")
        XCTAssertTrue(delta?.contains("5") ?? false, "Should show delta of 5")
    }
    
    func testSleepDelta_showsNoChangeWhenEqual() {
        let today = createSleepScore(date: dateStr(daysAgo: 0), score: 75, debt: 50)
        let history = [createSleepScore(date: dateStr(daysAgo: 1), score: 75, debt: 50)]
        let delta = PillarOverviewPresentationBuilder.sleepDeltaShort(todayScore: today, history: history)
        XCTAssertEqual(delta, "no change", "Should show 'no change'")
    }
    
    func testSleepDelta_nilWhenNoHistory() {
        let today = createSleepScore(date: dateStr(daysAgo: 0), score: 75, debt: 50)
        let history: [SleepScoreResponse] = []
        let delta = PillarOverviewPresentationBuilder.sleepDeltaShort(todayScore: today, history: history)
        XCTAssertNil(delta, "Should be nil when no history")
    }
}

// MARK: - Test Helpers

private func createSleepScore(date: String, score: Int, debt: Int) -> SleepScoreResponse {
    SleepScoreResponse(
        id: UUID().uuidString,
        date: date,
        sleepScore: score,
        readinessScore: score,
        sleepBreakdown: SleepBreakdown(
            durationAdequacy: 80,
            consistency: 80,
            fragmentation: 20,
            recoveryPhysiology: 80,
            structure: 80,
            timingAlignment: 80,
            preliminaryScore: score,
            penaltyTotal: 0,
            penaltyFlags: [],
            sleepNeedMinutes: 480,
            sleepDebt7dSumMinutes: nil,
            nightAvgHr: 60,
            nightMinHr: 50,
            nightHrvMean: 50
        ),
        readinessBreakdown: ReadinessBreakdown(
            sleepScoreContrib: score,
            hrvDeviation: 0,
            rhrDeviation: 0,
            recoveryIndex: 50,
            hrvTrendSlope: 0,
            sleepDebt: debt,
            activityLoad: 50
        ),
        interactionFlags: [],
        interactionFactor: 1.0,
        actionBucket: .maintain,
        modelVersion: "1.0",
        calibrationPhase: 0,
        deviceTier: .a
    )
}

private func dateStr(daysAgo: Int) -> String {
    let df = DateFormatter()
    df.dateFormat = "yyyy-MM-dd"
    df.timeZone = TimeZone(identifier: "UTC")!
    let date = Calendar.current.date(byAdding: .day, value: -daysAgo, to: Date())!
    return df.string(from: date)
}
