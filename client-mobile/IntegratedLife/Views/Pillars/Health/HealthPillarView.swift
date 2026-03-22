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
	case healthReports
	case historicalSync
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
				WorkoutDetailView(workoutId: id, selectedTab: $selectedTab, healthState: healthState)
			case .healthReports:
				HealthReportListView()
			case .historicalSync:
				HistoricalSyncView()
			}
		}
		.navigationDestination(for: HistoryItem.self) { item in
			HistoryDetailView(item: item)
		}
		.navigationDestination(for: HealthKitDataType.self) { dataType in
			MonitorDetailView(sampleType: dataType, healthKitService: healthKitService)
		}
		.navigationDestination(for: HealthReport.self) { report in
			HealthReportDetailView(report: report)
		}
	}
}

private struct MonitorTabContent: View {
	@ObservedObject var healthKitService: HealthKitService
	@ObservedObject private var syncService = MonitorSyncService.shared

	var body: some View {
		if healthKitService.isAuthorized {
			MonitorListView(healthKitService: healthKitService)
				.task {
					try? await healthKitService.requestAuthorization()
					await syncService.syncIfNeeded()
				}
		} else {
			MonitorGatingView(healthKitService: healthKitService)
		}
	}
}
