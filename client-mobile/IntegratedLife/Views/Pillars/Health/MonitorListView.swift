import SwiftUI
import HealthKit

struct MonitorListView: View {
	@ObservedObject var healthKitService: HealthKitService
	var user: User?

	@State private var latestValues: [String: Double] = [:]
	@State private var latestFormatted: [String: String] = [:]
	@State private var currentPeriodAvg: [String: Double] = [:]
	@State private var previousPeriodAvg: [String: Double] = [:]
	@State private var typesWithData: Set<String> = []
	@State private var showUntrackedTypes = false
	@State private var isLoaded = false

	private var monitorableTypes: [HealthKitDataType] {
		HealthKitDataType.monitorableTypes
	}

	private var typesGroupedWithData: [(category: HealthKitCategory, types: [HealthKitDataType])] {
		HealthKitCategory.allCases.compactMap { cat in
			let filtered = monitorableTypes.filter { $0.category == cat && typesWithData.contains($0.id) }
			return filtered.isEmpty ? nil : (category: cat, types: filtered)
		}
	}

	private var untrackedTypes: [HealthKitDataType] {
		monitorableTypes.filter { !typesWithData.contains($0.id) }
	}

	var body: some View {
		List {
			Section {
				NavigationLink(value: HealthNavDestination.healthReports) {
					Label("Health Reports", systemImage: "doc.text.magnifyingglass")
				}
				NavigationLink(value: HealthNavDestination.historicalSync) {
					Label("Sync Historical Data", systemImage: "arrow.triangle.2.circlepath")
				}
			}

			ForEach(typesGroupedWithData, id: \.category) { group in
				Section {
					ForEach(group.types) { dataType in
						NavigationLink(value: dataType) {
							metricRow(dataType)
						}
					}
				} header: {
					Label(group.category.rawValue, systemImage: group.category.icon)
				}
			}

			if !untrackedTypes.isEmpty && isLoaded {
				Section {
					DisclosureGroup("Not Yet Tracking (\(untrackedTypes.count))", isExpanded: $showUntrackedTypes) {
						ForEach(untrackedTypes) { dataType in
							NavigationLink(value: dataType) {
								HStack(spacing: 12) {
									Image(systemName: dataType.icon)
										.foregroundStyle(.tertiary)
										.frame(width: 24)
									Text(dataType.name)
										.font(.body)
										.foregroundStyle(.secondary)
								}
							}
						}
					}
				}
			}
		}
		.listStyle(.plain)
		.task {
			await loadLatestValues()
		}
	}

	private func metricRow(_ dataType: HealthKitDataType) -> some View {
		HStack(spacing: 12) {
			Image(systemName: dataType.icon)
				.foregroundStyle(.blue)
				.frame(width: 24)

			VStack(alignment: .leading, spacing: 2) {
				Text(dataType.name)
					.font(.body)
				if let formatted = latestFormatted[dataType.id] {
					HStack(spacing: 6) {
						statusDot(for: dataType)
						Text(formatted)
							.font(.caption)
							.foregroundStyle(.secondary)
						deltaLabel(for: dataType)
					}
				}
			}

			Spacer()
		}
	}

	@ViewBuilder
	private func statusDot(for dataType: HealthKitDataType) -> some View {
		if let value = latestValues[dataType.id] {
			let status = dataType.statusColor(for: value, gender: user?.gender, age: user?.age)
			Circle()
				.fill(colorFor(status))
				.frame(width: 8, height: 8)
		}
	}

	private func formatDelta(_ diff: Double, unit: String) -> String {
		if unit == "%" {
			return String(format: "%.1f%%", abs(diff) * 100)
		} else if abs(diff) >= 1 {
			return "\(Int(abs(diff)))"
		} else {
			return String(format: "%.1f", abs(diff))
		}
	}

	@ViewBuilder
	private func deltaLabel(for dataType: HealthKitDataType) -> some View {
		if let current = currentPeriodAvg[dataType.id], let previous = previousPeriodAvg[dataType.id], previous > 0 {
			let diff = current - previous
			if abs(diff) > 0.01 {
				let isImprovement = dataType.lowerIsBetter ? diff < 0 : diff > 0
				HStack(spacing: 2) {
					Image(systemName: diff > 0 ? "arrow.up" : "arrow.down")
						.font(.system(size: 8))
					Text("\(formatDelta(diff, unit: dataType.unit)) 7d avg vs prior")
						.font(.caption2)
				}
				.foregroundStyle(isImprovement ? .green : .red)
			}
		}
	}

	private func colorFor(_ status: HealthStatus) -> Color {
		switch status {
		case .normal: return .green
		case .low: return .yellow
		case .high: return .red
		}
	}

	private func loadLatestValues() async {
		let now = Date()
		let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: now) ?? now
		let fourteenDaysAgo = Calendar.current.date(byAdding: .day, value: -14, to: now) ?? now

		for dataType in monitorableTypes where !dataType.isDerived {
			if let quantityTypeId = dataType.quantityTypeId, let unit = dataType.hkUnit {
				if let samples = try? await healthKitService.fetchQuantitySamples(
					type: quantityTypeId, unit: unit, start: sevenDaysAgo
				), let latest = samples.first {
					latestValues[dataType.id] = latest.value
					typesWithData.insert(dataType.id)

					if dataType.unit == "%" {
						latestFormatted[dataType.id] = "\(String(format: "%.1f", latest.value * 100))%"
					} else {
						latestFormatted[dataType.id] = "\(Int(latest.value)) \(dataType.unit)"
					}

					let avg = samples.reduce(0.0) { $0 + $1.value } / Double(samples.count)
					currentPeriodAvg[dataType.id] = avg
					if let priorSamples = try? await healthKitService.fetchQuantitySamples(
						type: quantityTypeId, unit: unit, start: fourteenDaysAgo, end: sevenDaysAgo
					), !priorSamples.isEmpty {
						let priorAvg = priorSamples.reduce(0.0) { $0 + $1.value } / Double(priorSamples.count)
						previousPeriodAvg[dataType.id] = priorAvg
					}
				}
			} else if dataType.categoryTypeId != nil {
				if let samples = try? await healthKitService.fetchCategorySamples(
					type: dataType.categoryTypeId!, start: sevenDaysAgo
				), !samples.isEmpty {
					typesWithData.insert(dataType.id)
					latestFormatted[dataType.id] = "Tap to view"
				}
			}
		}

		computeDerivedValues()
		isLoaded = true
	}

	private func computeDerivedValues() {
		let gender = user?.gender
		for dataType in monitorableTypes where dataType.isDerived {
			guard let derivation = dataType.derivation else { continue }
			guard let sources = dataType.derivedFrom else { continue }
			let allSourcesPresent = sources.allSatisfy { latestValues[$0] != nil }
			guard allSourcesPresent else { continue }

			if let value = derivation(latestValues, gender) {
				latestValues[dataType.id] = value
				typesWithData.insert(dataType.id)

				if dataType.unit == "%" {
					latestFormatted[dataType.id] = "\(String(format: "%.1f", value * 100))%"
				} else if dataType.unit == "kg/m²" {
					latestFormatted[dataType.id] = String(format: "%.1f %@", value, dataType.unit)
				} else {
					latestFormatted[dataType.id] = "\(Int(value)) \(dataType.unit)"
				}
			}
		}
	}
}
