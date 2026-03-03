import SwiftUI

enum HealthTab: String, CaseIterable, Identifiable {
	case workouts = "Workouts"
	case exercises = "Exercises"
	case history = "History"
	case monitor = "Monitor"

	var id: String { rawValue }
}

enum HealthNavDestination: Hashable {
	case exerciseDetail(String)
	case workoutDetail(String)
}

struct HealthPillarView: View {
	@StateObject private var healthState = HealthState()
	@ObservedObject var healthKitService: HealthKitService

	@State private var selectedTab: HealthTab = .workouts

	var body: some View {
		VStack(spacing: 0) {
			Picker("Section", selection: $selectedTab) {
				ForEach(HealthTab.allCases) { tab in
					Text(tab.rawValue).tag(tab)
				}
			}
			.pickerStyle(.segmented)
			.padding(.horizontal)
			.padding(.vertical, 8)

			switch selectedTab {
			case .exercises:
				ExerciseListView(healthState: healthState)
			case .workouts:
				WorkoutListView(healthState: healthState)
			case .history:
				HistoryView(healthState: healthState)
			case .monitor:
				MonitorTabContent(healthKitService: healthKitService)
			}
		}
		.navigationTitle("Health")
		.navigationBarTitleDisplayMode(.inline)
		.navigationDestination(for: HealthNavDestination.self) { destination in
			switch destination {
			case .exerciseDetail(let id):
				ExerciseDetailView(exerciseId: id, healthState: healthState)
			case .workoutDetail(let id):
				WorkoutDetailView(workoutId: id, selectedTab: $selectedTab)
			}
		}
		.navigationDestination(for: HistoryItem.self) { item in
			HistoryDetailView(item: item)
		}
		.navigationDestination(for: HealthKitDataType.self) { dataType in
			MonitorDetailView(sampleType: dataType, healthKitService: healthKitService)
		}
	}
}

private struct MonitorTabContent: View {
	@ObservedObject var healthKitService: HealthKitService

	var body: some View {
		if healthKitService.isAuthorized {
			MonitorListView(healthKitService: healthKitService)
		} else {
			MonitorGatingView(healthKitService: healthKitService)
		}
	}
}
