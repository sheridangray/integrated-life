import SwiftUI
import Charts

enum SleepTab: String, CaseIterable, Identifiable {
    case sleep = "Sleep"
    case readiness = "Readiness"

    var id: String { rawValue }
}

struct SleepPillarView: View {
    @ObservedObject var healthKitService: HealthKitService
    @ObservedObject var sleepState: SleepState
    @State private var selectedTab: SleepTab = .sleep

    var body: some View {
        VStack(spacing: 0) {
            Picker("Section", selection: $selectedTab) {
                ForEach(SleepTab.allCases) { tab in
                    Text(tab.rawValue).tag(tab)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 8)

            if let progress = sleepState.syncProgress {
                HStack(spacing: 8) {
                    ProgressView().controlSize(.small)
                    Text(progress).font(.caption).foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            }

            ScrollView {
                switch selectedTab {
                case .sleep:
                    sleepTabContent
                case .readiness:
                    readinessTabContent
                }
            }
        }
        .navigationTitle("Sleep")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await sleepState.syncIfNeeded()
            await sleepState.loadHistory(days: 14)
        }
    }

    // MARK: - Sleep Tab

    @ViewBuilder
    private var sleepTabContent: some View {
        SleepDisplayView(scoreResponse: sleepState.todayScore)
    }

    // MARK: - Readiness Tab

    @ViewBuilder
    private var readinessTabContent: some View {
        if sleepState.isLoading || sleepState.isSyncing {
            ProgressView("Loading readiness data...")
                .padding(.top, 60)
        } else if let score = sleepState.todayScore {
            VStack(spacing: 20) {
                readinessScoreSection(score)
                actionBucketSection(score)
                readinessBreakdownSection(score)
                if !sleepState.history.isEmpty {
                    trendChartSection
                }
                guidanceSection(score)
            }
            .padding()
        } else {
            noDataView
        }
    }

    @ViewBuilder
    private func readinessScoreSection(_ score: SleepScoreResponse) -> some View {
        ScoreRingView(score: score.readinessScore, label: "Readiness", size: 180)
    }

    @ViewBuilder
    private func actionBucketSection(_ score: SleepScoreResponse) -> some View {
        Text(score.actionBucket.displayLabel)
            .font(.headline)
            .foregroundStyle(actionColor(score.actionBucket))
            .padding(.horizontal, 20)
            .padding(.vertical, 8)
            .background(actionColor(score.actionBucket).opacity(0.12), in: Capsule())
    }

    @ViewBuilder
    private func readinessBreakdownSection(_ score: SleepScoreResponse) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Readiness Breakdown")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                breakdownItem("Sleep Quality", score: score.readinessBreakdown.sleepScoreContrib)
                breakdownItem("HRV", score: score.readinessBreakdown.hrvDeviation)
                breakdownItem("Resting HR", score: score.readinessBreakdown.rhrDeviation)
                breakdownItem("Recovery", score: score.readinessBreakdown.recoveryIndex)
                breakdownItem("HRV Trend", score: score.readinessBreakdown.hrvTrendSlope)
                breakdownItem("Sleep Debt", score: score.readinessBreakdown.sleepDebt)
            }
        }
    }

    @ViewBuilder
    private var trendChartSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("14-Day Trend")
                .font(.headline)

            Chart {
                ForEach(sleepState.history.reversed()) { score in
                    LineMark(
                        x: .value("Date", shortDate(score.date)),
                        y: .value("Readiness", score.readinessScore)
                    )
                    .foregroundStyle(.blue)
                    .interpolationMethod(.catmullRom)

                    AreaMark(
                        x: .value("Date", shortDate(score.date)),
                        y: .value("Readiness", score.readinessScore)
                    )
                    .foregroundStyle(.blue.opacity(0.1))
                    .interpolationMethod(.catmullRom)
                }
            }
            .chartYScale(domain: 0...100)
            .chartYAxis {
                AxisMarks(values: [0, 25, 50, 75, 100])
            }
            .frame(height: 180)
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    @ViewBuilder
    private func guidanceSection(_ score: SleepScoreResponse) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Today's Guidance")
                .font(.headline)

            Text(guidanceText(for: score.actionBucket))
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - No Data

    @ViewBuilder
    private var noDataView: some View {
        ContentUnavailableView {
            Label("No Sleep Data", systemImage: "moon.zzz")
        } description: {
            Text("Sleep data will appear here after your first night of tracking with Apple Watch or compatible device.")
        }
        .padding(.top, 40)
    }

    // MARK: - Helpers

    private func breakdownItem(_ label: String, score: Int) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack {
                Text("\(score)")
                    .font(.title3.weight(.semibold))
                Spacer()
                ScoreRingView(score: score, label: "", size: 36)
            }
        }
        .padding(12)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
    }

    private func actionColor(_ bucket: ActionBucket) -> Color {
        switch bucket {
        case .pushHard: return .green
        case .maintain: return .blue
        case .activeRecovery: return .orange
        case .fullRest: return .red
        }
    }

    private func guidanceText(for bucket: ActionBucket) -> String {
        switch bucket {
        case .pushHard:
            return "Your body is well-recovered. Great day for intense training or challenging activities."
        case .maintain:
            return "You're in good shape. Stick to your normal routine and planned activities."
        case .activeRecovery:
            return "Consider lighter activities today. Focus on stretching, walking, or gentle movement."
        case .fullRest:
            return "Your body needs recovery. Prioritize rest, hydration, and an early bedtime tonight."
        }
    }

    private func shortDate(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: isoString) else {
            return String(isoString.suffix(5))
        }
        let display = DateFormatter()
        display.dateFormat = "M/d"
        return display.string(from: date)
    }
}
