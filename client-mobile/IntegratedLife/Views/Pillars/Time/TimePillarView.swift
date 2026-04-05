import SwiftUI

struct TimePillarView: View {
	@ObservedObject var timeState: TimeState
	@State private var selectedTab: TimeTab = .timeline
	@State private var showRoutineManager = false

	enum TimeTab: String, CaseIterable, Identifiable {
		case inbox = "Inbox"
		case timeline = "Timeline"
		var id: String { rawValue }
	}

	var body: some View {
		VStack(spacing: 0) {
			Picker("View", selection: $selectedTab) {
				ForEach(TimeTab.allCases) { tab in
					Text(tab.rawValue).tag(tab)
				}
			}
			.pickerStyle(.segmented)
			.padding(.horizontal)
			.padding(.vertical, 8)

			switch selectedTab {
			case .inbox:
				InboxView(timeState: timeState)
			case .timeline:
				DayTimelineView(timeState: timeState)
			}
		}
		.navigationTitle("Time")
		.navigationBarTitleDisplayMode(.inline)
		.toolbar {
			ToolbarItem(placement: .primaryAction) {
				Button {
					showRoutineManager = true
				} label: {
					Image(systemName: "arrow.triangle.2.circlepath")
				}
			}
		}
		.sheet(isPresented: $showRoutineManager) {
			RoutineManagerView(timeState: timeState)
		}
	}
}
