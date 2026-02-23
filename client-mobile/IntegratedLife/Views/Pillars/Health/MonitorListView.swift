import SwiftUI
import HealthKit

struct MonitorListView: View {
	@ObservedObject var healthKitService: HealthKitService

	@State private var latestValues: [String: String] = [:]

	private var groupedMonitorableTypes: [(category: HealthKitCategory, types: [HealthKitDataType])] {
		let monitorable = HealthKitDataType.monitorableTypes
		return HealthKitCategory.allCases.compactMap { cat in
			let filtered = monitorable.filter { $0.category == cat }
			return filtered.isEmpty ? nil : (category: cat, types: filtered)
		}
	}

	var body: some View {
		List {
			ForEach(groupedMonitorableTypes, id: \.category) { group in
				Section {
					ForEach(group.types) { dataType in
						NavigationLink(value: dataType) {
							HStack(spacing: 12) {
								Image(systemName: dataType.icon)
									.foregroundStyle(.blue)
									.frame(width: 24)
								VStack(alignment: .leading) {
									Text(dataType.name)
										.font(.body)
									if let value = latestValues[dataType.id] {
										Text(value)
											.font(.caption)
											.foregroundStyle(.secondary)
									}
								}
								Spacer()
							}
						}
					}
				} header: {
					Label(group.category.rawValue, systemImage: group.category.icon)
				}
			}
		}
		.listStyle(.plain)
		.task {
			await loadLatestValues()
		}
	}

	private func loadLatestValues() async {
		let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()

		for dataType in HealthKitDataType.monitorableTypes {
			if let quantityTypeId = dataType.quantityTypeId, let unit = dataType.hkUnit {
				if let samples = try? await healthKitService.fetchQuantitySamples(
					type: quantityTypeId,
					unit: unit,
					start: sevenDaysAgo
				), let latest = samples.first {
					let formatted: String
					if dataType.unit == "%" {
						formatted = "\(String(format: "%.1f", latest.value * 100))%"
					} else {
						formatted = "\(Int(latest.value)) \(dataType.unit)"
					}
					latestValues[dataType.id] = formatted
				}
			} else if dataType.categoryTypeId != nil {
				latestValues[dataType.id] = "Tap to view"
			}
		}
	}
}
