import SwiftUI

struct MonitorGatingView: View {
	@ObservedObject var healthKitService: HealthKitService
	@State private var showIntegrationSheet = false

	var body: some View {
		VStack(spacing: 24) {
			Spacer()

			Image(systemName: "heart.text.square")
				.font(.system(size: 64))
				.foregroundStyle(.blue)

			Text("Unlock Health Insights")
				.font(.title2)
				.fontWeight(.bold)

			Text("Connect Apple Health to monitor your cardiovascular, activity, sleep, mindfulness, and environmental health data. Our AI analyzes your trends to provide personalized insights.")
				.font(.body)
				.foregroundStyle(.secondary)
				.multilineTextAlignment(.center)
				.padding(.horizontal, 32)

			VStack(alignment: .leading, spacing: 12) {
				featureRow(icon: "heart.fill", text: "Heart rate & cardiovascular metrics")
				featureRow(icon: "figure.run", text: "Activity & movement tracking")
				featureRow(icon: "bed.double.fill", text: "Sleep & recovery analysis")
				featureRow(icon: "brain.head.profile", text: "Mindfulness sessions")
				featureRow(icon: "ear.fill", text: "Environmental audio exposure")
				featureRow(icon: "chart.line.uptrend.xyaxis", text: "AI-powered trend insights")
			}
			.padding(.horizontal, 40)

			Button {
				showIntegrationSheet = true
			} label: {
				Text("Connect Apple Health")
			}
			.buttonStyle(PrimaryButtonStyle())
			.padding(.horizontal, 32)

			Spacer()
		}
		.sheet(isPresented: $showIntegrationSheet) {
			healthKitService.checkAuthorization()
		} content: {
			HealthKitIntegrationView(healthKitService: healthKitService)
		}
	}

	private func featureRow(icon: String, text: String) -> some View {
		HStack(spacing: 12) {
			Image(systemName: icon)
				.foregroundStyle(.blue)
				.frame(width: 24)
			Text(text)
				.font(.subheadline)
		}
	}
}
