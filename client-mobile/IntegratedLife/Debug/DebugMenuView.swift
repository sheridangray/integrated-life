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
	@State private var isSendingRemoteTestPush = false

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

			Section("Sleep scores (debug)") {
				Button("Simulate deep link: Pillars → Sleep") {
					AppNavigationState.shared.openSleepPillar()
				}
				.buttonStyle(SecondaryButtonStyle())

				Button("Run morning sleep scores pipeline now") {
					Task {
						await SleepScoresBackgroundDeliveryService.shared.runPipelineNowForDebug()
						notificationDebugOutput = "Pipeline finished. If scores exist, a notification may appear in ~1s (allow notifications)."
					}
				}
				.buttonStyle(SecondaryButtonStyle())

				Text("Pipeline uses the same logic as HealthKit background delivery (sync night → API → local notification).")
					.font(.caption)
					.foregroundStyle(.secondary)
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

	// MARK: - Notification Debug

	private var notificationDebugSection: some View {
		Section("Notifications") {
			Text("Local = on-device schedule. Remote = API sends APNs to registered tokens (same path as real report pushes).")
				.font(.caption)
				.foregroundStyle(.secondary)

			Button("Local: workout-style (5s)") {
				Task { await scheduleLocalTestNotification(
					category: .workoutReminder,
					title: "Workout Today",
					body: "Push Day - 6 exercises scheduled today",
					delaySeconds: 5
				) }
			}
			.buttonStyle(PrimaryButtonStyle())

			Button("Local: health-report-style (5s)") {
				Task { await scheduleLocalTestNotification(
					category: .healthReport,
					title: "Weekly Health Report Ready",
					body: "Your health report for Mar 1 – Mar 7 is ready to view.",
					delaySeconds: 5
				) }
			}
			.buttonStyle(PrimaryButtonStyle())

			Button {
				Task { await sendRemoteTestPush() }
			} label: {
				HStack {
					Spacer()
					if isSendingRemoteTestPush {
						ProgressView()
							.padding(.trailing, 6)
					}
					Text("Remote: APNs test (via server)")
					Spacer()
				}
			}
			.buttonStyle(PrimaryButtonStyle())
			.disabled(isSendingRemoteTestPush)

			Button("Re-register device token with API") {
				Task { @MainActor in
					let hasToken = UserDefaults.standard.string(forKey: "apns.deviceTokenHex") != nil
					await PushTokenRegistration.syncWithServerIfPossible()
					notificationDebugOutput = hasToken
						? "Token sync requested (check server / try Remote APNs test)."
						: "No APNs token yet — allow notifications and open the app once so the device token is received."
				}
			}
			.buttonStyle(SecondaryButtonStyle())

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

			Text("Weekly cron: Sunday 09:00 in the server timezone (Render is often UTC, not your local 9 AM).")
				.font(.caption2)
				.foregroundStyle(.tertiary)
		}
	}

	private func ensureNotificationPermission() async -> Bool {
		let status = await NotificationService.shared.authorizationStatus()
		if status != .authorized && status != .provisional {
			let granted = await NotificationService.shared.requestAuthorization()
			if !granted {
				notificationDebugOutput = "Notifications are disabled. Enable in Settings to test."
				return false
			}
		}
		return true
	}

	private func scheduleLocalTestNotification(
		category: NotificationCategory,
		title: String,
		body: String,
		delaySeconds: TimeInterval
	) async {
		guard await ensureNotificationPermission() else { return }

		let calendar = Calendar.current
		let fireDate = Date().addingTimeInterval(delaySeconds)
		let components = calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: fireDate)
		let identifier = "debug-local-\(category.rawValue)-\(Int(Date().timeIntervalSince1970))"

		do {
			try await NotificationService.shared.schedule(
				identifier: identifier,
				category: category,
				title: title,
				body: body,
				dateComponents: components
			)
			notificationDebugOutput = "Local notification scheduled for \(Int(delaySeconds))s. Background the app or lock the phone to see the banner."
		} catch {
			notificationDebugOutput = "Local schedule error: \(error.localizedDescription)"
		}
	}

	private func sendRemoteTestPush() async {
		isSendingRemoteTestPush = true
		defer { isSendingRemoteTestPush = false }

		do {
			let result = try await HealthService.shared.sendTestApnsPush()
			notificationDebugOutput = "Remote APNs: delivered to \(result.sent) of \(result.attempted) token(s). Put app in background; if 0 delivered, check server logs and APNS_USE_SANDBOX vs build type."
		} catch {
			let message: String
			if let api = error as? APIError {
				switch api {
				case .serverError(let msg):
					message = msg
				default:
					message = error.localizedDescription
				}
			} else {
				message = error.localizedDescription
			}
			notificationDebugOutput = "Remote APNs failed: \(message)"
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
