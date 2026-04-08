import SwiftUI

struct HouseholdUpcomingView: View {
    @ObservedObject var householdState: HouseholdState

    @State private var skipReason = ""
    @State private var taskToSkip: HouseholdTask?
    @State private var showSkipAlert = false

    var body: some View {
        List {
            if !householdState.overdueTasks.isEmpty {
                Section("Overdue") {
                    ForEach(householdState.overdueTasks) { task in
                        HouseholdTaskRow(task: task, isOverdue: true) {
                            await householdState.completeTask(task)
                        } onSkip: {
                            taskToSkip = task
                            showSkipAlert = true
                        }
                    }
                }
            }

            if !householdState.todayTasks.isEmpty {
                Section("Today") {
                    ForEach(householdState.todayTasks) { task in
                        HouseholdTaskRow(task: task) {
                            await householdState.completeTask(task)
                        } onSkip: {
                            taskToSkip = task
                            showSkipAlert = true
                        }
                    }
                }
            }

            if !householdState.thisWeekTasks.isEmpty {
                Section("This Week") {
                    ForEach(householdState.thisWeekTasks) { task in
                        HouseholdTaskRow(task: task) {
                            await householdState.completeTask(task)
                        } onSkip: {
                            taskToSkip = task
                            showSkipAlert = true
                        }
                    }
                }
            }

            if !householdState.thisMonthTasks.isEmpty {
                Section("This Month") {
                    ForEach(householdState.thisMonthTasks) { task in
                        HouseholdTaskRow(task: task) {
                            await householdState.completeTask(task)
                        } onSkip: {
                            taskToSkip = task
                            showSkipAlert = true
                        }
                    }
                }
            }

            if householdState.upcomingTasks.filter({ !$0.isDone }).isEmpty && !householdState.tasksLoading {
                ContentUnavailableView("All Caught Up", systemImage: "checkmark.circle", description: Text("No upcoming household tasks."))
            }
        }
        .listStyle(.insetGrouped)
        .refreshable {
            await householdState.loadUpcomingTasks()
        }
        .task {
            if householdState.upcomingTasks.isEmpty {
                await householdState.loadUpcomingTasks()
            }
        }
        .overlay {
            if householdState.tasksLoading && householdState.upcomingTasks.isEmpty {
                ProgressView("Loading tasks...")
            }
        }
        .alert("Skip Task", isPresented: $showSkipAlert, presenting: taskToSkip) { task in
            TextField("Reason (optional)", text: $skipReason)
            Button("Skip") {
                Task {
                    await householdState.skipTask(task, reason: skipReason)
                    skipReason = ""
                    taskToSkip = nil
                }
            }
            Button("Cancel", role: .cancel) {
                skipReason = ""
                taskToSkip = nil
            }
        } message: { task in
            Text("Skip \"\(task.title)\"?")
        }
        .alert("Error", isPresented: .constant(householdState.error != nil)) {
            Button("OK") { householdState.error = nil }
        } message: {
            Text(householdState.error ?? "")
        }
    }
}

// MARK: - Task Row

private struct HouseholdTaskRow: View {
    let task: HouseholdTask
    var isOverdue = false
    let onComplete: () async -> Void
    let onSkip: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: task.category.icon)
                .font(.title3)
                .foregroundStyle(isOverdue ? .red : .secondary)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .font(.subheadline.weight(.medium))
                    .strikethrough(task.isDone)
                    .foregroundStyle(task.isDone ? .secondary : .primary)

                HStack(spacing: 8) {
                    Text(task.category.displayName)
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.secondary.opacity(0.12), in: Capsule())

                    Text(task.dueDate)
                        .font(.caption2)
                        .foregroundStyle(isOverdue ? .red : .secondary)
                }
            }

            Spacer()

            if !task.isDone {
                HStack(spacing: 8) {
                    Button {
                        onSkip()
                    } label: {
                        Image(systemName: "forward.fill")
                            .font(.caption)
                            .foregroundStyle(.orange)
                    }
                    .buttonStyle(.plain)

                    Button {
                        Task { await onComplete() }
                    } label: {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title3)
                            .foregroundStyle(.green)
                    }
                    .buttonStyle(.plain)
                }
            } else if task.isCompleted {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            } else {
                Image(systemName: "forward.fill")
                    .foregroundStyle(.orange)
            }
        }
        .padding(.vertical, 4)
    }
}
