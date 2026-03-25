import SwiftUI

/// Explains sleep score penalties from `penaltyFlags` (server `computeSleepScore`).
struct SleepPenaltiesView: View {
    let breakdown: SleepBreakdown
    var nightData: SleepNightDisplay?

    var body: some View {
        if breakdown.penaltyTotal > 0 || !breakdown.penaltyFlags.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Penalties")
                        .font(.headline)
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Penalty score")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(penaltyScoreLabel)
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.red)
                    }
                }
                .padding(.bottom, 12)

                if !breakdown.penaltyFlags.isEmpty {
                    ForEach(Array(breakdown.penaltyFlags.enumerated()), id: \.offset) { index, flag in
                        if let info = Self.baseInfo(for: flag) {
                            if index > 0 { Divider() }
                            penaltyRow(flag: flag, info: info)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var penaltyScoreLabel: String {
        breakdown.penaltyTotal > 0 ? "−\(breakdown.penaltyTotal)" : "0"
    }

    private struct PenaltyBaseInfo {
        let title: String
        let pointsLabel: String
        let because: String
        let barFraction: Double
    }

    private func penaltyRow(flag: String, info: PenaltyBaseInfo) -> some View {
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

            Text(whenLine(flag: flag))
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(3)
                .minimumScaleFactor(0.85)

            if let values = valuesLine(flag: flag), !values.isEmpty {
                Text(values)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .lineLimit(3)
                    .minimumScaleFactor(0.85)
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

    private func whenLine(flag: String) -> String {
        let d = breakdown.durationAdequacy
        let c = breakdown.consistency
        let i = breakdown.fragmentation
        let r = breakdown.recoveryPhysiology
        switch flag {
        case "short_sleep_fragmented":
            return "When: D < 50 and I < 50 · D=\(d), I=\(i)"
        case "adequate_duration_low_recovery":
            return "When: D > 75 and R < 45 · D=\(d), R=\(r)"
        case "low_consistency_low_recovery":
            return "When: C < 45 and R < 45 · C=\(c), R=\(r)"
        case "sleep_debt_7d":
            return "When: Σ max(0, need−TST) > 0"
        default:
            return "When: rule matched for this night"
        }
    }

    private func valuesLine(flag: String) -> String? {
        switch flag {
        case "adequate_duration_low_recovery", "low_consistency_low_recovery":
            return physiologyLine()
        case "sleep_debt_7d":
            return debtAndPhysiologyLine()
        case "short_sleep_fragmented":
            return shortSleepValuesLine()
        default:
            return physiologyLine()
        }
    }

    private func physiologyLine() -> String? {
        var parts: [String] = []
        if let hr = breakdown.nightAvgHr {
            parts.append("HR \(Int(hr.rounded())) bpm")
        }
        if let mn = breakdown.nightMinHr {
            parts.append("min \(Int(mn.rounded())) bpm")
        }
        if let hrv = breakdown.nightHrvMean {
            parts.append("HRV \(formatHrv(hrv)) ms")
        }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    private func debtAndPhysiologyLine() -> String? {
        var parts: [String] = []
        if let sum = breakdown.sleepDebt7dSumMinutes, sum > 0 {
            parts.append("Σ shortfall \(Int(sum.rounded()))m")
        }
        if let need = breakdown.sleepNeedMinutes {
            parts.append("need \(Int(need.rounded()))m")
        }
        if let phys = physiologyLine() {
            parts.append(phys)
        }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    private func shortSleepValuesLine() -> String? {
        var parts: [String] = []
        if let night = nightData {
            parts.append("TST \(formatMinutes(night.totalAsleepMinutes))")
        }
        if let phys = physiologyLine() {
            parts.append(phys)
        }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    private func formatHrv(_ x: Double) -> String {
        let r = (x * 10).rounded() / 10
        if abs(r - r.rounded()) < 0.05 {
            return "\(Int(r.rounded()))"
        }
        return String(format: "%.1f", r)
    }

    private func formatMinutes(_ mins: Double) -> String {
        let h = Int(mins) / 60
        let m = Int(mins) % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }

    private static func baseInfo(for flag: String) -> PenaltyBaseInfo? {
        switch flag {
        case "short_sleep_fragmented":
            return PenaltyBaseInfo(
                title: "Short sleep + fragmentation",
                pointsLabel: "−8 pts",
                because: "Very little sleep together with frequent wake-ups is penalized more than either issue alone.",
                barFraction: 8.0 / 18.0
            )
        case "adequate_duration_low_recovery":
            return PenaltyBaseInfo(
                title: "Long sleep, poor recovery",
                pointsLabel: "−6 pts",
                because: "Enough time in bed but HR/HRV (and related signals) vs your L30 baseline looked strained.",
                barFraction: 6.0 / 18.0
            )
        case "low_consistency_low_recovery":
            return PenaltyBaseInfo(
                title: "Timing off + poor recovery",
                pointsLabel: "−6 pts",
                because: "Unusual sleep timing plus weak recovery metrics suggests your rhythm and physiology didn’t line up.",
                barFraction: 6.0 / 18.0
            )
        case "sleep_debt_7d":
            return PenaltyBaseInfo(
                title: "7-night sleep debt",
                pointsLabel: "Varies (max −18)",
                because: "Each minute of cumulative shortfall adds to the penalty (6% of total minutes), capped at 18 points.",
                barFraction: 1.0
            )
        default:
            let title = flag.split(separator: "_").map { String($0).capitalized }.joined(separator: " ")
            return PenaltyBaseInfo(
                title: title,
                pointsLabel: "—",
                because: "See server scoring for this flag.",
                barFraction: 0.35
            )
        }
    }
}
