import SwiftUI

struct SleepContributorsView: View {
    let breakdown: SleepBreakdown
    var nightData: SleepNightDisplay?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Contributors")
                .font(.headline)
                .padding(.bottom, 12)

            contributorRow("Total Sleep", value: totalSleepDisplay,
                           fraction: totalSleepFraction)
            divider
            contributorRow("Efficiency", value: efficiencyDisplay,
                           fraction: efficiencyFraction)
            divider
            contributorRow("Restfulness", value: qualitativeLabel(restfulnessScore),
                           fraction: Double(restfulnessScore) / 100.0)
            divider

            if breakdown.rem != nil {
                contributorRow("REM Sleep", value: remDisplay,
                               fraction: remFraction)
                divider
            }
            if breakdown.deep != nil {
                contributorRow("Deep Sleep", value: deepDisplay,
                               fraction: deepFraction)
                divider
            }

            contributorRow("Timing", value: qualitativeLabel(breakdown.timing),
                           fraction: Double(breakdown.timing) / 100.0)
            divider
            contributorRow("Physio Stability", value: qualitativeLabel(breakdown.physioStability),
                           fraction: Double(breakdown.physioStability) / 100.0)
        }
    }

    // MARK: - Row

    private func contributorRow(_ label: String, value: String, fraction: Double) -> some View {
        let clamped = max(0.02, min(1.0, fraction))
        let score = Int(clamped * 100)
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label).font(.subheadline)
                Spacer()
                Text(value).font(.subheadline).foregroundStyle(.secondary)
            }
            GeometryReader { geo in
                RoundedRectangle(cornerRadius: 3)
                    .fill(barColor(score))
                    .frame(width: geo.size.width * clamped)
            }
            .frame(height: 4)
        }
        .padding(.vertical, 10)
    }

    private var divider: some View { Divider() }

    // MARK: - Total Sleep (7 h = 100 %)

    private var totalSleepDisplay: String {
        guard let night = nightData else { return formatMin(Double(breakdown.duration) / 100 * 480) }
        return formatMin(night.totalAsleepMinutes)
    }

    private var totalSleepFraction: Double {
        guard let night = nightData else { return Double(breakdown.duration) / 100 }
        return min(1.0, night.totalAsleepMinutes / 420)
    }

    // MARK: - Efficiency

    private var rawEfficiencyPct: Double {
        guard let night = nightData else { return Double(breakdown.efficiency) }
        let inBed = night.stageDurations.totalWithAwake
        guard inBed > 0 else { return 0 }
        return (night.totalAsleepMinutes / inBed) * 100
    }

    private var adjustedEfficiency: Double {
        var score = rawEfficiencyPct

        if latencyMinutes > 20 {
            score -= min(10, (latencyMinutes - 20) * 0.5)
        }
        let wakeups = middleWakeupDurations
        if wakeups.contains(where: { $0 > 15 }) { score -= 3 }
        if wakeups.count >= 3 { score -= Double(wakeups.count - 2) * 2 }

        return max(0, min(100, score))
    }

    private var efficiencyDisplay: String {
        guard let night = nightData else { return "\(breakdown.efficiency)%" }
        let inBed = night.stageDurations.totalWithAwake
        guard inBed > 0 else { return "N/A" }
        let pct = Int(rawEfficiencyPct)
        return "\(pct)% (\(formatMin(night.totalAsleepMinutes)) / \(formatMin(inBed)))"
    }

    private var efficiencyFraction: Double { adjustedEfficiency / 100 }

    // MARK: - Efficiency helpers (latency & wakeups)

    private var latencyMinutes: Double {
        guard let segs = nightData?.stageSegments,
              let first = segs.first, first.stage == .awake else { return 0 }
        return first.end.timeIntervalSince(first.start) / 60
    }

    private var middleWakeupDurations: [Double] {
        guard let segs = nightData?.stageSegments, segs.count > 2 else { return [] }
        return segs.dropFirst().dropLast().compactMap { seg in
            seg.stage == .awake ? seg.end.timeIntervalSince(seg.start) / 60 : nil
        }
    }

    // MARK: - Restfulness

    private var restfulnessScore: Int {
        guard let night = nightData else { return breakdown.restfulness }
        let inBed = night.stageDurations.totalWithAwake
        guard inBed > 0 else { return 0 }
        let wasoPct = night.stageDurations.awake / inBed * 100
        return Int(max(0, min(100, 100 - wasoPct * 5)))
    }

    // MARK: - REM (25 % of total asleep = 100 score)

    private var remFraction: Double {
        guard let night = nightData, night.stageDurations.rem > 0,
              night.totalAsleepMinutes > 0 else {
            return Double(breakdown.rem ?? 0) / 100
        }
        let pct = night.stageDurations.rem / night.totalAsleepMinutes * 100
        return min(1.0, pct / 25)
    }

    private var remDisplay: String {
        guard let night = nightData, night.stageDurations.rem > 0 else {
            return breakdown.rem.map { qualitativeLabel($0) } ?? "N/A"
        }
        let pct = night.totalAsleepMinutes > 0
            ? Int((night.stageDurations.rem / night.totalAsleepMinutes) * 100) : 0
        return "\(formatMin(night.stageDurations.rem)), \(pct)%"
    }

    // MARK: - Deep (20 % of total asleep = 100 score)

    private var deepFraction: Double {
        guard let night = nightData, night.stageDurations.deep > 0,
              night.totalAsleepMinutes > 0 else {
            return Double(breakdown.deep ?? 0) / 100
        }
        let pct = night.stageDurations.deep / night.totalAsleepMinutes * 100
        return min(1.0, pct / 20)
    }

    private var deepDisplay: String {
        guard let night = nightData, night.stageDurations.deep > 0 else {
            return breakdown.deep.map { qualitativeLabel($0) } ?? "N/A"
        }
        let pct = night.totalAsleepMinutes > 0
            ? Int((night.stageDurations.deep / night.totalAsleepMinutes) * 100) : 0
        return "\(formatMin(night.stageDurations.deep)), \(pct)%"
    }

    // MARK: - Helpers

    private func qualitativeLabel(_ score: Int) -> String {
        switch score {
        case 85...100: return "Optimal"
        case 70..<85: return "Good"
        case 50..<70: return "Fair"
        default: return "Pay attention"
        }
    }

    private func formatMin(_ mins: Double) -> String {
        let h = Int(mins) / 60
        let m = Int(mins) % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }

    private func barColor(_ score: Int) -> Color {
        switch score {
        case 85...100: return .green
        case 70..<85: return .blue
        case 50..<70: return .yellow
        default: return .red
        }
    }
}
