import SwiftUI

struct IntegrationsView: View {
	@ObservedObject var healthKitService: HealthKitService

	var body: some View {
		List {
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
		}
		.navigationTitle("Integrations")
	}
}
