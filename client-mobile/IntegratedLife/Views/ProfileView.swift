import SwiftUI

struct ProfileView: View {
	@ObservedObject var authState: AuthState
	@ObservedObject var healthKitService: HealthKitService
	@StateObject private var notificationState = NotificationState()

	@State private var selectedGender: String = ""
	@State private var selectedDOB: Date = Calendar.current.date(byAdding: .year, value: -30, to: Date()) ?? Date()
	@State private var hasDOB = false
	@State private var isProfileLoaded = false
	@State private var isImportingDOB = false
	@State private var dobImportAlertMessage: String?

	private let genderOptions = ["female", "male", "other"]

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

				Section("Personal Info") {
					Picker("Gender", selection: $selectedGender) {
						Text("Not set").tag("")
						ForEach(genderOptions, id: \.self) { option in
							Text(option.capitalized).tag(option)
						}
					}
					.onChange(of: selectedGender) {
						guard isProfileLoaded else { return }
						Task { await authState.updateProfile(gender: selectedGender.isEmpty ? nil : selectedGender, dateOfBirth: nil) }
					}

					if healthKitService.isHealthDataAvailable {
						Button {
							Task { await importPersonalInfoFromAppleHealth() }
						} label: {
							HStack {
								Label("Import from Apple Health", systemImage: "heart.fill")
								if isImportingDOB {
									Spacer()
									ProgressView()
								}
							}
						}
						.disabled(isImportingDOB)
					}

					if hasDOB {
						DatePicker("Date of Birth", selection: $selectedDOB, in: ...Date(), displayedComponents: .date)
							.onChange(of: selectedDOB) {
								guard isProfileLoaded else { return }
								let formatter = ISO8601DateFormatter()
								Task { await authState.updateProfile(gender: nil, dateOfBirth: formatter.string(from: selectedDOB)) }
							}
					} else {
						Button("Set Date of Birth") {
							hasDOB = true
							let formatter = ISO8601DateFormatter()
							Task { await authState.updateProfile(gender: nil, dateOfBirth: formatter.string(from: selectedDOB)) }
						}
					}
				}

			Section("More") {
				NavigationLink("Notifications") {
					NotificationSettingsView(notificationState: notificationState, healthKitService: healthKitService)
				}
			NavigationLink("Integrations") {
				IntegrationsView(healthKitService: healthKitService, authState: authState)
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
			.alert("Apple Health", isPresented: Binding(
				get: { dobImportAlertMessage != nil },
				set: { if !$0 { dobImportAlertMessage = nil } }
			)) {
				Button("OK", role: .cancel) { dobImportAlertMessage = nil }
			} message: {
				Text(dobImportAlertMessage ?? "")
			}
			.onAppear {
				guard !isProfileLoaded, let user = authState.user else { return }
				selectedGender = user.gender ?? ""
				if let dob = user.dateOfBirth {
					let formatter = ISO8601DateFormatter()
					if let date = formatter.date(from: dob) {
						selectedDOB = date
						hasDOB = true
					}
				}
				isProfileLoaded = true
			}
		}
	}

	private func importPersonalInfoFromAppleHealth() async {
		isImportingDOB = true
		defer { isImportingDOB = false }

		// Merges any newly added read types for users who connected Health earlier.
		try? await healthKitService.requestAuthorization()

		let dob = healthKitService.fetchDateOfBirth()
		let gender = healthKitService.fetchBiologicalSexGender()

		guard dob != nil || gender != nil else {
			dobImportAlertMessage = "Could not read date of birth or sex. Add them in the Health app (profile), allow access under Settings → Health → Data Access & Devices → Integrated Life, or enter them manually below."
			return
		}

		if let dob {
			selectedDOB = dob
			hasDOB = true
		}
		if let gender {
			selectedGender = gender
		}

		guard isProfileLoaded else { return }
		let formatter = ISO8601DateFormatter()
		await authState.updateProfile(
			gender: gender,
			dateOfBirth: dob.map { formatter.string(from: $0) }
		)
	}
}

// MARK: - Placeholder destination views

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
