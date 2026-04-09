import SwiftUI

enum HouseholdTab: String, CaseIterable, Identifiable {
    case upcoming = "Upcoming"
    case schedule = "Schedule"
    case cleaner = "Cleaner"
    case settings = "Settings"

    var id: String { rawValue }
}

enum HouseholdNavDestination: Hashable {
    case taskDetail(String)
}

struct HouseholdPillarView: View {
    @ObservedObject var householdState: HouseholdState

    @State private var selectedTab: HouseholdTab = .upcoming

    var body: some View {
        VStack(spacing: 0) {
            Picker("Section", selection: $selectedTab) {
                ForEach(HouseholdTab.allCases) { tab in
                    Text(tab.rawValue).tag(tab)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 8)

            switch selectedTab {
            case .upcoming:
                HouseholdUpcomingView(householdState: householdState)
            case .schedule:
                HouseholdScheduleView(householdState: householdState)
            case .cleaner:
                CleanerRotationView(householdState: householdState)
            case .settings:
                HouseholdSettingsView(householdState: householdState)
            }
        }
        .navigationTitle("Household")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                if householdState.pendingTaskCount > 0 {
                    Text("\(householdState.pendingTaskCount)")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(.red, in: Capsule())
                }
            }
        }
        .navigationDestination(for: HouseholdNavDestination.self) { destination in
            switch destination {
            case .taskDetail:
                EmptyView()
            }
        }
    }
}
