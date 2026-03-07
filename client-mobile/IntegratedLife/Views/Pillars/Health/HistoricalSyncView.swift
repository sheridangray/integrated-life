import SwiftUI

struct HistoricalSyncView: View {
	@ObservedObject var syncService = MonitorSyncService.shared

	@State private var isRunning = false
	@State private var currentType = ""
	@State private var progress: Double = 0
	@State private var result: (synced: Int, failed: Int)?
	@State private var hasCompleted = UserDefaults.standard.bool(forKey: "HistoricalSync.completed")

	var body: some View {
		VStack(spacing: 20) {
			if hasCompleted && !isRunning {
				completedView
			} else if isRunning {
				progressView
			} else if let result {
				resultView(result)
			} else {
				promptView
			}
		}
		.padding()
		.navigationTitle("Sync Historical Data")
	}

	private var promptView: some View {
		VStack(spacing: 16) {
			Image(systemName: "arrow.triangle.2.circlepath.circle.fill")
				.font(.system(size: 48))
				.foregroundStyle(.blue)

			Text("Sync Historical Health Data")
				.font(.headline)

			Text("This will upload all your Apple Health history to the server, enabling comprehensive reports and analysis. This may take a few minutes depending on how much data you have.")
				.font(.subheadline)
				.foregroundStyle(.secondary)
				.multilineTextAlignment(.center)

			Button {
				Task { await runBackfill() }
			} label: {
				Label("Start Sync", systemImage: "arrow.up.circle.fill")
					.frame(maxWidth: .infinity)
			}
			.buttonStyle(.borderedProminent)
		}
	}

	private var progressView: some View {
		VStack(spacing: 16) {
			ProgressView(value: progress)
				.progressViewStyle(.linear)

			Text(currentType)
				.font(.subheadline)
				.foregroundStyle(.secondary)

			Text("\(Int(progress * 100))%")
				.font(.title2)
				.fontWeight(.semibold)
				.monospacedDigit()
		}
	}

	private func resultView(_ result: (synced: Int, failed: Int)) -> some View {
		VStack(spacing: 16) {
			Image(systemName: result.failed == 0 ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
				.font(.system(size: 48))
				.foregroundStyle(result.failed == 0 ? .green : .orange)

			Text("Sync Complete")
				.font(.headline)

			Text("\(result.synced) samples synced")
				.font(.subheadline)
				.foregroundStyle(.secondary)

			if result.failed > 0 {
				Text("\(result.failed) samples failed")
					.font(.subheadline)
					.foregroundStyle(.red)
			}
		}
	}

	private var completedView: some View {
		VStack(spacing: 16) {
			Image(systemName: "checkmark.circle.fill")
				.font(.system(size: 48))
				.foregroundStyle(.green)

			Text("Historical Sync Complete")
				.font(.headline)

			Text("Your health history has already been synced. New data syncs automatically.")
				.font(.subheadline)
				.foregroundStyle(.secondary)
				.multilineTextAlignment(.center)

			Button {
				hasCompleted = false
			} label: {
				Text("Run Again")
					.font(.subheadline)
			}
			.buttonStyle(.bordered)
		}
	}

	private func runBackfill() async {
		isRunning = true
		result = nil

		let backfillResult = await syncService.backfillAllHistory { typeName, pct in
			currentType = typeName
			progress = pct
		}

		result = backfillResult
		isRunning = false

		if backfillResult.failed == 0 {
			hasCompleted = true
			UserDefaults.standard.set(true, forKey: "HistoricalSync.completed")
		}
	}
}
