import SwiftUI

struct DayTimelineView: View {
	@ObservedObject var timeState: TimeState
	@State private var editingTask: TimeTask?
	@State private var showingTaskEditor = false
	@State private var prefillStartTime: String?

	var body: some View {
		VStack(spacing: 0) {
			TimelineDateHeader(
				date: timeState.selectedDate,
				onPrevious: { Task { await timeState.navigateDay(offset: -1) } },
				onNext: { Task { await timeState.navigateDay(offset: 1) } },
				onToday: { Task { await timeState.loadTasks(for: Date()) } }
			)

			Divider()

			if timeState.isLoading && timeState.tasks.isEmpty {
				Spacer()
				ProgressView("Loading schedule...")
				Spacer()
			} else {
				ScrollViewReader { proxy in
					ScrollView {
						allDaySection
						timedSection
					}
					.onAppear { scrollToCurrentHour(proxy: proxy) }
				}
			}
		}
		.task {
			await timeState.migrateOverdueTasks()
			await timeState.loadTasks()
		}
		.sheet(isPresented: $showingTaskEditor, onDismiss: clearEditorState) {
			TaskEditorView(
				timeState: timeState,
				editingTask: editingTask,
				prefillStartTime: prefillStartTime
			)
		}
		.overlay(alignment: .bottomTrailing) {
			addButton
		}
	}

	// MARK: - All-Day Section

	@ViewBuilder
	private var allDaySection: some View {
		if !timeState.allDayTasks.isEmpty {
			VStack(spacing: 6) {
				HStack {
					Text("All Day")
						.font(.caption.weight(.medium))
						.foregroundStyle(.secondary)
					Spacer()
				}
				ForEach(timeState.allDayTasks) { task in
					AllDayTaskRow(
						task: task,
						onTap: {
							editingTask = task
							showingTaskEditor = true
						},
						onToggleComplete: {
							Task { await timeState.toggleCompletion(task: task) }
						},
						onDelete: {
							Task { await timeState.deleteTask(id: task.id) }
						}
					)
				}
			}
			.padding(.horizontal)
			.padding(.vertical, 8)

			Divider()
		}
	}

	// MARK: - Timed Section

	private var timedSection: some View {
		ZStack(alignment: .topLeading) {
			HourMarkerGrid()

			currentTimeLine

			ForEach(timeState.timedTasks) { task in
				if let startMinute = task.startMinuteOfDay {
					TimelineTaskBlock(
						task: task,
						onTap: {
							editingTask = task
							showingTaskEditor = true
						},
						onToggleComplete: {
							Task { await timeState.toggleCompletion(task: task) }
						}
					)
					.frame(
						height: TimelineLayout.blockHeight(durationMinutes: task.durationMinutes)
					)
					.padding(.leading, TimelineLayout.gutterWidth + 8)
					.padding(.trailing, TimelineLayout.blockHorizontalPadding)
					.offset(y: TimelineLayout.yOffset(forMinute: startMinute))
				}
			}

			tapTargets
		}
		.frame(
			height: CGFloat(TimelineLayout.totalHours) * TimelineLayout.hourHeight,
			alignment: .topLeading
		)
		.padding(.bottom, 80)
	}

	// MARK: - Current Time Indicator

	@ViewBuilder
	private var currentTimeLine: some View {
		if Calendar.current.isDateInToday(timeState.selectedDate) {
			let now = Date()
			let cal = Calendar.current
			let minute = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)

			DayTimelineView.CurrentTimeIndicator()
				.offset(y: TimelineLayout.yOffset(forMinute: minute))
				.id("currentTime")
		}
	}

	struct CurrentTimeIndicator: View {
		var body: some View {
			HStack(spacing: 0) {
				Circle()
					.fill(.red)
					.frame(width: 8, height: 8)
					.padding(.leading, TimelineLayout.gutterWidth - 4)
				Rectangle()
					.fill(.red)
					.frame(height: 1)
			}
		}
	}

	// MARK: - Tap Targets (invisible) for empty time slots

	private var tapTargets: some View {
		ForEach(TimelineLayout.startHour..<TimelineLayout.endHour, id: \.self) { hour in
			Color.clear
				.frame(height: TimelineLayout.hourHeight)
				.contentShape(Rectangle())
				.onTapGesture {
					let h = String(format: "%02d", hour)
					prefillStartTime = "\(h):00"
					editingTask = nil
					showingTaskEditor = true
				}
				.offset(y: CGFloat(hour - TimelineLayout.startHour) * TimelineLayout.hourHeight)
				.padding(.leading, TimelineLayout.gutterWidth + 8)
				.allowsHitTesting(!timeState.timedTasks.contains { t in
					guard let start = t.startMinuteOfDay else { return false }
					let end = start + t.durationMinutes
					let slotStart = hour * 60
					let slotEnd = slotStart + 60
					return start < slotEnd && end > slotStart
				})
		}
	}

	// MARK: - FAB

	private var addButton: some View {
		Button {
			editingTask = nil
			prefillStartTime = nil
			showingTaskEditor = true
		} label: {
			Image(systemName: "plus")
				.font(.title2.weight(.semibold))
				.foregroundStyle(.white)
				.frame(width: 56, height: 56)
				.background(Circle().fill(.blue))
				.shadow(radius: 4, y: 2)
		}
		.padding(20)
	}

	// MARK: - Helpers

	private func scrollToCurrentHour(proxy: ScrollViewProxy) {
		guard Calendar.current.isDateInToday(timeState.selectedDate) else { return }
		proxy.scrollTo("currentTime", anchor: .center)
	}

	private func clearEditorState() {
		editingTask = nil
		prefillStartTime = nil
	}
}
