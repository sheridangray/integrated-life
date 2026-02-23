import SwiftUI

struct HomeView: View {
	var body: some View {
		NavigationStack {
			VStack {
				Text("Welcome to Integrated Life")
					.font(.title2)
				Text("Your dashboard will appear here.")
					.foregroundStyle(.secondary)
			}
			.frame(maxWidth: .infinity, maxHeight: .infinity)
			.navigationTitle("Home")
		}
	}
}
