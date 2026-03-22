import SwiftUI
import HealthKit

struct NotificationSettingsView: View {
    @ObservedObject var notificationState: NotificationState
    @ObservedObject var healthKitService: HealthKitService
    @AppStorage(MorningSleepScoresPreferences.userDefaultsKey) private var morningSleepScoresEnabled = false
    @State private var pendingTime: Date
    @State private var hasSuggestedTime = false

    init(notificationState: NotificationState, healthKitService: HealthKitService) {
        self.notificationState = notificationState
        self.healthKitService = healthKitService
        _pendingTime = State(initialValue: notificationState.notificationTime)
    }

    var body: some View {
        List {
            if notificationState.isDenied {
                permissionDeniedSection
            }

            workoutReminderSection

            if notificationState.workoutRemindersEnabled && notificationState.isAuthorized {
                timePickerSection
            }

            morningSleepScoresSection
        }
        .navigationTitle("Notifications")
        .task {
            await notificationState.refreshAuthorizationStatus()
            await suggestTimeIfNeeded()
            SleepScoresBackgroundDeliveryService.shared.syncRegistrationWithUserPreference()
        }
    }

    private var sleepAnalysisAuthorized: Bool {
        guard let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else { return false }
        return healthKitService.authorizationStatus(for: sleepType) == .sharingAuthorized
    }

    private var morningSleepScoresSection: some View {
        Section {
            Toggle("Morning sleep & readiness", isOn: $morningSleepScoresEnabled)
                .disabled(!sleepAnalysisAuthorized && !morningSleepScoresEnabled)
                .onChange(of: morningSleepScoresEnabled) { _, newValue in
                    Task { await handleMorningSleepScoresToggle(newValue) }
                }
        } footer: {
            Text(morningSleepScoresFooter)
        }
    }

    private var morningSleepScoresFooter: String {
        if !sleepAnalysisAuthorized {
            return "Allow sleep data in Profile → Integrations → Apple Health to use this. Delivery is best-effort after Health updates overnight sleep."
        }
        return "Best-effort local alert after Apple Health updates sleep, with your latest Sleep and Readiness scores. Tap the notification to open Pillars → Sleep."
    }

    private func handleMorningSleepScoresToggle(_ enabled: Bool) async {
        if enabled {
            let status = await NotificationService.shared.authorizationStatus()
            if status != .authorized && status != .provisional {
                let granted = await NotificationService.shared.requestAuthorization()
                if !granted {
                    await MainActor.run { morningSleepScoresEnabled = false }
                    return
                }
            }
        }
        SleepScoresBackgroundDeliveryService.shared.syncRegistrationWithUserPreference()
    }

    // MARK: - Sections

    private var permissionDeniedSection: some View {
        Section {
            VStack(alignment: .leading, spacing: 8) {
                Label("Notifications Disabled", systemImage: "bell.slash")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.orange)
                Text("Enable notifications in Settings to receive workout reminders.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Button("Open Settings") {
                    openAppSettings()
                }
                .font(.subheadline)
            }
            .padding(.vertical, 4)
        }
    }

    private var workoutReminderSection: some View {
        Section {
            Toggle("Workout Reminders", isOn: Binding(
                get: { notificationState.workoutRemindersEnabled },
                set: { newValue in
                    Task { await notificationState.toggleWorkoutReminders(newValue) }
                }
            ))
        } footer: {
            Text("Get notified on mornings when you have a workout scheduled.")
        }
    }

    private var timePickerSection: some View {
        Section {
            DatePicker(
                "Reminder Time",
                selection: $pendingTime,
                displayedComponents: .hourAndMinute
            )
            .onChange(of: pendingTime) { _, newValue in
                Task { await notificationState.updateNotificationTime(newValue) }
            }
        } footer: {
            Text("Notifications are delivered at this time, up to 7:45 AM at the latest.")
        }
    }

    // MARK: - Helpers

    private func openAppSettings() {
        guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
        UIApplication.shared.open(url)
    }

    private func suggestTimeIfNeeded() async {
        guard !hasSuggestedTime else { return }
        hasSuggestedTime = true

        let hasStoredTime = UserDefaults.standard.object(forKey: "notification.workoutReminder.time") != nil
        guard !hasStoredTime else { return }

        if let suggested = await notificationState.suggestTimeFromSleepSchedule() {
            pendingTime = suggested
            await notificationState.updateNotificationTime(suggested)
        }
    }
}
