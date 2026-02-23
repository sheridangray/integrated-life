import SwiftUI

struct PillarsOverviewView: View {
	@ObservedObject var healthKitService: HealthKitService

	var body: some View {
		NavigationStack {
			ScrollView {
				LazyVStack(spacing: 12) {
					ForEach(Pillar.allCases, id: \.self) { pillar in
						NavigationLink(value: pillar) {
							PillarCard(pillar: pillar)
						}
						.buttonStyle(.plain)
					}
				}
				.padding()
			}
			.navigationTitle("Pillars")
			.navigationDestination(for: Pillar.self) { pillar in
				destinationView(for: pillar)
			}
		}
	}

	@ViewBuilder
	private func destinationView(for pillar: Pillar) -> some View {
		switch pillar {
		case .health:
			HealthPillarView(healthKitService: healthKitService)
		case .sleep:
			SleepPillarView(healthKitService: healthKitService)
		default:
			PillarOverviewPlaceholder(pillar: pillar)
		}
	}
}

enum Pillar: String, CaseIterable {
	case time = "Time"
	case health = "Health"
	case food = "Food"
	case relationships = "Relationships"
	case money = "Money"
	case sleep = "Sleep"
	case household = "Household"

	var icon: String {
		switch self {
		case .time: return "clock"
		case .health: return "heart"
		case .food: return "fork.knife"
		case .relationships: return "person.2"
		case .money: return "dollarsign"
		case .sleep: return "bed.double"
		case .household: return "building.2"
		}
	}
}

struct PillarCard: View {
	let pillar: Pillar

	var body: some View {
		HStack(spacing: 16) {
			Image(systemName: pillar.icon)
				.font(.title2)
				.foregroundStyle(.secondary)
				.frame(width: 32, alignment: .center)
			Text(pillar.rawValue)
				.font(.headline)
			Spacer()
			Image(systemName: "chevron.right")
				.font(.caption)
				.foregroundStyle(.tertiary)
		}
		.padding()
		.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
	}
}

struct PillarOverviewPlaceholder: View {
	let pillar: Pillar

	var body: some View {
		VStack {
			Text("\(pillar.rawValue) Overview")
				.font(.title2)
			Text("Pillar-specific insights and entry points will appear here.")
				.foregroundStyle(.secondary)
				.multilineTextAlignment(.center)
				.padding()
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity)
		.navigationTitle(pillar.rawValue)
	}
}
