#if DEBUG
import SwiftUI

struct DebugMenuView: View {
	@ObservedObject var healthKitService: HealthKitService

	@State private var isBackfilling = false
	@State private var isAuthorizing = false
	@State private var progress: Double = 0
	@State private var currentLabel = ""
	@State private var resultMessage: String?
	@State private var errorMessage: String?

	var body: some View {
		List {
			Section {
				VStack(alignment: .leading, spacing: 8) {
					Label("Debug Menu", systemImage: "ladybug.fill")
						.font(.headline)
						.foregroundStyle(.orange)
					Text("These tools are only available in debug builds.")
						.font(.caption)
						.foregroundStyle(.secondary)
				}
				.padding(.vertical, 4)
			}

			Section("Step 1: Authorize") {
				Button {
					Task { await authorize() }
				} label: {
					HStack {
						Spacer()
						if isAuthorizing {
							ProgressView()
								.padding(.trailing, 4)
							Text("Requesting...")
						} else {
							Image(systemName: "heart.text.square")
							Text("Request Read + Write Permissions")
						}
						Spacer()
					}
				}
				.buttonStyle(PrimaryButtonStyle())
				.disabled(isAuthorizing || !healthKitService.isHealthDataAvailable)

				Text("Opens Apple Health permissions. Enable **all write types** to allow backfilling. You must do this before backfilling.")
					.font(.caption)
					.foregroundStyle(.secondary)
			}

			Section("Step 2: Backfill Data") {
				VStack(alignment: .leading, spacing: 12) {
					Text("Writes 90 days of synthetic data: heart rate, HRV, VO2 max, blood oxygen, respiratory rate, steps, active/basal energy, distance, flights, body temp, audio exposure, sleep, and mindful sessions.")
						.font(.subheadline)
						.foregroundStyle(.secondary)

					if isBackfilling {
						VStack(alignment: .leading, spacing: 6) {
							ProgressView(value: progress)
								.tint(.blue)
							Text(currentLabel)
								.font(.caption)
								.foregroundStyle(.secondary)
						}
					}

					if let result = resultMessage {
						Text(result)
							.font(.caption)
							.foregroundStyle(.green)
							.padding(8)
							.background(Color.green.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
					}

					if let error = errorMessage {
						Text(error)
							.font(.caption)
							.foregroundStyle(.red)
							.padding(8)
							.background(Color.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
					}

					Button {
						Task { await runBackfill() }
					} label: {
						HStack {
							Spacer()
							if isBackfilling {
								ProgressView()
									.padding(.trailing, 4)
								Text("Backfilling...")
							} else {
								Image(systemName: "arrow.clockwise.circle.fill")
								Text("Backfill 90 Days")
							}
							Spacer()
						}
					}
					.buttonStyle(PrimaryButtonStyle())
					.disabled(isBackfilling || !healthKitService.isAuthorized)
				}

				if !healthKitService.isAuthorized {
					Text("Complete Step 1 first.")
						.font(.caption)
						.foregroundStyle(.orange)
				}
			}
		}
		.navigationTitle("Debug")
	}

	private func authorize() async {
		isAuthorizing = true
		try? await healthKitService.requestAuthorization()
		isAuthorizing = false
	}

	private func runBackfill() async {
		isBackfilling = true
		resultMessage = nil
		errorMessage = nil

		let result = await healthKitService.backfillSampleData(days: 90) { prog, label in
			Task { @MainActor in
				progress = prog
				currentLabel = label
			}
		}

		isBackfilling = false
		resultMessage = "\(result.saved) samples saved, \(result.failed) failed"
		if let err = result.firstError {
			errorMessage = "First error: \(err)"
		}
	}
}
#endif
