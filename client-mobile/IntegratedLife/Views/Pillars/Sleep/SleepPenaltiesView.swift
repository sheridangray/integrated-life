import SwiftUI

/// Explains sleep score penalties from `penaltyFlags` (server `computeSleepScore`).
struct SleepPenaltiesView: View {
    let breakdown: SleepBreakdown
    let finalScore: Int

    var body: some View {
        if breakdown.penaltyTotal > 0 || !breakdown.penaltyFlags.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
                Text("Penalties")
                    .font(.headline)
                    .padding(.bottom, 12)

                if !summaryLine.isEmpty {
                    Text(summaryLine)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding(.bottom, 12)
                }

                if !breakdown.penaltyFlags.isEmpty {
                    ForEach(Array(breakdown.penaltyFlags.enumerated()), id: \.offset) { index, flag in
                        if let info = Self.info(for: flag) {
                            if index > 0 { Divider() }
                            penaltyRow(info)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var summaryLine: String {
        let pre = breakdown.preliminaryScore
        let pen = breakdown.penaltyTotal
        if pen > 0 {
            return
                "Contributors combined to \(pre) before penalties. Total penalty −\(pen) → sleep score \(finalScore)."
        }
        if !breakdown.penaltyFlags.isEmpty {
            return "Rule-based adjustments applied for this night (see below)."
        }
        return ""
    }

    private struct PenaltyInfo {
        let title: String
        /// Matches server deduction where fixed (e.g. "−8 pts").
        let pointsLabel: String
        /// Exact trigger logic from scoring (user-facing).
        let when: String
        /// Short interpretation after the rule fires.
        let because: String
        /// Bar fill 0...1 for visual weight (max single rule ≈ 18).
        let barFraction: Double
    }

    private func penaltyRow(_ info: PenaltyInfo) -> some View {
        let clamped = max(0.04, min(1.0, info.barFraction))
        return VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                Text(info.title)
                    .font(.subheadline)
                Spacer()
                Text(info.pointsLabel)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("When")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                Text(info.when)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.orange.opacity(0.2))
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.orange)
                        .frame(width: geo.size.width * clamped)
                }
            }
            .frame(height: 4)

            Text(info.because)
                .font(.caption)
                .foregroundStyle(.tertiary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 10)
    }

    private static func info(for flag: String) -> PenaltyInfo? {
        switch flag {
        case "short_sleep_fragmented":
            return PenaltyInfo(
                title: "Short sleep + fragmentation",
                pointsLabel: "−8 pts",
                when: "Duration adequacy (D) is below 50 and Interruptions (I) is below 50 on the same night.",
                because: "Very little sleep together with frequent wake-ups is penalized more than either issue alone.",
                barFraction: 8.0 / 18.0
            )
        case "adequate_duration_low_recovery":
            return PenaltyInfo(
                title: "Long sleep, poor recovery",
                pointsLabel: "−6 pts",
                when: "Duration adequacy (D) is above 75, recovery physiology (R) is in the score, and R is below 45.",
                because: "Enough time in bed but HR/HRV (and related signals) vs your L30 baseline looked strained.",
                barFraction: 6.0 / 18.0
            )
        case "low_consistency_low_recovery":
            return PenaltyInfo(
                title: "Timing off + poor recovery",
                pointsLabel: "−6 pts",
                when: "Consistency (C) is below 45, R is in the score, and R is below 45.",
                because: "Unusual sleep timing plus weak recovery metrics suggests your rhythm and physiology didn’t line up.",
                barFraction: 6.0 / 18.0
            )
        case "sleep_debt_7d":
            return PenaltyInfo(
                title: "7-night sleep debt",
                pointsLabel: "Varies (max −18)",
                when:
                    "Sum over the last 7 scored nights of max(0, need − time asleep) is greater than zero. Need is your L28 median TST clamped to 7–9h.",
                because: "Each minute of cumulative shortfall adds to the penalty (6% of total minutes), capped at 18 points.",
                barFraction: 1.0
            )
        default:
            let title = flag.split(separator: "_").map { String($0).capitalized }.joined(separator: " ")
            return PenaltyInfo(
                title: title,
                pointsLabel: "—",
                when: "Triggered when this rule’s conditions in the current sleep scoring model are met.",
                because: "See server scoring for this flag.",
                barFraction: 0.35
            )
        }
    }
}
