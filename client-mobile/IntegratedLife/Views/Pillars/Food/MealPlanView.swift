import SwiftUI

struct MealPlanView: View {
    @ObservedObject var foodState: FoodState

    var body: some View {
        Group {
            if foodState.mealPlanLoading {
                ProgressView("Loading meal plan...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let plan = foodState.currentMealPlan {
                MealPlanContentView(plan: plan, foodState: foodState)
            } else {
                ContentUnavailableView(
                    "No Meal Plan",
                    systemImage: "calendar.badge.plus",
                    description: Text("No meal plan for this week yet.")
                )
            }
        }
        .task {
            await foodState.loadCurrentMealPlan()
        }
    }
}

private struct MealPlanContentView: View {
    let plan: MealPlan
    @ObservedObject var foodState: FoodState

    private var mealsByDay: [(String, [Meal])] {
        let grouped = Dictionary(grouping: plan.meals) { $0.scheduledDate }
        return grouped.sorted { $0.key < $1.key }
    }

    private func cookTimeForDay(_ date: String) -> Int? {
        foodState.mealPlanCookTime?.byDay.first { $0.date == date }?.minutes
    }

    private var totalCookTimeFormatted: String? {
        guard let minutes = foodState.mealPlanCookTime?.totalMinutes, minutes > 0 else { return nil }
        if minutes < 60 { return "\(minutes)m" }
        let h = minutes / 60
        let m = minutes % 60
        return m > 0 ? "\(h)h \(m)m" : "\(h)h"
    }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Status badge
                HStack {
                    Text("Week of \(plan.weekStartDate)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Spacer()
                    MealPlanStatusBadge(status: plan.status)
                }
                .padding(.horizontal)

                // Total cook time
                if let totalTime = totalCookTimeFormatted {
                    HStack {
                        Label("Total Cook Time", systemImage: "clock")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(totalTime)
                            .font(.headline)
                    }
                    .padding(.horizontal)
                }

                // Generate grocery list button
                if plan.status == .confirmed {
                    Button {
                        Task { await foodState.generateGroceryList(mealPlanId: plan.id) }
                    } label: {
                        Label("Generate Grocery List", systemImage: "cart.badge.plus")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .padding(.horizontal)
                }

                // Days
                ForEach(mealsByDay, id: \.0) { day, meals in
                    DaySection(date: day, meals: meals, cookTime: cookTimeForDay(day))
                }
            }
            .padding(.vertical)
        }
        .task {
            await foodState.loadMealPlanCookTime(mealPlanId: plan.id)
        }
    }
}

private struct DaySection: View {
    let date: String
    let meals: [Meal]
    let cookTime: Int?

    private var formattedDate: String {
        let input = DateFormatter()
        input.dateFormat = "yyyy-MM-dd"
        input.locale = Locale(identifier: "en_US_POSIX")
        guard let d = input.date(from: date) else { return date }
        let output = DateFormatter()
        output.dateFormat = "EEEE, MMM d"
        return output.string(from: d)
    }

    private var cookTimeFormatted: String? {
        guard let minutes = cookTime, minutes > 0 else { return nil }
        if minutes < 60 { return "\(minutes)m" }
        let h = minutes / 60
        let m = minutes % 60
        return m > 0 ? "\(h)h \(m)m" : "\(h)h"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(formattedDate)
                    .font(.headline)
                Spacer()
                if let time = cookTimeFormatted {
                    Label(time, systemImage: "clock")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal)

            ForEach(meals) { meal in
                NavigationLink(value: FoodNavDestination.recipeDetail(meal.recipeId)) {
                    MealRow(meal: meal)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

private struct MealRow: View {
    let meal: Meal

    var body: some View {
        HStack {
            Image(systemName: meal.mealType.icon)
                .font(.title3)
                .foregroundStyle(.secondary)
                .frame(width: 32)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(meal.mealType.displayName)
                    .font(.subheadline.weight(.medium))
                Text("\(meal.servings) serving\(meal.servings == 1 ? "" : "s")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
        .padding(.horizontal)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(meal.mealType.displayName), \(meal.servings) servings")
    }
}

private struct MealPlanStatusBadge: View {
    let status: MealPlanStatus

    private var color: Color {
        switch status {
        case .proposed: return .gray
        case .confirmed: return .blue
        case .shopping: return .orange
        case .complete: return .green
        }
    }

    var body: some View {
        Text(status.displayName)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
    }
}
