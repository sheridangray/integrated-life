import Charts
import SwiftUI
import UIKit
import UniformTypeIdentifiers

struct PillarsOverviewView: View {
	@Binding var pillarsPath: NavigationPath
	@ObservedObject var healthKitService: HealthKitService
	@ObservedObject var timeState: TimeState
	@ObservedObject var sleepState: SleepState
	@ObservedObject var healthState: HealthState
	@ObservedObject var foodState: FoodState
	@ObservedObject var householdState: HouseholdState

	@State private var pillarOrder: [Pillar] = PillarOrderStore.loadOrder()
	@State private var draggedPillar: Pillar?
	@State private var lastDataRefresh: Date?

	var body: some View {
		NavigationStack(path: $pillarsPath) {
			ScrollView {
				LazyVGrid(
					columns: [GridItem(.adaptive(minimum: 320), spacing: 12, alignment: .top)],
					spacing: 12
				) {
					ForEach(pillarOrder, id: \.self) { pillar in
						let pres = PillarOverviewPresentationBuilder.presentation(
							for: pillar,
							sleepState: sleepState,
							healthState: healthState,
							foodState: foodState,
							householdState: householdState,
							lastDataRefresh: lastDataRefresh
						)
						NavigationLink(value: pillar) {
							PillarMetricCard(presentation: pres)
						}
						.buttonStyle(.plain)
						.onDrag {
							draggedPillar = pillar
							UIImpactFeedbackGenerator(style: .light).impactOccurred()
							return NSItemProvider(object: pillar.rawValue as NSString)
						}
						.onDrop(
							of: [UTType.plainText],
							delegate: PillarReorderDropDelegate(
								target: pillar,
								order: $pillarOrder,
								dragged: $draggedPillar,
								save: { PillarOrderStore.saveOrder($0) }
							)
						)
					}
				}
				.padding()
			}
			.navigationTitle("Pillars")
			.navigationDestination(for: Pillar.self) { pillar in
				destinationView(for: pillar)
			}
			.task {
				await withTaskGroup(of: Void.self) { group in
					group.addTask { await sleepState.loadForOverview() }
					group.addTask { await healthState.loadHistory(page: 1) }
					group.addTask { await foodState.loadForOverview() }
					group.addTask { await householdState.loadForOverview() }
				}
				lastDataRefresh = Date()
			}
		}
	}

	@ViewBuilder
	private func destinationView(for pillar: Pillar) -> some View {
		switch pillar {
		case .time:
			TimePillarView(timeState: timeState)
		case .health:
			HealthPillarView(healthState: healthState, healthKitService: healthKitService)
		case .sleep:
			SleepPillarView(healthKitService: healthKitService, sleepState: sleepState)
		case .food:
			FoodPillarView(foodState: foodState)
		case .household:
			HouseholdPillarView(householdState: householdState)
		default:
			PillarOverviewPlaceholder(pillar: pillar)
		}
	}
}

// MARK: - Reorder

private struct PillarReorderDropDelegate: DropDelegate {
	let target: Pillar
	@Binding var order: [Pillar]
	@Binding var dragged: Pillar?
	let save: ([Pillar]) -> Void

	func validateDrop(info: DropInfo) -> Bool {
		dragged != nil
	}

	func dropEntered(info: DropInfo) {
		guard let d = dragged, d != target else { return }
		UIImpactFeedbackGenerator(style: .soft).impactOccurred()
	}

	func performDrop(info: DropInfo) -> Bool {
		guard let from = dragged,
		      from != target,
		      let i = order.firstIndex(of: from),
		      let j = order.firstIndex(of: target)
		else {
			dragged = nil
			return false
		}
		var next = order
		next.swapAt(i, j)
		order = next
		dragged = nil
		save(next)
		UIImpactFeedbackGenerator(style: .medium).impactOccurred()
		return true
	}
}

enum Pillar: String, CaseIterable, Hashable {
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
		case .household: return "house.fill"
		}
	}
}

// MARK: - Card

private struct PillarMetricCard: View {
	let presentation: PillarCardPresentation

