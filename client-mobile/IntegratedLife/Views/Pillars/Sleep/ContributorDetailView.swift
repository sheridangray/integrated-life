import SwiftUI

struct ContributorDetailView: View {
    let contributorKey: String
    let date: String

    @State private var detail: ContributorDetail?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @Environment(\.dismiss) private var dismiss

    private let sleepService = SleepService.shared

    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    loadingView
                } else if let error = errorMessage {
                    errorView(error)
                } else if let detail {
                    detailContent(detail)
                }
            }
            .navigationTitle(displayName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .task { await fetchDetail() }
    }

    // MARK: - Content

    private func detailContent(_ detail: ContributorDetail) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                scoreHeader(detail)
                Divider()
                valueSection(detail)
                if detail.baselineMean != nil {
                    Divider()
                    baselineSection(detail)
                }
                Divider()
                formulaSection(detail)
                if let subs = detail.subComponents, !subs.isEmpty {
                    Divider()
                    subComponentsSection(subs)
                }
                Divider()
                aiSection(detail)
            }
            .padding()
        }
    }

    // MARK: - Score Header

    private func scoreHeader(_ detail: ContributorDetail) -> some View {
        VStack(spacing: 8) {
            HStack {
                Text("\(detail.score)")
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .foregroundStyle(scoreColor(detail.score))
                Text("/ 100")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.systemGray5))
                    RoundedRectangle(cornerRadius: 4)
                        .fill(scoreColor(detail.score))
                        .frame(width: geo.size.width * max(0.02, Double(detail.score) / 100.0))
                }
            }
            .frame(height: 8)

            Text("\(Int(detail.weight * 100))% of your Sleep Score")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Value Section

    private func valueSection(_ detail: ContributorDetail) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Your Value").font(.subheadline.weight(.semibold))
            Text(detail.rawLabel)
                .font(.title3)
                .foregroundStyle(.primary)
        }
    }

    // MARK: - Baseline Section

    private func baselineSection(_ detail: ContributorDetail) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Your Baseline").font(.subheadline.weight(.semibold))

            if let mean = detail.baselineMean, let std = detail.baselineStd {
                HStack(spacing: 16) {
                    statPill("Mean", value: formatNumber(mean))
                    statPill("Std Dev", value: formatNumber(std))
                }
            }

            if let z = detail.zScore {
                let direction = z > 0 ? "above" : "below"
                let magnitude = abs(round(z * 100) / 100)
                Text("\(formatNumber(magnitude)) std \(direction) your average")
                    .font(.callout)
                    .foregroundStyle(zScoreColor(z))
            }
        }
    }

    private func statPill(_ label: String, value: String) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.callout.weight(.medium))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    // MARK: - Formula Section

    private func formulaSection(_ detail: ContributorDetail) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("How It's Calculated").font(.subheadline.weight(.semibold))
            Text(detail.formula)
                .font(.callout)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Sub-components (Physio Stability)

    private func subComponentsSection(_ subs: [ContributorSubComponent]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sub-components").font(.subheadline.weight(.semibold))
            ForEach(subs, id: \.name) { sub in
                HStack {
                    Text(sub.name).font(.callout)
                    Spacer()
                    Text("\(sub.score)/100")
                        .font(.callout.weight(.medium))
                        .foregroundStyle(scoreColor(sub.score))
                }
                if let z = sub.zScore {
                    let direction = z > 0 ? "above" : "below"
                    Text("Value: \(formatNumber(sub.rawValue)) · \(formatNumber(abs(z))) std \(direction) avg")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    // MARK: - AI Assessment

    private func aiSection(_ detail: ContributorDetail) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("AI Assessment", systemImage: "sparkles")
                .font(.subheadline.weight(.semibold))

            if let assessment = detail.aiAssessment {
                Text(assessment)
                    .font(.callout)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            } else {
                Text("AI assessment not available.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Loading / Error

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
            Text("Analyzing \(displayName)…")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
    }

    private func errorView(_ message: String) -> some View {
        ContentUnavailableView(
            "Unable to Load",
            systemImage: "exclamationmark.triangle",
            description: Text(message)
        )
    }

    // MARK: - Helpers

    private var displayName: String {
        let names: [String: String] = [
            "durationAdequacy": "Duration adequacy",
            "consistency": "Consistency",
            "fragmentation": "Fragmentation",
            "recoveryPhysiology": "Recovery physiology",
            "structure": "Sleep structure",
            "timingAlignment": "Timing alignment",
        ]
        return names[contributorKey] ?? contributorKey
    }

    private func scoreColor(_ score: Int) -> Color {
        switch score {
        case 85...100: return .green
        case 70..<85: return .blue
        case 50..<70: return .yellow
        default: return .red
        }
    }

    private func zScoreColor(_ z: Double) -> Color {
        let absZ = abs(z)
        if absZ < 1 { return .green }
        if absZ < 2 { return .yellow }
        return .red
    }

    private func formatNumber(_ value: Double) -> String {
        if value == value.rounded() {
            return String(Int(value))
        }
        return String(format: "%.2f", value)
    }

    private func fetchDetail() async {
        isLoading = true
        errorMessage = nil
        do {
            detail = try await sleepService.getContributorDetail(date: date, key: contributorKey)
            isLoading = false
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
}
