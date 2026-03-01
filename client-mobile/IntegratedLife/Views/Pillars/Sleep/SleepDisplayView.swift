import SwiftUI
import Charts

struct SleepDisplayView: View {
    @StateObject private var state = SleepDisplayState()

    var body: some View {
        Group {
            if state.isLoading {
                ProgressView("Loading sleep data...")
                    .padding(.top, 60)
            } else if let errorMessage = state.error {
                ContentUnavailableView {
                    Label("Unable to Load Sleep Data", systemImage: "exclamationmark.triangle")
                } description: {
                    Text(errorMessage)
                } actions: {
                    Button("Retry") {
                        Task { await state.loadData() }
                    }
                    .buttonStyle(.bordered)
                }
                .padding(.top, 40)
            } else if state.currentNights.isEmpty {
                ContentUnavailableView {
                    Label("No Sleep Data", systemImage: "moon.zzz")
                } description: {
                    Text("Sleep data will appear here after your first night of tracking with Apple Watch or compatible device.")
                }
                .padding(.top, 40)
            } else {
                VStack(spacing: 20) {
                    periodPicker
                    timeAsleepSection
                    graphSection
                    stagesSection
                }
                .padding()
            }
        }
        .task {
            await state.loadData()
        }
        .onChange(of: state.selectedPeriod) {
            Task { await state.loadData() }
        }
    }

    private var periodPicker: some View {
        Picker("Period", selection: $state.selectedPeriod) {
            ForEach(SleepPeriod.allCases) { period in
                Text(period.rawValue).tag(period)
            }
        }
        .pickerStyle(.segmented)
    }

    @ViewBuilder
    private var timeAsleepSection: some View {
        if let value = state.timeAsleepValue {
            VStack(spacing: 4) {
                Text(state.timeAsleepLabel)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.title2.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
        }
    }

    @ViewBuilder
    private var graphSection: some View {
        switch state.selectedPeriod {
        case .day:
            dayGraph
        case .week, .month:
            weekMonthGraph
        case .sixMonths:
            sixMonthsGraph
        }
    }

    @ViewBuilder
    private var dayGraph: some View {
        if let night = state.dayData, !night.stageSegments.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Chart {
                    ForEach(night.stageSegments) { segment in
                        RectangleMark(
                            xStart: .value("Start", segment.start),
                            xEnd: .value("End", segment.end),
                            yStart: .value("Min", 0),
                            yEnd: .value("Max", 1)
                        )
                        .foregroundStyle(colorForStage(segment.stage))
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .hour, count: 2)) { _ in
                        AxisGridLine()
                        AxisValueLabel(format: .dateTime.hour())
                    }
                }
                .chartYAxis(.hidden)
                .frame(height: 60)
            }
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
    }

    @ViewBuilder
    private var weekMonthGraph: some View {
        let nights = state.currentNights
        if !nights.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Chart {
                    ForEach(nights) { night in
                        let dayLabel = dayLabelFor(night.date)
                        let d = night.stageDurations
                        let total = d.totalWithAwake
                        BarMark(
                            x: .value("Day", dayLabel),
                            yStart: .value("Start", 0),
                            yEnd: .value("End", d.awake)
                        )
                        .foregroundStyle(colorForStage(.awake))
                        BarMark(
                            x: .value("Day", dayLabel),
                            yStart: .value("Start", d.awake),
                            yEnd: .value("End", d.awake + d.rem)
                        )
                        .foregroundStyle(colorForStage(.rem))
                        BarMark(
                            x: .value("Day", dayLabel),
                            yStart: .value("Start", d.awake + d.rem),
                            yEnd: .value("End", d.awake + d.rem + d.core)
                        )
                        .foregroundStyle(colorForStage(.core))
                        BarMark(
                            x: .value("Day", dayLabel),
                            yStart: .value("Start", d.awake + d.rem + d.core),
                            yEnd: .value("End", total)
                        )
                        .foregroundStyle(colorForStage(.deep))
                    }
                }
                .chartYAxis {
                    AxisMarks(values: .automatic(desiredCount: 5)) { value in
                        AxisGridLine()
                        AxisValueLabel {
                            if let mins = value.as(Double.self) {
                                Text("\(Int(mins))m")
                            } else {
                                Text("")
                            }
                        }
                    }
                }
                .frame(height: 160)
            }
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
    }

    @ViewBuilder
    private var sixMonthsGraph: some View {
        let nights = state.currentNights
        if !nights.isEmpty {
            VStack(alignment: .leading, spacing: 16) {
                Chart(nights) { night in
                    BarMark(
                        x: .value("Date", night.date),
                        y: .value("Time", night.totalAsleepMinutes)
                    )
                    .foregroundStyle(.blue.opacity(0.7))
                }
                .chartYAxis {
                    AxisMarks(values: .automatic(desiredCount: 5)) { value in
                        AxisGridLine()
                        AxisValueLabel {
                            if let mins = value.as(Double.self) {
                                Text("\(Int(mins / 60))h")
                            } else {
                                Text("")
                            }
                        }
                    }
                }
                .frame(height: 160)

                if let avg = state.averageStageDurations {
                    VStack(alignment: .leading, spacing: 8) {
                        stageRow("Average Awake", avg.awake, .awake)
                        stageRow("Average REM", avg.rem, .rem)
                        stageRow("Average Core", avg.core, .core)
                        stageRow("Average Deep", avg.deep, .deep)
                    }
                }
            }
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
    }

    private func stageRow(_ label: String, _ minutes: Double, _ stage: SleepStage) -> some View {
        HStack {
            Circle()
                .fill(colorForStage(stage))
                .frame(width: 8, height: 8)
            Text(label)
                .font(.subheadline)
            Spacer()
            Text(formatMinutes(minutes))
                .font(.subheadline.weight(.medium))
        }
    }

    @ViewBuilder
    private var stagesSection: some View {
        if state.selectedPeriod != .sixMonths, let durations = state.selectedPeriod == .day
            ? state.dayData?.stageDurations
            : state.averageStageDurations {
            VStack(alignment: .leading, spacing: 8) {
                Text("Stages")
                    .font(.headline)

                SleepStageBarView(
                    deep: durations.deep > 0 ? durations.deep : nil,
                    core: durations.core > 0 ? durations.core : nil,
                    rem: durations.rem > 0 ? durations.rem : nil,
                    awake: durations.awake > 0 ? durations.awake : nil
                )
            }
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
    }

    private func dayLabelFor(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }

    private func colorForStage(_ stage: SleepStage) -> Color {
        switch stage {
        case .awake: return .orange
        case .rem: return .cyan
        case .core: return .blue
        case .deep: return .indigo
        }
    }

    private func formatMinutes(_ minutes: Double) -> String {
        let h = Int(minutes) / 60
        let m = Int(minutes) % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }
}
