import SwiftUI

struct IntegrationsView: View {
	@ObservedObject var healthKitService: HealthKitService
	@ObservedObject var authState: AuthState

	@State private var calendarEnabled = false
	@State private var hasCalendarTokens = false
	@State private var isLoadingCalendar = false
	@State private var settingsLoaded = false

	private let timeService = TimeService.shared

	var body: some View {
		List {
			Section {
				HStack(spacing: 12) {
					Image(systemName: "person.crop.circle.fill")
						.font(.title2)
						.foregroundStyle(.blue)
						.frame(width: 36, height: 36)
						.background(.blue.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))

					VStack(alignment: .leading, spacing: 2) {
						Text("Google Account")
							.font(.body)
						Text(authState.user?.email ?? "Connected")
							.font(.caption)
							.foregroundStyle(.green)
					}

					Spacer()

					Image(systemName: "checkmark.circle.fill")
						.foregroundStyle(.green)
				}
				.padding(.vertical, 2)

				HStack(spacing: 12) {
					Image(systemName: "calendar")
						.font(.title2)
						.foregroundStyle(.blue)
						.frame(width: 36, height: 36)
						.background(.blue.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))

					VStack(alignment: .leading, spacing: 2) {
						Text("Google Calendar")
							.font(.body)
						if !hasCalendarTokens {
							Text("Sign out and back in to grant access")
								.font(.caption)
								.foregroundStyle(.orange)
						} else {
							Text(calendarEnabled ? "Syncing" : "Disabled")
								.font(.caption)
								.foregroundStyle(calendarEnabled ? .green : .secondary)
						}
					}

					Spacer()

					if isLoadingCalendar {
						ProgressView()
					} else {
						Toggle("", isOn: $calendarEnabled)
							.labelsHidden()
							.disabled(!hasCalendarTokens)
					}
				}
				.padding(.vertical, 2)
			} header: {
				Text("Google")
			} footer: {
				Text("Your Google account is used to sign in and cannot be disconnected. Google Calendar sync pulls your events into the Timeline view.")
			}

			Section {
				NavigationLink {
					HealthKitIntegrationView(healthKitService: healthKitService)
				} label: {
					HStack(spacing: 12) {
						Image(systemName: "heart.fill")
							.font(.title2)
							.foregroundStyle(.red)
							.frame(width: 36, height: 36)
							.background(.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))

						VStack(alignment: .leading, spacing: 2) {
							Text("Apple Health")
								.font(.body)
							Text(healthKitService.isAuthorized ? "Connected" : "Not Connected")
								.font(.caption)
								.foregroundStyle(healthKitService.isAuthorized ? .green : .secondary)
						}

						Spacer()

						if healthKitService.isAuthorized {
							Image(systemName: "checkmark.circle.fill")
								.foregroundStyle(.green)
						}
					}
				}
		} header: {
			Text("Health & Fitness")
		} footer: {
			Text("Connect services to enable automated data import and richer insights.")
		}

			Section {
				NavigationLink {
					OpenClawSettingsView()
				} label: {
					HStack(spacing: 12) {
						Image(systemName: "terminal")
							.font(.title2)
							.foregroundStyle(.orange)
							.frame(width: 36, height: 36)
							.background(.orange.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))

						VStack(alignment: .leading, spacing: 2) {
							Text("OpenClaw")
								.font(.body)
							Text("Instacart automation")
								.font(.caption)
								.foregroundStyle(.secondary)
						}

						Spacer()

						Image(systemName: "chevron.right")
							.font(.caption)
							.foregroundStyle(.tertiary)
					}
				}
			} header: {
				Text("Automation")
			} footer: {
				Text("Configure agent-based automations like Instacart grocery ordering.")
			}
	}
	.navigationTitle("Integrations")
		.task { await loadCalendarSettings() }
		.onChange(of: calendarEnabled) { _, newValue in
			guard settingsLoaded else { return }
			Task { await toggleCalendar(enabled: newValue) }
		}
	}

	private func loadCalendarSettings() async {
		isLoadingCalendar = true
		defer { isLoadingCalendar = false }
		do {
			let settings = try await timeService.fetchCalendarSettings()
			calendarEnabled = settings.enabled
			hasCalendarTokens = settings.hasTokens
			settingsLoaded = true
		} catch {}
	}

	private func toggleCalendar(enabled: Bool) async {
		isLoadingCalendar = true
		defer { isLoadingCalendar = false }
		do {
			let settings = try await timeService.setCalendarEnabled(enabled)
			calendarEnabled = settings.enabled
			hasCalendarTokens = settings.hasTokens
		} catch {
			calendarEnabled = !enabled
		}
	}
}
