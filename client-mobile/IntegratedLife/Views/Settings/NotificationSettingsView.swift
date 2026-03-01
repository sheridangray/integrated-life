import SwiftUI

struct NotificationSettingsView: View {
    @ObservedObject var notificationState: NotificationState
    @State private var pendingTime: Date
    @State private var hasSuggestedTime = false

    init(notificationState: NotificationState) {
        self.notificationState = notificationState
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
        }
        .navigationTitle("Notifications")
        .task {
            await notificationState.refreshAuthorizationStatus()
            await suggestTimeIfNeeded()
        }
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
