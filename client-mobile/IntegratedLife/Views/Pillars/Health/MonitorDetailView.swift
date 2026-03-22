import SwiftUI
import Charts
import HealthKit

struct MonitorDetailView: View {
	let sampleType: HealthKitDataType
	@ObservedObject var healthKitService: HealthKitService
	var user: User?

	@State private var rawDataPoints: [(date: Date, value: Double)] = []
	@State private var dailyDataPoints: [(date: Date, value: Double, min: Double?, max: Double?)] = []
	@State private var categoryPoints: [(date: Date, value: Int)] = []
	@State private var analysis: AIInsight?
	@State private var analysisError: String?
	@State private var isLoading = true
	@State private var isAnalyzing = false
	@State private var selectedTimeRange: TimeRange = .week
	@State private var selectedDataPoint: (date: Date, value: Double)?
	@State private var showRecentReadings = false

	private let healthService = HealthService.shared

	enum TimeRange: String, CaseIterable {
		case day = "D"
		case week = "7D"
		case month = "30D"
		case threeMonths = "90D"

		var days: Int {
			switch self {
			case .day: return 1
			case .week: return 7
			case .month: return 30
			case .threeMonths: return 90
			}
		}
	}

	private var chartDataPoints: [(date: Date, value: Double)] {
		if useAggregatedData {
			return dailyDataPoints.map { ($0.date, $0.value) }
		}
		return rawDataPoints
	}

	private var useAggregatedData: Bool {
		selectedTimeRange != .day &&
		sampleType.isQuantityType &&
		(sampleType.aggregation == .cumulative || sampleType.aggregation == .average)
	}

	private var usesBarChart: Bool {
		useAggregatedData && sampleType.aggregation == .cumulative
	}

	var body: some View {
		ScrollView {
			VStack(alignment: .leading, spacing: 20) {
				headerSection
				timeRangePicker

				if sampleType.isCategoryType {
					categoryDataSection
				} else {
					chartSection
					blurbSection
					analyzeButton
					dataListSection
				}
			}
			.padding()
		}
		.navigationTitle(sampleType.name)
		.task {
			await loadData()
		}
		.onChange(of: selectedTimeRange) {
			analysis = nil
			analysisError = nil
			Task { await loadData() }
		}
	}

	// MARK: - Header with Status

	private var headerSection: some View {
		HStack(spacing: 12) {
			Image(systemName: sampleType.icon)
				.font(.title2)
				.foregroundStyle(.blue)

			if let latest = rawDataPoints.first {
				let status = sampleType.statusColor(for: latest.value, gender: user?.gender, age: user?.age)
				HStack(spacing: 6) {
					Circle()
						.fill(colorFor(status))
						.frame(width: 10, height: 10)
					Text(formatValue(latest.value))
						.font(.title2)
						.fontWeight(.semibold)
				}
			}

			Spacer()
		}
	}

	// MARK: - Time Range

	private var timeRangePicker: some View {
		Picker("Time Range", selection: $selectedTimeRange) {
			ForEach(TimeRange.allCases, id: \.self) { range in
				Text(range.rawValue).tag(range)
			}
		}
		.pickerStyle(.segmented)
	}

	// MARK: - Educational Blurb

