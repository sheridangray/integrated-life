import SwiftUI

enum TimeTab: String, CaseIterable, Identifiable {
	case dashboard = "Dashboard"
	case budget = "Budget"

	var id: String { rawValue }
}

struct TimePillarView: View {
	@ObservedObject var timeState: TimeState
	@State private var selectedTab: TimeTab = .dashboard

	var body: some View {
		VStack(spacing: 0) {
			Picker("Section", selection: $selectedTab) {
				ForEach(TimeTab.allCases) { tab in
					Text(tab.rawValue).tag(tab)
				}
			}
			.pickerStyle(.segmented)
			.padding(.horizontal)
			.padding(.vertical, 8)

			switch selectedTab {
			case .dashboard:
				TimeDashboardView(timeState: timeState)
			case .budget:
				TimeBudgetView(timeState: timeState)
			}
		}
		.navigationTitle("Time")
		.navigationBarTitleDisplayMode(.inline)
	}
}
