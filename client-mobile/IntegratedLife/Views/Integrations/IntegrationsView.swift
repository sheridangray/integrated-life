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

// MARK: - OpenClaw (same file: not in Xcode project.pbxproj until xcodegen)

struct OpenClawSettingsView: View {
	@AppStorage("openclaw.instacartPrompt") private var savedPrompt = Self.defaultPrompt
	@State private var editingPrompt = ""
	@State private var isEditing = false
	@FocusState private var isFocused: Bool

	var body: some View {
		List {
			Section {
				HStack(spacing: 12) {
					Image(systemName: "cart.fill")
						.font(.title2)
						.foregroundStyle(.orange)
						.frame(width: 36, height: 36)
						.background(.orange.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))

					VStack(alignment: .leading, spacing: 2) {
						Text("Instacart Shopping")
							.font(.body)
						Text("Via OpenClaw agent")
							.font(.caption)
							.foregroundStyle(.secondary)
					}
				}
				.padding(.vertical, 2)
			} footer: {
				Text("When you tap \"Send to Instacart\" on your grocery list, this prompt is sent to OpenClaw along with your items. OpenClaw will handle the Instacart order and message you on Slack.")
			}

			Section("Shopping Instructions") {
				if isEditing {
					TextEditor(text: $editingPrompt)
						.font(.body.monospaced())
						.frame(minHeight: 300)
						.focused($isFocused)
				} else {
					Text(savedPrompt)
						.font(.body.monospaced())
						.foregroundStyle(.secondary)
				}
			}
		}
		.navigationTitle("OpenClaw")
		.navigationBarTitleDisplayMode(.inline)
		.toolbar {
			ToolbarItem(placement: .primaryAction) {
				if isEditing {
					Button("Save") {
						savedPrompt = editingPrompt
						isEditing = false
						isFocused = false
					}
				} else {
					Button("Edit") {
						editingPrompt = savedPrompt
						isEditing = true
						isFocused = true
					}
				}
			}

			if isEditing {
				ToolbarItem(placement: .cancellationAction) {
					Button("Cancel") {
						isEditing = false
						isFocused = false
					}
				}
			}

			if isEditing {
				ToolbarItem(placement: .bottomBar) {
					Button("Reset to Default") {
						editingPrompt = Self.defaultPrompt
					}
					.font(.subheadline)
				}
			}
		}
	}

	static let defaultPrompt = """
STORE RULES:
- Costco: Meat, vegetables, and fruit ONLY. Bulk is fine.
- Safeway: Everything else — dairy, pantry, herbs, condiments, sauces, wine, dry goods, frozen.
- If an item isn't available at the assigned store, flag it — don't auto-substitute.

PANTRY STAPLES (already have — exclude):
Kosher salt, black pepper, olive oil, neutral oil, butter, garlic, soy sauce, fish sauce, jasmine rice, common dried spices.

INSTRUCTIONS:
1. Log into instacart.com (credentials in ~/.openclaw/secrets/instacart.txt).
2. Search and add items. Prefer store brand unless quality matters (e.g., meat). Closest size to what's needed, in-stock.
3. If price difference between options is >30%, message me on Slack for a decision.
4. If an item is out of stock, suggest a substitute on Slack and wait for my reply before adding.
5. After all items are added, send me a Slack summary: total items per store, estimated total per store, any flags.
6. Wait to checkout until I give confirmation.

PREFERENCES:
- Organic produce when <25% price premium
- Bone-in, skin-on poultry
- Cheapest brand for pantry items
- Exact quantities — don't overbuy unless only option is larger size
"""
}
