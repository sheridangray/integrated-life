import SwiftUI

struct HomeView: View {
	@ObservedObject var timeState: TimeState
	@State private var showCategoryPicker = false

	var body: some View {
		NavigationStack {
			ScrollView {
				VStack(spacing: 16) {
					if timeState.activeEntries.isEmpty {
						idleView
					} else {
						activeView
					}
				}
				.padding()
			}
			.navigationTitle("Home")
			.task { await timeState.loadActiveEntries() }
			.sheet(isPresented: $showCategoryPicker) {
				CategoryPickerSheet { category in
					Task { await timeState.startActivity(categoryId: category.id) }
				}
			}
		}
	}

	private var idleView: some View {
		VStack(spacing: 20) {
			Spacer().frame(height: 60)
			Image(systemName: "timer")
				.font(.system(size: 48))
				.foregroundStyle(.secondary)
			Text("No activities tracking")
				.font(.title3)
				.foregroundStyle(.secondary)
			Button {
				showCategoryPicker = true
			} label: {
				Label("Start Tracking", systemImage: "play.fill")
			}
			.buttonStyle(PrimaryButtonStyle())
			.padding(.horizontal, 40)
			Spacer()
		}
		.frame(maxWidth: .infinity)
	}

	private var activeView: some View {
		VStack(spacing: 12) {
			ForEach(timeState.activeEntries) { entry in
				ActiveTimerCard(entry: entry) {
					Task { await timeState.stopActivity(id: entry.id) }
				}
			}

			Button {
				showCategoryPicker = true
			} label: {
				Label("Start Another", systemImage: "plus.circle.fill")
			}
			.buttonStyle(SecondaryButtonStyle())
			.padding(.top, 4)
		}
	}
}
