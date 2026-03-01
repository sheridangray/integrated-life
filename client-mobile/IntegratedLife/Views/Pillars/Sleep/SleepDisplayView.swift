import SwiftUI
import Charts

struct SleepDisplayView: View {
    @StateObject private var state = SleepDisplayState()
    @State private var selectedTime: Date?
    @State private var selectedDate: Date?

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
                    Button("Retry") { Task { await state.loadData() } }
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
        .task { await state.loadData() }
        .onChange(of: state.selectedPeriod) {
            selectedTime = nil
            selectedDate = nil
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
        case .day: dayGraph
        case .week, .month: weekMonthGraph
        case .sixMonths: sixMonthsGraph
        }
    }

    // MARK: - Day Graph

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
                    if let time = selectedTime {
                        RuleMark(x: .value("Time", time))
                            .foregroundStyle(.white)
                            .lineStyle(StrokeStyle(lineWidth: 1.5))
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .hour, count: 2)) { _ in
                        AxisGridLine()
                        AxisValueLabel(format: .dateTime.hour())
                    }
                }
                .chartYAxis(.hidden)
                .chartXSelection(value: $selectedTime)
                .frame(height: 60)

                if let time = selectedTime,
                   let segment = night.stageSegments.first(where: { $0.start <= time && time <= $0.end }) {
                    selectionBadge(
                        stage: segment.stage,
                        detail: time.formatted(date: .omitted, time: .shortened)
                    )
                }
            }
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Week / Month Timeline Graph

    @ViewBuilder
    private var weekMonthGraph: some View {
        let nights = state.currentNights
        if !nights.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Chart {
                    ForEach(nights) { night in
                        if night.stageSegments.isEmpty {
                            BarMark(
                                x: .value("Day", night.date, unit: .day),
                                yStart: .value("Start", nightTimeY(night.sleepStart)),
                                yEnd: .value("End", nightTimeY(night.sleepEnd))
                            )
                            .foregroundStyle(.blue.opacity(0.5))
                        } else {
                            ForEach(night.stageSegments) { segment in
                                BarMark(
                                    x: .value("Day", night.date, unit: .day),
                                    yStart: .value("Start", nightTimeY(segment.start)),
                                    yEnd: .value("End", nightTimeY(segment.end))
                                )
                                .foregroundStyle(colorForStage(segment.stage))
                            }
                        }
                    }
                    if let selected = selectedDate {
                        RuleMark(x: .value("Selected", selected, unit: .day))
                            .foregroundStyle(.white.opacity(0.3))
                            .lineStyle(StrokeStyle(lineWidth: 1))
                    }
                }
                .chartYAxis {
                    AxisMarks(values: [0, 120, 240, 360, 480, 600, 720]) { value in
                        AxisGridLine()
                        AxisValueLabel {
                            if let v = value.as(Double.self) { Text(clockLabel(yValue: v)) }
                        }
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day)) { _ in
                        AxisGridLine()
                        AxisValueLabel(format: state.selectedPeriod == .week
                            ? .dateTime.weekday(.abbreviated)
                            : .dateTime.day())
                    }
                }
                .chartXSelection(value: $selectedDate)
                .frame(height: 200)

                if let selected = selectedDate,
                   let night = nearestNight(to: selected, in: nights) {
                    selectedNightDetail(night)
                }
            }
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - 6-Month Graph

    @ViewBuilder
    private var sixMonthsGraph: some View {
        let nights = state.currentNights
        if !nights.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Chart(nights) { night in
                    BarMark(
                        x: .value("Date", night.date, unit: .day),
                        y: .value("Time", night.totalAsleepMinutes),
                        width: .fixed(2)
                    )
                    .foregroundStyle(.blue.opacity(0.7))
                }
                .chartYAxis {
                    AxisMarks(values: .automatic(desiredCount: 5)) { value in
                        AxisGridLine()
                        AxisValueLabel {
                            if let mins = value.as(Double.self) { Text("\(Int(mins / 60))h") }
                        }
                    }
                }
                .chartXSelection(value: $selectedDate)
                .frame(height: 160)

                if let selected = selectedDate,
                   let night = nearestNight(to: selected, in: nights) {
                    selectedNightDetail(night)
                }
            }
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Stages

    @ViewBuilder
    private var stagesSection: some View {
        let isAverage = state.selectedPeriod != .day
        if let durations = state.selectedPeriod == .day
            ? state.dayData?.stageDurations
            : state.averageStageDurations {
            VStack(alignment: .leading, spacing: 8) {
                Text(isAverage ? "Avg. Stages" : "Stages")
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

    // MARK: - Selection Views

    private func selectionBadge(stage: SleepStage, detail: String) -> some View {
        HStack(spacing: 8) {
            Circle().fill(colorForStage(stage)).frame(width: 8, height: 8)
            Text(stage.displayName).font(.caption.weight(.medium))
            Spacer()
            Text(detail).font(.caption).foregroundStyle(.secondary)
        }
    }

    private func selectedNightDetail(_ night: SleepNightDisplay) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(night.date, format: .dateTime.weekday(.wide).month(.abbreviated).day())
                    .font(.caption.weight(.semibold))
                Text(formatMinutes(night.totalAsleepMinutes) + " asleep")
                    .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text(formatTimeRange(night.sleepStart, night.sleepEnd))
                .font(.caption).foregroundStyle(.secondary)
        }
    }

    // MARK: - Time Helpers

    /// Converts a Date to a Y-axis value where 8 PM = 720 (top) and 8 AM = 0 (bottom).
    private func nightTimeY(_ date: Date) -> Double {
        720 - minutesSince8PM(date)
    }

    private func minutesSince8PM(_ date: Date) -> Double {
        let cal = Calendar.current
        let h = cal.component(.hour, from: date)
        let m = cal.component(.minute, from: date)
        return h >= 20 ? Double((h - 20) * 60 + m) : Double((h + 4) * 60 + m)
    }

    private func clockLabel(yValue: Double) -> String {
        let offset = Int(720 - yValue)
        let hour24 = (20 + offset / 60) % 24
        let hour12 = hour24 == 0 ? 12 : (hour24 > 12 ? hour24 - 12 : hour24)
        return hour24 < 12 ? "\(hour12)AM" : "\(hour12)PM"
    }

    private func nearestNight(to date: Date, in nights: [SleepNightDisplay]) -> SleepNightDisplay? {
        nights.min(by: { abs($0.date.timeIntervalSince(date)) < abs($1.date.timeIntervalSince(date)) })
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

    private func formatTimeRange(_ start: Date, _ end: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return "\(f.string(from: start)) – \(f.string(from: end))"
    }
}
