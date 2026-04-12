import SwiftUI

struct MealPlanView: View {
    @ObservedObject var foodState: FoodState
    @Binding var selectedTab: FoodTab

    var body: some View {
        VStack(spacing: 0) {
            weekNavigationHeader

            Group {
                if foodState.mealPlanLoading {
                    ProgressView("Loading meal plan...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let plan = foodState.currentMealPlan {
                    MealPlanContentView(plan: plan, foodState: foodState, selectedTab: $selectedTab)
                } else {
                    emptyMealPlanState
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .task {
            await foodState.loadCurrentMealPlan()
        }
        .refreshable {
            await foodState.loadMealPlanForWeek(foodState.displayedWeekStart)
        }
    }

    // MARK: - Week Navigation

    private var weekNavigationHeader: some View {
        HStack(spacing: 12) {
            Button {
                Task { await foodState.navigateWeek(offset: -1) }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.body.weight(.semibold))
            }

            Spacer()

            Text(weekRangeLabel)
                .font(.subheadline.weight(.medium))

            Spacer()

            Button {
                Task { await foodState.navigateWeek(offset: 1) }
            } label: {
                Image(systemName: "chevron.right")
                    .font(.body.weight(.semibold))
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    private var weekRangeLabel: String {
        let start = foodState.displayedWeekStart
        guard let end = Calendar.current.date(byAdding: .day, value: 6, to: start) else {
            return formatShortDate(start)
        }
        return "\(formatShortDate(start)) – \(formatShortDate(end))"
    }

    private func formatShortDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: date)
    }

    // MARK: - Empty State

    private var emptyMealPlanState: some View {
        ContentUnavailableView {
            Label("No Meal Plan", systemImage: "calendar.badge.plus")
        } description: {
            Text("No meal plan for this week. Create one or browse recipes to get started.")
        } actions: {
            Button("Create plan for this week") {
                Task { await foodState.createWeekMealPlan(for: foodState.displayedWeekStart) }
            }
            .buttonStyle(.borderedProminent)

            Button("Browse recipes") {
                selectedTab = .recipes
            }
            .buttonStyle(.bordered)
        }
    }
}

// MARK: - Helpers

private func mealPlanDayKey(for scheduledDate: String) -> String {
    if let t = scheduledDate.firstIndex(of: "T") {
        return String(scheduledDate[..<t])
    }
    return String(scheduledDate.prefix(10))
}

private let mealTypeSortOrder: [MealType: Int] = [
    .breakfast: 0, .lunch: 1, .dinner: 2, .snack: 3
]

// MARK: - Content View

private struct MealPlanContentView: View {
    let plan: MealPlan
    @ObservedObject var foodState: FoodState
    @Binding var selectedTab: FoodTab

    private var mealsByDay: [(String, [IndexedMeal])] {
        let indexed = plan.meals.enumerated().map { IndexedMeal(index: $0.offset, meal: $0.element) }
        let grouped = Dictionary(grouping: indexed) { mealPlanDayKey(for: $0.meal.scheduledDate) }
        return grouped
            .sorted { $0.key < $1.key }
            .map { day, meals in
                let sorted = meals.sorted { a, b in
                    (mealTypeSortOrder[a.meal.mealType] ?? 9) < (mealTypeSortOrder[b.meal.mealType] ?? 9)
                }
                return (day, sorted)
            }
    }

    private var isPastWeek: Bool {
        let currentMonday = FoodState.mealPlanWeekStart(for: Date())
        guard let planMonday = FoodState.calendarDateFromPlanString(plan.weekStartDate) else { return false }
        return planMonday < Calendar.current.date(byAdding: .day, value: -6, to: currentMonday) ?? currentMonday
    }

    var body: some View {
        ZStack {
            List {
                if isPastWeek {
                    HStack(spacing: 8) {
                        Image(systemName: "clock.arrow.circlepath")
                        Text("This plan is from a past week.")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .listRowBackground(Color.secondary.opacity(0.08))
                }

                Section {
                    HStack {
                        Spacer()
                        MealPlanStatusBadge(status: plan.status)
                    }

                    statusActionButtons

                    if !plan.meals.isEmpty, plan.status != .complete {
                        Button {
                            Task { await foodState.generateGroceryList(mealPlanId: plan.id) }
                        } label: {
                            Label("Generate Grocery List", systemImage: "cart.badge.plus")
                                .appActionLabelStyle()
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(foodState.groceryLoading)
                    }
                }

                ForEach(mealsByDay, id: \.0) { day, indexedMeals in
                    DaySection(
                        date: day,
                        indexedMeals: indexedMeals,
                        planId: plan.id,
                        isReadOnly: plan.status == .complete,
                        foodState: foodState
                    )
                }
            }
            .listStyle(.insetGrouped)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        selectedTab = .recipes
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }

            if foodState.groceryLoading {
                Color.black.opacity(0.15)
                    .ignoresSafeArea()
                ProgressView("Updating grocery list…")
                    .padding(20)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    @ViewBuilder
    private var statusActionButtons: some View {
        switch plan.status {
        case .proposed:
            Button {
                Task { await foodState.updateMealPlanStatus(id: plan.id, status: .confirmed) }
            } label: {
                Label("Confirm plan", systemImage: "checkmark.circle")
                    .appActionLabelStyle()
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        case .confirmed:
            EmptyView()
        case .shopping:
            Button {
                Task { await foodState.updateMealPlanStatus(id: plan.id, status: .complete) }
            } label: {
                Label("Mark complete", systemImage: "checkmark.seal")
                    .appActionLabelStyle()
                    .frame(maxWidth: .infinity)
            }
            .tint(.green)
            .buttonStyle(.bordered)
        case .complete:
            EmptyView()
        }
    }
}

// MARK: - IndexedMeal

private struct IndexedMeal: Identifiable {
    let index: Int
    let meal: Meal
    var id: String { "\(index)-\(meal.id)" }
}

// MARK: - Day Section

private struct DaySection: View {
    let date: String
    let indexedMeals: [IndexedMeal]
    let planId: String
    let isReadOnly: Bool
    @ObservedObject var foodState: FoodState

    private var formattedDate: String {
        let input = DateFormatter()
        input.dateFormat = "yyyy-MM-dd"
        input.locale = Locale(identifier: "en_US_POSIX")
        guard let d = input.date(from: date) else { return date }
        let output = DateFormatter()
        output.dateFormat = "EEEE, MMM d"
        return output.string(from: d)
    }

    private var dayNutritionSummary: (cal: Int, protein: Int, carbs: Int, fat: Int)? {
        let meals = indexedMeals.map(\.meal)
        let hasNutrition = meals.contains { $0.caloriesPerServing != nil }
        guard hasNutrition else { return nil }
        var cal = 0, protein = 0, carbs = 0, fat = 0
        for m in meals {
            let s = m.servings
            cal += (m.caloriesPerServing ?? 0) * s
            protein += (m.proteinPerServing ?? 0) * s
            carbs += (m.carbsPerServing ?? 0) * s
            fat += (m.fatPerServing ?? 0) * s
        }
        return (cal, protein, carbs, fat)
    }

    var body: some View {
        Section {
            ForEach(indexedMeals) { im in
                NavigationLink(value: FoodNavDestination.recipeDetailFromMealPlan(
                    recipeId: im.meal.recipeId,
                    planId: planId,
                    mealIndex: im.index,
                    currentServings: im.meal.servings
                )) {
                    MealRow(meal: im.meal)
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    if !isReadOnly {
                        Button(role: .destructive) {
                            Task { await foodState.removeMealFromPlan(planId: planId, mealIndex: im.index) }
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                }
            }
        } header: {
            VStack(alignment: .leading, spacing: 4) {
                Text(formattedDate)
                if let n = dayNutritionSummary {
                    HStack(spacing: 10) {
                        Text("\(n.cal) cal")
                        Text("\(n.protein)g P")
                        Text("\(n.carbs)g C")
                        Text("\(n.fat)g F")
                    }
                    .font(.caption2)
                }
            }
        }
    }
}

// MARK: - Meal Row

private struct MealRow: View {
    let meal: Meal

    var body: some View {
        HStack(spacing: 12) {
            if let urlStr = meal.recipeImageUrl, let url = URL(string: urlStr) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().aspectRatio(contentMode: .fill)
                    default:
                        imagePlaceholder
                    }
                }
                .frame(width: 44, height: 44)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            } else {
                imagePlaceholder
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(meal.recipeName ?? meal.mealType.displayName)
                    .font(.subheadline.weight(.medium))
                    .lineLimit(1)
                HStack(spacing: 6) {
                    Text(meal.mealType.displayName)
                        .foregroundStyle(.secondary)
                    if let cps = meal.caloriesPerServing {
                        Text("·")
                            .foregroundStyle(.tertiary)
                        Text("\(cps) cal")
                            .foregroundStyle(.secondary)
                    }
                    Text("·")
                        .foregroundStyle(.tertiary)
                    Text("\(meal.servings) srv")
                        .foregroundStyle(.secondary)
                }
                .font(.caption)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(meal.recipeName ?? meal.mealType.displayName), \(meal.servings) servings")
    }

    private var imagePlaceholder: some View {
        Image(systemName: "photo")
            .font(.body)
            .foregroundStyle(.tertiary)
            .frame(width: 44, height: 44)
            .background(Color.secondary.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - Status Badge

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
