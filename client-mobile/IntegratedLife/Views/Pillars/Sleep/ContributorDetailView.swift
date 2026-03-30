import SwiftUI

// MARK: - Shared panel (contributor sheet + penalty detail)

/// Full contributor breakdown UI after `ContributorDetail` is loaded. Matches the former contributor sheet body.
struct ContributorDetailPanelView: View {
    let contributorKey: String
    let date: String
    let detail: ContributorDetail
    /// When `true`, shows the same title pattern as the Contributors card, e.g. `Duration (35%)`.
    var showMetricTitle: Bool = false

    @State private var aiAssessment: String?
    @State private var aiLoading = false
    @State private var aiErrorMessage: String?

    private let sleepService = SleepService.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            if showMetricTitle {
                Text(Self.metricTitleWithWeight(for: contributorKey))
                    .font(.title3.weight(.semibold))
            }

            scoreHeader(detail)
            Divider()
            valueSection(detail)
            if let fields = detail.detailFields, !fields.isEmpty {
                Divider()
                detailFieldsSection(fields)
            }
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
            aiSection()
        }
        .task(id: contributorKey) {
            await fetchAIAssessment()
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

    private func valueSection(_ detail: ContributorDetail) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Summary").font(.subheadline.weight(.semibold))
            Text(detail.rawLabel)
                .font(.title3)
                .foregroundStyle(.primary)
        }
    }

    private func detailFieldsSection(_ fields: [ContributorDetailField]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Values").font(.subheadline.weight(.semibold))
            ForEach(Array(fields.enumerated()), id: \.offset) { _, row in
                HStack(alignment: .top, spacing: 12) {
                    Text(row.label)
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text(displayValue(for: row))
                        .font(.callout.weight(.medium))
                        .multilineTextAlignment(.trailing)
                }
            }
            if contributorKey == "consistency" || contributorKey == "timingAlignment" {
                Text(
                    "Clock times are shown in your device timezone. The score still compares habitual timing using UTC so it stays consistent night to night."
                )
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.top, 4)
            }
        }
    }

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

    private func formulaSection(_ detail: ContributorDetail) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("How It's Calculated").font(.subheadline.weight(.semibold))
            Text(detail.formula)
                .font(.callout)
                .foregroundStyle(.secondary)
        }
    }

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

    private func aiSection() -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("AI Assessment", systemImage: "sparkles")
                .font(.subheadline.weight(.semibold))

            if aiLoading {
                HStack(spacing: 10) {
                    ProgressView()
                    Text("Generating assessment…")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            } else if let err = aiErrorMessage {
                Text(err)
                    .font(.callout)
                    .foregroundStyle(.secondary)
            } else if let assessment = aiAssessment {
                Text(assessment)
                    .font(.callout)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            } else {
                Text("No assessment returned.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }
        }
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

    private func displayValue(for row: ContributorDetailField) -> String {
        if let iso = row.localDisplayIso, let d = Self.parseIsoInstant(iso) {
            return Self.localTimeFormatter.string(from: d)
        }
        if let mins = row.utcMinutesFromMidnight {
            return Self.formatUtcMinutesAsLocalTime(mins)
        }
        return row.value
    }

    private func fetchAIAssessment() async {
        aiAssessment = nil
        aiErrorMessage = nil
        aiLoading = true
        defer { aiLoading = false }
        do {
            let r = try await sleepService.getContributorDetailAssessment(date: date, key: contributorKey)
            aiAssessment = r.aiAssessment
        } catch {
            aiErrorMessage = error.localizedDescription
        }
    }

    /// Aligns with `SleepContributorsView` row labels and weights.
    static func metricTitleWithWeight(for key: String) -> String {
        let w = weightPercent(for: key)
        let base: String
        switch key {
        case "durationAdequacy": base = "Duration"
        case "consistency": base = "Consistency"
        case "fragmentation": base = "Interruptions"
        case "recoveryPhysiology": base = "Recovery physiology"
        case "structure": base = "Sleep structure"
        case "timingAlignment": base = "Timing alignment"
        default: base = key
        }
        return "\(base) (\(w)%)"
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

    private static let localTimeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.timeStyle = .short
        f.dateStyle = .none
        f.locale = .current
        return f
    }()

    private static func parseIsoInstant(_ s: String) -> Date? {
        let withFrac = ISO8601DateFormatter()
        withFrac.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = withFrac.date(from: s) { return d }
        let noFrac = ISO8601DateFormatter()
        noFrac.formatOptions = [.withInternetDateTime]
        return noFrac.date(from: s)
    }

    private static func formatUtcMinutesAsLocalTime(_ mins: Double) -> String {
        let raw = Int(round(mins))
        let total = ((raw % (24 * 60)) + (24 * 60)) % (24 * 60)
        let h = total / 60
        let m = total % 60
        var utcCal = Calendar(identifier: .gregorian)
        utcCal.timeZone = TimeZone(secondsFromGMT: 0)!
        var comp = DateComponents()
        comp.year = 2000
        comp.month = 6
        comp.day = 15
        comp.hour = h
        comp.minute = m
        comp.second = 0
        guard let utcDate = utcCal.date(from: comp) else { return "—" }
        return localTimeFormatter.string(from: utcDate)
    }
}

// MARK: - Contributor detail sheet

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
                    ScrollView {
                        ContributorDetailPanelView(
                            contributorKey: contributorKey,
                            date: date,
                            detail: detail,
                            showMetricTitle: false
                        )
                        .padding()
                    }
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

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
            Text("Loading \(displayName)…")
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

    private var displayName: String {
        let names: [String: String] = [
            "durationAdequacy": "Duration adequacy",
            "consistency": "Consistency",
            "fragmentation": "Interruptions",
            "recoveryPhysiology": "Recovery physiology",
            "structure": "Sleep structure",
            "timingAlignment": "Timing alignment",
        ]
        return names[contributorKey] ?? contributorKey
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
