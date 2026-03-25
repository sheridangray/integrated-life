import SwiftUI

struct SleepContributorsView: View {
    let breakdown: SleepBreakdown
    let scoreDate: String
    var nightData: SleepNightDisplay?

    @State private var selectedContributor: String?
    @State private var showDetail = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Contributors")
                .font(.headline)
                .padding(.bottom, 12)

            contributorRow(
                "Duration adequacy",
                key: "durationAdequacy",
                value: durationValueLabel,
                fraction: barFraction(breakdown.durationAdequacy)
            )
            divider
            contributorRow(
                "Consistency",
                key: "consistency",
                value: qualitativeLabel(breakdown.consistency),
                fraction: barFraction(breakdown.consistency)
            )
            divider
            contributorRow(
                "Fragmentation",
                key: "fragmentation",
                value: qualitativeLabel(breakdown.fragmentation),
                fraction: barFraction(breakdown.fragmentation)
            )
            divider
            contributorRow(
                "Recovery physiology",
                key: "recoveryPhysiology",
                value: qualitativeLabel(breakdown.recoveryPhysiology),
                fraction: barFraction(breakdown.recoveryPhysiology)
            )
            divider

            if let structure = breakdown.structure {
                contributorRow(
                    "Sleep structure",
                    key: "structure",
                    value: qualitativeLabel(structure),
                    fraction: barFraction(structure)
                )
                divider
            }

            contributorRow(
                "Timing alignment",
                key: "timingAlignment",
                value: qualitativeLabel(breakdown.timingAlignment),
                fraction: barFraction(breakdown.timingAlignment)
            )

            if breakdown.penaltyTotal > 0 {
                divider
                VStack(alignment: .leading, spacing: 6) {
                    Text("Adjustments")
                        .font(.subheadline.weight(.semibold))
                    Text("Preliminary \(breakdown.preliminaryScore) − penalty \(breakdown.penaltyTotal)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if !breakdown.penaltyFlags.isEmpty {
                        Text(breakdown.penaltyFlags.joined(separator: ", "))
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }
                .padding(.vertical, 10)
            }
        }
        .sheet(isPresented: $showDetail) {
            if let key = selectedContributor {
                ContributorDetailView(contributorKey: key, date: scoreDate)
            }
        }
    }

    // MARK: - Row

    private func contributorRow(_ label: String, key: String, value: String, fraction: Double) -> some View {
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
        .contentShape(Rectangle())
        .onLongPressGesture {
            selectedContributor = key
            showDetail = true
        }
    }

    private func barFraction(_ score: Int) -> Double {
        Double(score) / 100.0
    }

    private var divider: some View { Divider() }

    private var durationValueLabel: String {
        if let night = nightData {
            return "\(formatMin(night.totalAsleepMinutes)) asleep"
        }
        return qualitativeLabel(breakdown.durationAdequacy)
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
