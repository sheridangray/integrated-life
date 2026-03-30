import SwiftUI

// MARK: - Shared penalty copy (row + detail sheet)

private struct PenaltyBaseInfo {
    let title: String
    let pointsLabel: String
    let because: String
    let barFraction: Double
}

private func penaltyBaseInfo(for flag: String) -> PenaltyBaseInfo? {
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

private func penaltyWhenLine(flag: String, breakdown: SleepBreakdown) -> String {
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

/// Contributor API keys to load for this penalty (same detail payloads as the Contributors card).
private func contributorKeysForPenalty(flag: String) -> [String] {
    switch flag {
    case "short_sleep_fragmented":
        return ["durationAdequacy", "fragmentation"]
    case "adequate_duration_low_recovery":
        return ["durationAdequacy", "recoveryPhysiology"]
    case "low_consistency_low_recovery":
        return ["consistency", "recoveryPhysiology"]
    case "sleep_debt_7d":
        return ["durationAdequacy"]
    default:
        return ["durationAdequacy", "recoveryPhysiology"]
    }
}

// MARK: - Penalty detail sheet

private struct PenaltySheetItem: Identifiable {
    let id = UUID()
    let flag: String
}

private struct PenaltyDetailView: View {
    let flag: String
    let breakdown: SleepBreakdown
    let date: String

    @Environment(\.dismiss) private var dismiss

    @State private var contributorKeys: [String] = []
    @State private var contributorDetails: [String: ContributorDetail] = [:]
    @State private var contributorsLoading = true
    @State private var contributorsError: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    penaltySummaryBlock

                    Divider()

                    Text("Contributing metrics")
                        .font(.headline)

                    if contributorsLoading {
                        HStack(spacing: 10) {
                            ProgressView()
                            Text("Loading contributor details…")
                                .font(.callout)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 12)
                    } else if let err = contributorsError {
                        Text(err)
                            .font(.callout)
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(Array(contributorKeys.enumerated()), id: \.offset) { index, key in
                            if let detail = contributorDetails[key] {
                                ContributorDetailPanelView(
                                    contributorKey: key,
                                    date: date,
                                    detail: detail,
                                    showMetricTitle: true
                                )
                                if index < contributorKeys.count - 1 {
                                    Divider()
                                        .padding(.vertical, 8)
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle(penaltyBaseInfo(for: flag)?.title ?? "Penalty")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .task(id: flag) { await loadContributorDetails() }
    }

    @ViewBuilder
    private var penaltySummaryBlock: some View {
        if let info = penaltyBaseInfo(for: flag) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Penalty")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(info.pointsLabel)
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(.primary)
            }

            penaltyBarView(fraction: info.barFraction)

            Divider()

            Text(penaltyWhenLine(flag: flag, breakdown: breakdown))
                .font(.callout)
                .foregroundStyle(.secondary)

            Divider()

            Text(info.because)
                .font(.callout)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func penaltyBarView(fraction: Double) -> some View {
        let clamped = max(0.04, min(1.0, fraction))
        return GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.orange.opacity(0.2))
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.orange)
                    .frame(width: geo.size.width * clamped)
            }
        }
        .frame(height: 6)
    }

    private func loadContributorDetails() async {
        let keys = contributorKeysForPenalty(flag: flag)
        await MainActor.run {
            contributorKeys = keys
            contributorsLoading = true
            contributorsError = nil
            contributorDetails = [:]
        }
        do {
            var map: [String: ContributorDetail] = [:]
            try await withThrowingTaskGroup(of: (String, ContributorDetail).self) { group in
                for key in keys {
                    group.addTask {
                        let d = try await SleepService.shared.getContributorDetail(date: date, key: key)
                        return (key, d)
                    }
                }
                for try await (k, d) in group {
                    map[k] = d
                }
            }
            await MainActor.run {
                contributorDetails = map
                contributorsLoading = false
            }
        } catch {
            await MainActor.run {
                contributorsError = error.localizedDescription
                contributorsLoading = false
            }
        }
    }
}

// MARK: - Penalties card

struct SleepPenaltiesView: View {
    let breakdown: SleepBreakdown
    let scoreDate: String

    @State private var penaltySheet: PenaltySheetItem?

    var body: some View {
        if breakdown.penaltyTotal > 0 || !breakdown.penaltyFlags.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Penalties")
                        .font(.headline)
                    Spacer()
                    Text(penaltyScoreLabel)
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.red)
                }
                .padding(.bottom, 12)

                if !breakdown.penaltyFlags.isEmpty {
                    ForEach(Array(breakdown.penaltyFlags.enumerated()), id: \.offset) { index, flag in
                        if let info = penaltyBaseInfo(for: flag) {
                            if index > 0 { Divider() }
                            penaltyRow(flag: flag, info: info)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .sheet(item: $penaltySheet) { item in
                PenaltyDetailView(flag: item.flag, breakdown: breakdown, date: scoreDate)
            }
        }
    }

    private var penaltyScoreLabel: String {
        breakdown.penaltyTotal > 0 ? "−\(breakdown.penaltyTotal)" : "0"
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
        }
        .padding(.vertical, 10)
        .contentShape(Rectangle())
        .onTapGesture {
            penaltySheet = PenaltySheetItem(flag: flag)
        }
    }
}
