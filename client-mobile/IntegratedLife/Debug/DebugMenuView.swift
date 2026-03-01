#if DEBUG
import os.log
import SwiftUI
import UserNotifications

private let debugLog = Logger(subsystem: Bundle.main.bundleIdentifier ?? "com.integratedlife.app", category: "DebugMenu")

struct DebugMenuView: View {
	@ObservedObject var healthKitService: HealthKitService

	@State private var isBackfilling = false
	@State private var isAuthorizing = false
	@State private var progress: Double = 0
	@State private var currentLabel = ""
	@State private var resultMessage: String?
	@State private var errorMessage: String?
	@State private var notificationDebugOutput: String?

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

			notificationDebugSection

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

	// MARK: - Notification Debug

	private var notificationDebugSection: some View {
		Section("Notifications") {
			Button("Test Notification (5s)") {
				Task { await fireTestNotification() }
			}
			.buttonStyle(PrimaryButtonStyle())

			Button("Print Scheduled Dates") {
				Task { await printScheduledDates() }
			}
			.buttonStyle(SecondaryButtonStyle())

			Button("List Pending Notifications") {
				listPendingNotifications()
			}
			.buttonStyle(SecondaryButtonStyle())

			Button("Check Wake-Up Time") {
				Task { await checkWakeUpTime() }
			}
			.buttonStyle(SecondaryButtonStyle())

			if let output = notificationDebugOutput {
				Text(output)
					.font(.caption)
					.foregroundStyle(.secondary)
					.padding(8)
					.frame(maxWidth: .infinity, alignment: .leading)
					.background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 8))
			}
		}
	}

	private func fireTestNotification() async {
		debugLog.info("Test Notification (5s) tapped")

		let status = await NotificationService.shared.authorizationStatus()
		debugLog.info("Current notification permission: \(String(describing: status))")

		if status != .authorized && status != .provisional {
			debugLog.info("Permission not granted, requesting...")
			let granted = await NotificationService.shared.requestAuthorization()
			if !granted {
				debugLog.error("Permission denied by user")
				notificationDebugOutput = "Notifications are disabled. Enable in Settings to test."
				return
			}
		}

		let calendar = Calendar.current
		let fireDate = Date().addingTimeInterval(5)
		let components = calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: fireDate)
		let identifier = "debug-test-\(Int(Date().timeIntervalSince1970))"
		debugLog.info("Scheduling test notification id=\(identifier) for \(fireDate)")

		do {
			try await NotificationService.shared.schedule(
				identifier: identifier,
				category: .workoutReminder,
				title: "Workout Today",
				body: "Push Day - 6 exercises scheduled today",
				dateComponents: components
			)
			debugLog.info("Test notification scheduled successfully")
			notificationDebugOutput = "Notification scheduled for 5 seconds from now. Banner should appear (or check Notification Center if app is in background)."
		} catch {
			debugLog.error("Failed to schedule test notification: \(error.localizedDescription)")
			notificationDebugOutput = "Error: \(error.localizedDescription)"
		}
	}

	private func printScheduledDates() async {
		do {
			let workouts = try await HealthService.shared.fetchWorkouts()
			let scheduled = workouts.filter { $0.schedule != nil }
			if scheduled.isEmpty {
				notificationDebugOutput = "No workouts with schedules found."
				return
			}
			let formatter = DateFormatter()
			formatter.dateFormat = "EEE MMM d"
			var lines: [String] = []
			for workout in scheduled {
				let dates = RecurrenceExpander.expandDates(from: workout.schedule!)
				let dateStrings = dates.map { formatter.string(from: $0) }.joined(separator: ", ")
				lines.append("\(workout.name): \(dateStrings.isEmpty ? "(none)" : dateStrings)")
			}
			notificationDebugOutput = lines.joined(separator: "\n")
		} catch {
			notificationDebugOutput = "Error: \(error.localizedDescription)"
		}
	}

	private func listPendingNotifications() {
		UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
			let workoutRequests = requests.filter { $0.identifier.hasPrefix("workout-") }
			let lines = workoutRequests.map { req in
				let trigger = req.trigger as? UNCalendarNotificationTrigger
				let dateDesc = trigger?.dateComponents.description ?? "?"
				return "\(req.identifier) -> \(dateDesc)"
			}
			Task { @MainActor in
				if workoutRequests.isEmpty {
					notificationDebugOutput = "No pending workout notifications. Total pending: \(requests.count)"
				} else {
					notificationDebugOutput = "\(workoutRequests.count) workout notification(s):\n\(lines.joined(separator: "\n"))"
				}
			}
		}
	}

	private func checkWakeUpTime() async {
		do {
			let time = try await HealthKitService.shared.fetchRecentWakeUpTime()
			if let time {
				let comps = Calendar.current.dateComponents([.hour, .minute], from: time)
				notificationDebugOutput = "Suggested notification time: \(comps.hour ?? 0):\(String(format: "%02d", comps.minute ?? 0))"
			} else {
				notificationDebugOutput = "No sleep data available for wake-up time."
			}
		} catch {
			notificationDebugOutput = "Error: \(error.localizedDescription)"
		}
	}
}
#endif
