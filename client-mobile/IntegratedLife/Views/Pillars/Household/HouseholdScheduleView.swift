import SwiftUI

struct HouseholdScheduleView: View {
    @ObservedObject var householdState: HouseholdState

    @State private var selectedDate = Date()
    @State private var selectedMonth = Date()

    private let calendar = Calendar.current

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Month navigation
                HStack {
                    Button {
                        navigateMonth(by: -1)
                    } label: {
                        Image(systemName: "chevron.left")
                    }

                    Spacer()

                    Text(monthYearString(from: selectedMonth))
                        .font(.headline)

                    Spacer()

                    Button {
                        navigateMonth(by: 1)
                    } label: {
                        Image(systemName: "chevron.right")
                    }
                }
                .padding(.horizontal)

                // Calendar grid
                CalendarGridView(
                    month: selectedMonth,
                    selectedDate: $selectedDate,
                    tasks: householdState.allTasks
                )
                .padding(.horizontal)

                // Frequency legend
                HStack(spacing: 16) {
                    ForEach(MaintenanceFrequency.allCases) { freq in
                        HStack(spacing: 4) {
                            Circle()
                                .fill(frequencyColor(freq))
                                .frame(width: 8, height: 8)
                            Text(freq.displayName)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.horizontal)

                Divider()

                // Tasks for selected date
                let dateTasks = tasksForDate(selectedDate)
                if dateTasks.isEmpty {
                    Text("No tasks on this date")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .padding(.top, 20)
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(dateString(from: selectedDate))
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal)

                        ForEach(dateTasks) { task in
                            ScheduleTaskRow(task: task)
                                .padding(.horizontal)
                        }
                    }
                }

                Spacer(minLength: 20)
            }
            .padding(.top)
        }
        .task {
            if householdState.allTasks.isEmpty {
                await householdState.loadAllTasks()
            }
        }
    }

    private func navigateMonth(by offset: Int) {
        guard let next = calendar.date(byAdding: .month, value: offset, to: selectedMonth) else { return }
        selectedMonth = next
    }

    private func tasksForDate(_ date: Date) -> [HouseholdTask] {
        let dateStr = dateString(from: date)
        return householdState.allTasks.filter { $0.dueDate == dateStr }
    }

    private func monthYearString(from date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "MMMM yyyy"
        return f.string(from: date)
    }

    private func dateString(from date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.string(from: date)
    }

    private func frequencyColor(_ freq: MaintenanceFrequency) -> Color {
        switch freq {
        case .monthly: return .green
        case .quarterly: return .blue
        case .biannual: return .orange
        case .annual: return .purple
        }
    }
}

// MARK: - Calendar Grid

private struct CalendarGridView: View {
    let month: Date
    @Binding var selectedDate: Date

    let tasks: [HouseholdTask]

    private let calendar = Calendar.current
    private let weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

    var body: some View {
        let days = daysInMonth()

        VStack(spacing: 8) {
            // Weekday headers
            HStack {
                ForEach(weekdays, id: \.self) { day in
                    Text(day)
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }

            // Day grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 6) {
                ForEach(days, id: \.self) { date in
                    if let date {
                        DayCellView(
                            date: date,
                            isSelected: calendar.isDate(date, inSameDayAs: selectedDate),
                            isToday: calendar.isDateInToday(date),
                            taskCount: tasksOnDate(date)
                        )
                        .onTapGesture { selectedDate = date }
                    } else {
                        Text("")
                            .frame(height: 36)
                    }
                }
            }
        }
    }

    private func daysInMonth() -> [Date?] {
        let range = calendar.range(of: .day, in: .month, for: month)!
        let firstDay = calendar.date(from: calendar.dateComponents([.year, .month], from: month))!
        let weekday = calendar.component(.weekday, from: firstDay)
        let leadingBlanks = weekday - 1

        var days: [Date?] = Array(repeating: nil, count: leadingBlanks)
        for day in range {
            if let date = calendar.date(bySetting: .day, value: day, of: firstDay) {
                days.append(date)
            }
        }
        return days
    }

    private func tasksOnDate(_ date: Date) -> Int {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        let dateStr = f.string(from: date)
        return tasks.filter { $0.dueDate == dateStr }.count
    }
}

private struct DayCellView: View {
    let date: Date
    let isSelected: Bool
    let isToday: Bool
    let taskCount: Int

    var body: some View {
        VStack(spacing: 2) {
            Text("\(Calendar.current.component(.day, from: date))")
                .font(.subheadline)
                .fontWeight(isToday ? .bold : .regular)
                .foregroundStyle(isSelected ? .white : isToday ? .blue : .primary)

            if taskCount > 0 {
                HStack(spacing: 2) {
                    ForEach(0..<min(taskCount, 3), id: \.self) { _ in
                        Circle()
                            .fill(isSelected ? .white : .blue)
                            .frame(width: 4, height: 4)
                    }
                }
            }
        }
        .frame(height: 36)
        .frame(maxWidth: .infinity)
        .background(isSelected ? Color.blue : Color.clear, in: RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - Schedule Task Row

private struct ScheduleTaskRow: View {
    let task: HouseholdTask

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: task.category.icon)
                .foregroundStyle(.secondary)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(task.title)
                    .font(.subheadline)
                    .strikethrough(task.isDone)
                Text(task.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer()

            if task.isDone {
                Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "forward.fill")
                    .foregroundStyle(task.isCompleted ? .green : .orange)
            }
        }
        .padding(.vertical, 6)
        .padding(.horizontal, 12)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
    }
}
