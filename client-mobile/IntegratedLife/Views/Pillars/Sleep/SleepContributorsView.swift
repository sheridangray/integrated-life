import SwiftUI

struct SleepContributorsView: View {
    let breakdown: SleepBreakdown
    let scoreDate: String
    var nightData: SleepNightDisplay?

    @State private var selectedContributor: String?
    @State private var showDetail = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text("Contributors")
                    .font(.headline)
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Contributor score")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("\(breakdown.preliminaryScore)")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.black)
                }
            }
            .padding(.bottom, 12)

            contributorRow(
                "Duration adequacy",
                key: "durationAdequacy",
                score: breakdown.durationAdequacy,
                subtitle: durationSubtitle,
                fraction: barFraction(breakdown.durationAdequacy)
            )
            divider
            contributorRow(
                "Consistency",
                key: "consistency",
                score: breakdown.consistency,
                subtitle: nil,
                fraction: barFraction(breakdown.consistency)
            )
            divider
            contributorRow(
                "Interruptions",
                key: "fragmentation",
                score: breakdown.fragmentation,
                subtitle: nil,
                fraction: barFraction(breakdown.fragmentation)
            )
            divider
            contributorRow(
                "Recovery physiology",
                key: "recoveryPhysiology",
                score: breakdown.recoveryPhysiology,
                subtitle: nil,
                fraction: barFraction(breakdown.recoveryPhysiology)
            )
            divider

            if let structure = breakdown.structure {
                contributorRow(
                    "Sleep structure",
                    key: "structure",
                    score: structure,
                    subtitle: nil,
                    fraction: barFraction(structure)
                )
                divider
            }

            contributorRow(
                "Timing alignment",
                key: "timingAlignment",
                score: breakdown.timingAlignment,
                subtitle: nil,
                fraction: barFraction(breakdown.timingAlignment)
            )
        }
        .sheet(isPresented: $showDetail) {
            if let key = selectedContributor {
                ContributorDetailView(contributorKey: key, date: scoreDate)
            }
        }
    }

    // MARK: - Row

    private func contributorRow(
        _ label: String,
        key: String,
        score: Int,
        subtitle: String?,
        fraction: Double
    ) -> some View {
        let clamped = max(0.02, min(1.0, fraction))
        let barScore = Int(clamped * 100)
        let w = Self.weightPercent(for: key)
        return VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                Text(label).font(.subheadline)
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(score)/100 · \(w)% weight")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    if let subtitle, !subtitle.isEmpty {
                        Text(subtitle)
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
            GeometryReader { geo in
                RoundedRectangle(cornerRadius: 3)
                    .fill(barColor(barScore))
                    .frame(width: geo.size.width * clamped)
            }
            .frame(height: 4)
        }
        .padding(.vertical, 10)
        .contentShape(Rectangle())
        .onTapGesture {
            selectedContributor = key
            showDetail = true
        }
    }

    private static func weightPercent(for key: String) -> Int {
        switch key {
        case "durationAdequacy": return 35
        case "consistency": return 20
        case "fragmentation": return 15
        case "recoveryPhysiology": return 15
        case "structure": return 10
        case "timingAlignment": return 5
        default: return 0
        }
    }

    private func barFraction(_ score: Int) -> Double {
        Double(score) / 100.0
    }

    private var divider: some View { Divider() }

    private var durationSubtitle: String? {
        guard let night = nightData else { return nil }
        return "\(formatMin(night.totalAsleepMinutes)) asleep"
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