	var body: some View {
		HStack(alignment: .center, spacing: 12) {
			Image(systemName: presentation.pillar.icon)
				.font(.title2)
				.foregroundStyle(.secondary)
				.frame(width: 32, alignment: .center)
				.accessibilityHidden(true)

			VStack(alignment: .leading, spacing: 4) {
				Text(presentation.pillar.rawValue)
					.font(.headline)
				if presentation.isPlaceholder {
					Text("Roadmap pillar — full experience coming later.")
						.font(.caption)
						.foregroundStyle(.secondary)
				} else if presentation.pillar == .time {
					Text("Score and trends not wired yet.")
						.font(.caption)
						.foregroundStyle(.secondary)
				} else if presentation.pillar == .health {
					Text("Workouts logged · last 7 days")
						.font(.caption)
						.foregroundStyle(.secondary)
				} else if presentation.pillar == .food {
					Text("Calories today")
						.font(.caption)
						.foregroundStyle(.secondary)
				} else if presentation.pillar == .sleep {
					Text("Sleep score")
						.font(.caption)
						.foregroundStyle(.secondary)
				} else if presentation.pillar == .household {
					Text("Tasks due")
						.font(.caption)
						.foregroundStyle(.secondary)
				}
				if let err = presentation.errorMessage {
					Text(err)
						.font(.caption2)
						.foregroundStyle(.red)
				}
				if let stale = presentation.lastUpdatedText {
					Text(stale)
						.font(.caption2)
						.foregroundStyle(.tertiary)
				}
			}

			Spacer(minLength: 8)

			trailingContent
		}
		.padding()
		.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
		.accessibilityElement(children: .combine)
		.accessibilityLabel(accessibilitySummary)
	}

	@ViewBuilder
	private var trailingContent: some View {
		if presentation.isPlaceholder {
			Text("Coming Soon")
				.font(.subheadline.weight(.semibold))
				.foregroundStyle(.secondary)
				.padding(.horizontal, 10)
				.padding(.vertical, 6)
				.background(Color.secondary.opacity(0.12), in: Capsule())
			Image(systemName: "chevron.right")
				.font(.caption)
				.foregroundStyle(.tertiary)
		} else if presentation.isLoading {
			ProgressView()
				.frame(width: 60, height: 20)
			Image(systemName: "chevron.right")
				.font(.caption)
				.foregroundStyle(.tertiary)
		} else {
			VStack(alignment: .trailing, spacing: 4) {
				HStack(spacing: 6) {
					Circle()
						.fill(presentation.attention.indicatorColor)
						.frame(width: 8, height: 8)
						.accessibilityLabel(attentionAccessibility)
					Text(presentation.scoreText)
						.font(.title2.weight(.semibold))
						.monospacedDigit()
					PillarSparklineChart(values: presentation.sparklineValues, tint: presentation.attention.indicatorColor)
				}
				if let delta = presentation.deltaText {
					Text(delta)
						.font(.caption2)
						.foregroundStyle(.secondary)
				}
			}
			Image(systemName: "chevron.right")
				.font(.caption)
				.foregroundStyle(.tertiary)
		}
	}

	private var attentionAccessibility: String {
		switch presentation.attention {
		case .needsAttention: return "Needs attention"
		case .caution: return "Caution"
		case .good: return "On track"
		case .neutral: return "Neutral"
		}
	}

	private var accessibilitySummary: String {
		if presentation.isPlaceholder {
			return "\(presentation.pillar.rawValue), coming soon"
		}
		var parts = ["\(presentation.pillar.rawValue)", attentionAccessibility]
		if !presentation.scoreText.isEmpty, presentation.scoreText != "—" {
			parts.append("score \(presentation.scoreText)")
		}
		if let d = presentation.deltaText {
			parts.append(d)
		}
		return parts.joined(separator: ", ")
	}
}

private struct PillarSparklineChart: View {
	let values: [Double]
	let tint: Color

	var body: some View {
		Group {
			if values.isEmpty {
				RoundedRectangle(cornerRadius: 3)
					.fill(Color.secondary.opacity(0.15))
					.frame(width: 60, height: 20)
			} else {
				Chart {
					ForEach(Array(values.enumerated()), id: \.offset) { index, value in
						LineMark(
							x: .value("day", index),
							y: .value("value", value)
						)
						.foregroundStyle(tint)
						.lineStyle(StrokeStyle(lineWidth: 1.25))
					}
				}
				.chartXAxis(.hidden)
				.chartYAxis(.hidden)
				.chartLegend(.hidden)
				.frame(width: 60, height: 20)
			}
		}
		.accessibilityLabel(values.isEmpty ? "No sparkline data" : "Seven day sparkline, \(values.count) points")
	}
}

struct PillarOverviewPlaceholder: View {
	let pillar: Pillar

	var body: some View {
		VStack(spacing: 12) {
			Text("Coming Soon")
				.font(.title3.weight(.semibold))
				.padding(.horizontal, 14)
				.padding(.vertical, 8)
				.background(Color.secondary.opacity(0.15), in: Capsule())
			Text("\(pillar.rawValue) overview")
				.font(.title2)
			Text("Pillar-specific insights and entry points will appear here.")
				.foregroundStyle(.secondary)
				.multilineTextAlignment(.center)
				.padding(.horizontal)
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity)
		.navigationTitle(pillar.rawValue)
	}
}
