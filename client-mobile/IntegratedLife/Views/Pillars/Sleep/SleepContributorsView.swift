import SwiftUI

private struct ContributorSheetItem: Identifiable {
    let contributorKey: String
    var id: String { contributorKey }
}

struct SleepContributorsView: View {
    let breakdown: SleepBreakdown
    let scoreDate: String

    @State private var contributorSheet: ContributorSheetItem?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text("Contributors")
                    .font(.headline)
                Spacer()
                Text("\(breakdown.preliminaryScore)")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.black)
            }
            .padding(.bottom, 12)

            contributorRow(
                labelWithWeight: durationLabelWithWeight,
                key: "durationAdequacy",
                score: breakdown.durationAdequacy,
                fraction: barFraction(breakdown.durationAdequacy)
            )
            divider
            contributorRow(
                labelWithWeight: labelWithWeight("Consistency", key: "consistency"),
                key: "consistency",
                score: breakdown.consistency,
                fraction: barFraction(breakdown.consistency)
            )
            divider
            contributorRow(
                labelWithWeight: labelWithWeight("Interruptions", key: "fragmentation"),
                key: "fragmentation",
                score: breakdown.fragmentation,
                fraction: barFraction(breakdown.fragmentation)
            )
            divider
            contributorRow(
                labelWithWeight: labelWithWeight("Recovery physiology", key: "recoveryPhysiology"),
                key: "recoveryPhysiology",
                score: breakdown.recoveryPhysiology,
                fraction: barFraction(breakdown.recoveryPhysiology)
            )
            divider

            if let structure = breakdown.structure {
                contributorRow(
                    labelWithWeight: labelWithWeight("Sleep structure", key: "structure"),
                    key: "structure",
                    score: structure,
                    fraction: barFraction(structure)
                )
                divider
            }

            contributorRow(
                labelWithWeight: labelWithWeight("Timing alignment", key: "timingAlignment"),
                key: "timingAlignment",
                score: breakdown.timingAlignment,
                fraction: barFraction(breakdown.timingAlignment)
            )
        }
        .sheet(item: $contributorSheet) { item in
            ContributorDetailView(contributorKey: item.contributorKey, date: scoreDate)
        }
    }

    private var durationLabelWithWeight: String {
        let w = Self.weightPercent(for: "durationAdequacy")
        return "Duration (\(w)%)"
    }

    private func labelWithWeight(_ name: String, key: String) -> String {
        let w = Self.weightPercent(for: key)
        return "\(name) (\(w)%)"
    }

    // MARK: - Row

    private func contributorRow(
        labelWithWeight: String,
        key: String,
        score: Int,
        fraction: Double
    ) -> some View {
        let clamped = max(0.02, min(1.0, fraction))
        let barScore = Int(clamped * 100)
        return VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                Text(labelWithWeight)
                    .font(.subheadline)
                Spacer()
                Text("\(score)/100")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
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
            contributorSheet = ContributorSheetItem(contributorKey: key)
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

    private func barColor(_ score: Int) -> Color {
        switch score {
        case 85...100: return .green
        case 70..<85: return .blue
        case 50..<70: return .yellow
        default: return .red
        }
    }
}