	private var blurbSection: some View {
		Text(sampleType.description)
			.font(.caption)
			.foregroundStyle(.secondary)
			.padding(12)
			.frame(maxWidth: .infinity, alignment: .leading)
			.background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 10))
	}

	// MARK: - Analyze Button

	@ViewBuilder
	private var analyzeButton: some View {
		Button {
			Task { await runAnalysis() }
		} label: {
			HStack {
				if isAnalyzing {
					ProgressView()
						.controlSize(.small)
						.padding(.trailing, 4)
				}
				Label(
					analysis == nil ? "Analyze with AI" : "Re-analyze",
					systemImage: "sparkles"
				)
			}
			.frame(maxWidth: .infinity)
		}
		.buttonStyle(.bordered)
		.tint(.purple)
		.disabled(isAnalyzing || chartDataPoints.isEmpty)

		if let analysisText = analysis?.insight {
			VStack(alignment: .leading, spacing: 8) {
				Label("Analysis", systemImage: "stethoscope")
					.font(.headline)
					.foregroundStyle(.purple)
				Text(analysisText)
					.font(.subheadline)
					.padding()
					.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
			}
		}

		if let error = analysisError {
			HStack(spacing: 6) {
				Image(systemName: "exclamationmark.triangle.fill")
					.foregroundStyle(.orange)
				Text(error)
					.font(.caption)
					.foregroundStyle(.secondary)
			}
		}
	}

	// MARK: - Chart

	@ViewBuilder
	private var chartSection: some View {
		if chartDataPoints.isEmpty && !isLoading {
			ContentUnavailableView(
				"No Data",
				systemImage: "chart.line.downtrend.xyaxis",
				description: Text("No \(sampleType.name.lowercased()) data available for this period.")
			)
			.frame(height: 200)
		} else if !chartDataPoints.isEmpty {
			VStack(alignment: .leading, spacing: 4) {
				selectedDataOverlay

				Chart {
					if usesBarChart {
						ForEach(Array(chartDataPoints.enumerated()), id: \.offset) { _, point in
							BarMark(
								x: .value("Date", point.date, unit: .day),
								y: .value(yLabel, point.value)
							)
							.foregroundStyle(.blue.opacity(0.7))
						}
					} else {
						if useAggregatedData && sampleType.aggregation == .average {
							ForEach(Array(dailyDataPoints.enumerated()), id: \.offset) { _, point in
								if let minVal = point.min, let maxVal = point.max {
									AreaMark(
										x: .value("Date", point.date),
										yStart: .value("Min", minVal),
										yEnd: .value("Max", maxVal)
									)
									.foregroundStyle(.blue.opacity(0.08))
								}
							}
						}

						ForEach(Array(chartDataPoints.enumerated()), id: \.offset) { _, point in
							LineMark(
								x: .value("Date", point.date),
								y: .value(yLabel, point.value)
							)
							.foregroundStyle(.blue)
						}

						ForEach(Array(chartDataPoints.enumerated()), id: \.offset) { _, point in
							AreaMark(
								x: .value("Date", point.date),
								y: .value(yLabel, point.value)
							)
							.foregroundStyle(.blue.opacity(0.06))
						}
					}

					trendlineMarks

					if let selected = selectedDataPoint {
						RuleMark(x: .value("Selected", selected.date))
							.foregroundStyle(.gray.opacity(0.5))
							.lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 2]))
						PointMark(
							x: .value("Date", selected.date),
							y: .value("Value", selected.value)
						)
						.foregroundStyle(.blue)
						.symbolSize(60)
					}
				}
			.frame(height: 200)
			.chartYScale(domain: yAxisDomain)
			.chartXAxis {
				AxisMarks(values: .automatic(desiredCount: 5))
			}
				.chartOverlay { proxy in
					GeometryReader { _ in
						Rectangle()
							.fill(.clear)
							.contentShape(Rectangle())
							.gesture(
								DragGesture(minimumDistance: 0)
									.onChanged { value in
										if let date: Date = proxy.value(atX: value.location.x) {
											selectedDataPoint = closestDataPoint(to: date)
										}
									}
									.onEnded { _ in
										selectedDataPoint = nil
									}
							)
					}
				}
			}
		}
	}

	private var yLabel: String {
		sampleType.unit.isEmpty ? "Value" : sampleType.unit
	}

	private var yAxisDomain: ClosedRange<Double> {
		if sampleType.aggregation == .cumulative {
			let maxVal = chartDataPoints.map(\.value).max() ?? 1
			return 0...maxVal * 1.05
		}

		var allValues = chartDataPoints.map(\.value)
		if useAggregatedData && sampleType.aggregation == .average {
			allValues += dailyDataPoints.compactMap(\.min)
			allValues += dailyDataPoints.compactMap(\.max)
		}

		guard let minVal = allValues.min(), let maxVal = allValues.max() else {
			return 0...1
		}

		if minVal == maxVal {
			let center = minVal
			let offset = max(center * 0.1, 1)
			return (center - offset)...(center + offset)
		}

		let range = maxVal - minVal
		let padding = range * 0.15
		return (minVal - padding)...(maxVal + padding)
	}

	private var selectedDataOverlay: some View {
		HStack(spacing: 8) {
			if let selected = selectedDataPoint {
				Text(selected.date, style: .date)
					.font(.caption)
					.foregroundStyle(.secondary)
				Spacer()
				Text(formatValue(selected.value))
					.font(.headline)
			} else {
				Text(" ")
					.font(.caption)
				Spacer()
				Text(" ")
					.font(.headline)
			}
		}
		.padding(.horizontal, 4)
	}

	// MARK: - Trendline

	@ChartContentBuilder
	private var trendlineMarks: some ChartContent {
		if showTrendline, let trend = computeTrendline() {
			LineMark(
				x: .value("Date", trend.startDate),
				y: .value("Trend", trend.startValue),
				series: .value("Series", "trend")
			)
			.foregroundStyle(.orange.opacity(0.7))
			.lineStyle(StrokeStyle(lineWidth: 1.5, dash: [6, 3]))

			LineMark(
				x: .value("Date", trend.endDate),
				y: .value("Trend", trend.endValue),
				series: .value("Series", "trend")
			)
			.foregroundStyle(.orange.opacity(0.7))
			.lineStyle(StrokeStyle(lineWidth: 1.5, dash: [6, 3]))
		}
	}

	private var showTrendline: Bool {
		(selectedTimeRange == .month || selectedTimeRange == .threeMonths) &&
		(sampleType.aggregation == .cumulative || sampleType.aggregation == .average) &&
		chartDataPoints.count >= 7
	}

	private func computeTrendline() -> (startDate: Date, startValue: Double, endDate: Date, endValue: Double)? {
		let points = chartDataPoints
		guard points.count >= 7 else { return nil }

		let refDate = points[0].date
		let xs = points.map { $0.date.timeIntervalSince(refDate) }
		let ys = points.map { $0.value }
		let n = Double(points.count)

		let sumX = xs.reduce(0, +)
		let sumY = ys.reduce(0, +)
		let sumXY = zip(xs, ys).reduce(0.0) { $0 + $1.0 * $1.1 }
		let sumX2 = xs.reduce(0.0) { $0 + $1 * $1 }

		let denom = n * sumX2 - sumX * sumX
		guard abs(denom) > 0.001 else { return nil }

		let slope = (n * sumXY - sumX * sumY) / denom
		let intercept = (sumY - slope * sumX) / n

		let startVal = intercept + slope * xs.first!
		let endVal = intercept + slope * xs.last!

		return (startDate: points.first!.date, startValue: startVal, endDate: points.last!.date, endValue: endVal)
	}

	// MARK: - Category Data

	@ViewBuilder
	private var categoryDataSection: some View {
		if categoryPoints.isEmpty && !isLoading {
			ContentUnavailableView(
				"No Data",
				systemImage: "chart.line.downtrend.xyaxis",
				description: Text("No \(sampleType.name.lowercased()) data available for this period.")
			)
			.frame(height: 200)
		} else {
			VStack(alignment: .leading, spacing: 8) {
				Text("Recent Events")
					.font(.headline)

				ForEach(Array(categoryPoints.prefix(20).enumerated()), id: \.offset) { _, point in
					HStack {
						Text(point.date, style: .date)
							.font(.subheadline)
						Text(point.date, style: .time)
							.font(.caption)
							.foregroundStyle(.secondary)
						Spacer()
						Text("Value: \(point.value)")
							.font(.subheadline)
							.foregroundStyle(.secondary)
					}
				}
			}
		}
	}

	// MARK: - Data List

	@ViewBuilder
	private var dataListSection: some View {
		if !chartDataPoints.isEmpty {
			DisclosureGroup("Recent Readings", isExpanded: $showRecentReadings) {
				ForEach(Array(chartDataPoints.prefix(20).enumerated()), id: \.offset) { _, point in
					HStack {
						Text(point.date, style: .date)
							.font(.subheadline)
						Spacer()
						Text(formatValue(point.value))
							.font(.subheadline)
							.foregroundStyle(.secondary)
					}
				}
			}
			.font(.headline)
		}
	}

	// MARK: - Helpers

	private func formatValue(_ value: Double) -> String {
		if sampleType.unit == "%" {
			let display = value <= 1.0 ? value * 100 : value
			return "\(String(format: "%.1f", display))%"
		}
		if value == floor(value) {
			return "\(Int(value)) \(sampleType.unit)"
		}
		return "\(String(format: "%.1f", value)) \(sampleType.unit)"
	}

	private func colorFor(_ status: HealthStatus) -> Color {
		switch status {
		case .normal: return .green
		case .low: return .yellow
		case .high: return .red
		}
	}

	private func closestDataPoint(to date: Date) -> (date: Date, value: Double)? {
		guard !chartDataPoints.isEmpty else { return nil }
		return chartDataPoints.min(by: {
			abs($0.date.timeIntervalSince(date)) < abs($1.date.timeIntervalSince(date))
		})
	}

	// MARK: - Data Loading

	private func loadData() async {
		isLoading = true
		let start = Calendar.current.date(byAdding: .day, value: -selectedTimeRange.days, to: Date()) ?? Date()

		if let quantityTypeId = sampleType.quantityTypeId, let unit = sampleType.hkUnit {
			rawDataPoints = (try? await healthKitService.fetchQuantitySamples(
				type: quantityTypeId, unit: unit, start: start
			)) ?? []

			if useAggregatedData {
				dailyDataPoints = (try? await healthKitService.fetchDailyStatistics(
					type: quantityTypeId, unit: unit, start: start,
					aggregation: sampleType.aggregation
				)) ?? []
			} else {
				dailyDataPoints = []
			}
		} else if let categoryTypeId = sampleType.categoryTypeId {
			categoryPoints = (try? await healthKitService.fetchCategorySamples(
				type: categoryTypeId, start: start
			)) ?? []
		}

		isLoading = false
	}

	private func runAnalysis() async {
		isAnalyzing = true
		analysisError = nil
		let formatter = ISO8601DateFormatter()
		let points = chartDataPoints.map { point in
			MonitorDataPoint(date: formatter.string(from: point.date), value: point.value)
		}
		do {
			analysis = try await healthService.getMonitorAnalysis(
				sampleType: sampleType.id,
				data: points,
				timeRange: selectedTimeRange.rawValue
			)
		} catch {
			analysisError = "Analysis failed: \(error.localizedDescription)"
		}
		isAnalyzing = false
	}
}
