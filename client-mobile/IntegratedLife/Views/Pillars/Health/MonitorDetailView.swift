import SwiftUI
import Charts
import HealthKit

struct MonitorDetailView: View {
	let sampleType: HealthKitDataType
	@ObservedObject var healthKitService: HealthKitService

	@State private var dataPoints: [(date: Date, value: Double)] = []
	@State private var categoryPoints: [(date: Date, value: Int)] = []
	@State private var insight: AIInsight?
	@State private var isLoading = true
	@State private var selectedTimeRange: TimeRange = .week
	@State private var selectedDataPoint: (date: Date, value: Double)?

	private let healthService = HealthService.shared

	enum TimeRange: String, CaseIterable {
		case week = "7D"
		case month = "30D"
		case threeMonths = "90D"

		var days: Int {
			switch self {
			case .week: return 7
			case .month: return 30
			case .threeMonths: return 90
			}
		}
	}

	var body: some View {
		ScrollView {
			VStack(alignment: .leading, spacing: 20) {
				timeRangePicker
			if sampleType.isCategoryType {
				categoryDataSection
			} else {
				chartSection
				insightSection
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
			Task { await loadData() }
		}
	}

	private var timeRangePicker: some View {
		Picker("Time Range", selection: $selectedTimeRange) {
			ForEach(TimeRange.allCases, id: \.self) { range in
				Text(range.rawValue).tag(range)
			}
		}
		.pickerStyle(.segmented)
	}

	@ViewBuilder
	private var chartSection: some View {
		if dataPoints.isEmpty && !isLoading {
			ContentUnavailableView(
				"No Data",
				systemImage: "chart.line.downtrend.xyaxis",
				description: Text("No \(sampleType.name.lowercased()) data available for this period.")
			)
			.frame(height: 200)
		} else {
			VStack(alignment: .leading, spacing: 4) {
				if let selected = selectedDataPoint {
					HStack(spacing: 8) {
						Text(selected.date, style: .date)
							.font(.caption)
							.foregroundStyle(.secondary)
						Spacer()
						if sampleType.unit == "%" {
							Text("\(String(format: "%.1f", selected.value * 100))%")
								.font(.headline)
						} else {
							Text("\(selected.value, specifier: "%.1f") \(sampleType.unit)")
								.font(.headline)
						}
					}
					.padding(.horizontal, 4)
				}

				Chart {
					ForEach(Array(dataPoints.enumerated()), id: \.offset) { _, point in
						LineMark(
							x: .value("Date", point.date),
							y: .value(sampleType.unit.isEmpty ? "Value" : sampleType.unit, point.value)
						)
						.foregroundStyle(.blue)

						AreaMark(
							x: .value("Date", point.date),
							y: .value(sampleType.unit.isEmpty ? "Value" : sampleType.unit, point.value)
						)
						.foregroundStyle(.blue.opacity(0.1))
					}

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
										let x = value.location.x
										if let date: Date = proxy.value(atX: x) {
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

	private func closestDataPoint(to date: Date) -> (date: Date, value: Double)? {
		guard !dataPoints.isEmpty else { return nil }
		return dataPoints.min(by: {
			abs($0.date.timeIntervalSince(date)) < abs($1.date.timeIntervalSince(date))
		})
	}

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

	@ViewBuilder
	private var insightSection: some View {
		if let insightText = insight?.insight {
			VStack(alignment: .leading, spacing: 8) {
				Label("AI Insight", systemImage: "sparkles")
					.font(.headline)
					.foregroundStyle(.purple)
				Text(insightText)
					.font(.subheadline)
					.padding()
					.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
			}
		}
	}

	@ViewBuilder
	private var dataListSection: some View {
		if !dataPoints.isEmpty {
			VStack(alignment: .leading, spacing: 8) {
				Text("Recent Readings")
					.font(.headline)

				ForEach(Array(dataPoints.prefix(20).enumerated()), id: \.offset) { _, point in
					HStack {
						Text(point.date, style: .date)
							.font(.subheadline)
						Spacer()
						if sampleType.unit == "%" {
							Text("\(String(format: "%.1f", point.value * 100))%")
								.font(.subheadline)
								.foregroundStyle(.secondary)
						} else {
							Text("\(point.value, specifier: "%.1f") \(sampleType.unit)")
								.font(.subheadline)
								.foregroundStyle(.secondary)
						}
					}
				}
			}
		}
	}

	private func loadData() async {
		isLoading = true
		let start = Calendar.current.date(byAdding: .day, value: -selectedTimeRange.days, to: Date()) ?? Date()

		if let quantityTypeId = sampleType.quantityTypeId, let unit = sampleType.hkUnit {
			dataPoints = (try? await healthKitService.fetchQuantitySamples(
				type: quantityTypeId,
				unit: unit,
				start: start
			)) ?? []
		} else if let categoryTypeId = sampleType.categoryTypeId {
			categoryPoints = (try? await healthKitService.fetchCategorySamples(
				type: categoryTypeId,
				start: start
			)) ?? []
		}

		if !dataPoints.isEmpty {
			let formatter = ISO8601DateFormatter()
			let monitorData = dataPoints.prefix(14).map { point in
				MonitorDataPoint(
					date: formatter.string(from: point.date),
					value: point.value
				)
			}
			insight = try? await healthService.getMonitorInsight(sampleType: sampleType.id, data: monitorData)
		}

		isLoading = false
	}
}
