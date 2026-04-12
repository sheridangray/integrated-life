import SwiftUI
import HealthKit

struct HealthKitIntegrationView: View {
	@ObservedObject var healthKitService: HealthKitService
	@Environment(\.dismiss) private var dismiss

	@State private var isRequesting = false

	var body: some View {
		List {
			connectionStatusSection
			connectButtonSection
			writePermissionSection

			ForEach(HealthKitDataType.byCategory, id: \.category) { group in
				Section {
					ForEach(group.types) { dataType in
						HStack(spacing: 12) {
							Image(systemName: dataType.icon)
								.foregroundStyle(.blue)
								.frame(width: 24)
							VStack(alignment: .leading, spacing: 2) {
								Text(dataType.name)
									.font(.body)
								if !dataType.unit.isEmpty {
									Text(dataType.unit)
										.font(.caption)
										.foregroundStyle(.secondary)
								}
							}
							Spacer()
							if healthKitService.isAuthorized {
								Image(systemName: "checkmark")
									.foregroundStyle(.green)
									.font(.caption)
							}
						}
					}
				} header: {
					Label(group.category.rawValue, systemImage: group.category.icon)
				}
			}
		}
		.navigationTitle("Apple Health")
	}

	private var connectionStatusSection: some View {
		Section {
			VStack(alignment: .leading, spacing: 8) {
				Label(
					healthKitService.isAuthorized ? "Connected" : "Not Connected",
					systemImage: healthKitService.isAuthorized ? "checkmark.circle.fill" : "xmark.circle"
				)
				.font(.headline)
				.foregroundStyle(healthKitService.isAuthorized ? .green : .orange)

				if !healthKitService.isHealthDataAvailable {
					Text("Apple Health is not available on this device.")
						.font(.caption)
						.foregroundStyle(.red)
				}
			}
			.padding(.vertical, 4)
		}
	}

	private var writePermissionSection: some View {
		Section("Write Access") {
			HStack(spacing: 12) {
				Image(systemName: "square.and.pencil")
					.foregroundStyle(.blue)
					.frame(width: 24)
				VStack(alignment: .leading, spacing: 2) {
					Text("Workouts")
						.font(.body)
					Text("Save workouts to Health")
						.font(.caption)
						.foregroundStyle(.secondary)
				}
				Spacer()
				if healthKitService.isAuthorized {
					Image(systemName: "checkmark")
						.foregroundStyle(.green)
						.font(.caption)
				}
			}
		}
	}

	private var connectButtonSection: some View {
		Section {
			Button {
				Task { await requestAccess() }
			} label: {
				HStack {
					Spacer()
					if isRequesting {
						ProgressView()
							.padding(.trailing, 8)
					}
					Text(healthKitService.isAuthorized ? "Update Permissions" : "Connect Apple Health")
						.fontWeight(.semibold)
					Spacer()
				}
			}
			.buttonStyle(PrimaryButtonStyle())
			.listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
			.disabled(isRequesting || !healthKitService.isHealthDataAvailable)
		} footer: {
			VStack(alignment: .leading, spacing: 8) {
				Text("Integrated Life requests access to cardiovascular, activity, sleep, mindfulness, and environmental health data. Tapping the button will open the Apple Health permissions sheet where you choose which data to share.")

				if healthKitService.isAuthorized {
					Text("To revoke permissions, go to Settings > Health > Data Access & Devices > Integrated Life.")
						.foregroundStyle(.secondary)
				}
			}
		}
	}

	private func requestAccess() async {
		isRequesting = true
		try? await healthKitService.requestAuthorization()
		isRequesting = false
		SleepScoresBackgroundDeliveryService.shared.syncRegistrationWithUserPreference()
	}
}
