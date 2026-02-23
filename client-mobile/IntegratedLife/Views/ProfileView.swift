import SwiftUI

struct ProfileView: View {
	@ObservedObject var authState: AuthState
	@ObservedObject var healthKitService: HealthKitService

	var body: some View {
		NavigationStack {
			List {
				Section {
					if let user = authState.user {
						VStack(alignment: .leading, spacing: 4) {
							Text(user.name)
								.font(.headline)
							Text(user.email)
								.font(.subheadline)
								.foregroundStyle(.secondary)
						}
						.padding(.vertical, 4)
					}

					Button("Sign out", role: .destructive) {
						authState.signOut()
					}
				}

			Section("More") {
				NavigationLink("Settings") {
					SettingsPlaceholderView()
				}
				NavigationLink("Integrations") {
					IntegrationsView(healthKitService: healthKitService)
				}
				NavigationLink("History") {
					ActivityHistoryPlaceholderView()
				}
				NavigationLink("About") {
					AboutPlaceholderView()
				}
				NavigationLink("Privacy") {
					PrivacyPlaceholderView()
				}
				NavigationLink("Terms of Service") {
					TermsPlaceholderView()
				}
			}

			#if DEBUG
			Section {
				NavigationLink {
					DebugMenuView(healthKitService: healthKitService)
				} label: {
					Label("Debug Menu", systemImage: "ladybug.fill")
						.foregroundStyle(.orange)
				}
			}
			#endif
			}
			.navigationTitle("Profile")
		}
	}
}

// MARK: - Placeholder destination views

struct SettingsPlaceholderView: View {
	var body: some View {
		PlaceholderContent(title: "Settings", message: "App settings will appear here.")
	}
}

struct ActivityHistoryPlaceholderView: View {
	var body: some View {
		PlaceholderContent(title: "Activity History", message: "Your activity history will appear here.")
	}
}

struct AboutPlaceholderView: View {
	var body: some View {
		PlaceholderContent(title: "About", message: "App information will appear here.")
	}
}

struct PrivacyPlaceholderView: View {
	var body: some View {
		PlaceholderContent(title: "Privacy", message: "Privacy settings and policy will appear here.")
	}
}

struct TermsPlaceholderView: View {
	var body: some View {
		PlaceholderContent(title: "Terms of Service", message: "Terms of service will appear here.")
	}
}

private struct PlaceholderContent: View {
	let title: String
	let message: String

	var body: some View {
		VStack {
			Text(message)
				.foregroundStyle(.secondary)
				.multilineTextAlignment(.center)
				.padding()
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity)
		.navigationTitle(title)
	}
}
