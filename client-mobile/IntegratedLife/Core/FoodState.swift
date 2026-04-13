import Foundation

@MainActor
final class FoodState: ObservableObject {
    private let foodService = FoodService.shared
    private let healthKitFoodService = HealthKitFoodService.shared

    // MARK: - HealthKit Sync

    @Published var syncToHealthKit = true
    @Published var healthKitWriteError: String?

    // MARK: - Recipes

    @Published var recipes: [Recipe] = []
    @Published var recipeTagFilterOptions: [String] = []
    @Published var selectedRecipe: Recipe?
    @Published var recipesLoading = false

    // MARK: - Meal Plan

    @Published var currentMealPlan: MealPlan?
    @Published var mealPlanCookTime: MealPlanCookTime?
    @Published var mealPlanLoading = false
    @Published var displayedWeekStart: Date = FoodState.mealPlanWeekStart(for: Date())

    // MARK: - Grocery List

    @Published var activeGroceryList: GroceryList?
    @Published var groceryLoading = false

    // MARK: - Food Log

    @Published var dailyNutrition: DailyNutrition?
    @Published var foodLogEntries: [FoodLogEntry] = []
    @Published var foodLogLoading = false

    // MARK: - Shared

    @Published var selectedDate: Date = Calendar.current.startOfDay(for: Date())
    @Published var isLoading = false
    @Published var error: String?

    var selectedDateString: String {
        Self.dateFormatter.string(from: selectedDate)
    }

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone.current
        return f
    }()

    /// Monday-start week boundary in the user's calendar (aligned with server `findCurrentMealPlan` weekday logic).
    static func mealPlanWeekStart(for date: Date) -> Date {
        var cal = Calendar.current
        cal.firstWeekday = 2 // Monday
        let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        return cal.date(from: comps) ?? date
    }

    /// `yyyy-MM-dd` for the Monday of the week containing `date`.
    static func mealPlanWeekMondayString(for date: Date) -> String {
        dateFormatter.string(from: mealPlanWeekStart(for: date))
    }

    static func calendarDateFromPlanString(_ isoLike: String) -> Date? {
        let prefix = String(isoLike.prefix(10))
        return dateFormatter.date(from: prefix)
    }

    var isDisplayingCurrentWeek: Bool {
        let currentMonday = Self.mealPlanWeekStart(for: Date())
        return Calendar.current.isDate(displayedWeekStart, inSameDayAs: currentMonday)
    }

    // MARK: - Recipe Methods

    func loadRecipes(search: String? = nil, tag: String? = nil, maxTotalTimeMinutes: Int? = nil) async {
        recipesLoading = true
        error = nil
        defer { recipesLoading = false }
        do {
            let response = try await foodService.fetchRecipes(
                search: search,
                tag: tag,
                maxTotalTimeMinutes: maxTotalTimeMinutes
            )
            recipes = response.items
        } catch {
            self.error = error.localizedDescription
        }
    }

    func loadRecipeTagFilterOptions() async {
        do {
            recipeTagFilterOptions = try await foodService.fetchRecipeTags()
        } catch {
            recipeTagFilterOptions = []
        }
    }

    func loadRecipe(id: String) async {
        error = nil
        do {
            selectedRecipe = try await foodService.fetchRecipe(id: id)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func deleteRecipe(id: String) async {
        do {
            try await foodService.deleteRecipe(id: id)
            recipes.removeAll { $0.id == id }
            if selectedRecipe?.id == id { selectedRecipe = nil }
        } catch {
            self.error = error.localizedDescription
        }
    }

    @Published var aiRecipeGenerating = false

    func createRecipeFromAI(prompt: String) async -> Recipe? {
        aiRecipeGenerating = true
        error = nil
        defer { aiRecipeGenerating = false }
        do {
            let recipe = try await foodService.createRecipeFromAI(prompt: prompt)
            recipes.insert(recipe, at: 0)
            return recipe
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }

    func editRecipeWithAI(id: String, prompt: String, action: String) async -> Recipe? {
        aiRecipeGenerating = true
        error = nil
        defer { aiRecipeGenerating = false }
        do {
            let recipe = try await foodService.editRecipeWithAI(id: id, prompt: prompt, action: action)
            if action == "overwrite" {
                if let idx = recipes.firstIndex(where: { $0.id == id }) {
                    recipes[idx] = recipe
                }
                if selectedRecipe?.id == id { selectedRecipe = recipe }
            } else {
                recipes.insert(recipe, at: 0)
            }
            return recipe
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }

    // MARK: - Meal Plan Methods

    func loadCurrentMealPlan() async {
        await loadMealPlanForWeek(displayedWeekStart)
    }

    func loadMealPlanForWeek(_ weekStart: Date) async {
        mealPlanLoading = true
        error = nil
        mealPlanCookTime = nil
        defer { mealPlanLoading = false }
        let weekStr = Self.mealPlanWeekMondayString(for: weekStart)
        do {
            let page = try await foodService.fetchMealPlans(weekStartDate: weekStr, page: 1)
            currentMealPlan = page.items.first
        } catch {
            self.error = error.localizedDescription
        }
    }

    func navigateWeek(offset: Int) async {
        guard let next = Calendar.current.date(byAdding: .weekOfYear, value: offset, to: displayedWeekStart) else { return }
        displayedWeekStart = Self.mealPlanWeekStart(for: next)
        await loadMealPlanForWeek(displayedWeekStart)
    }

    func jumpToCurrentWeek() async {
        displayedWeekStart = Self.mealPlanWeekStart(for: Date())
        await loadMealPlanForWeek(displayedWeekStart)
    }

    /// Returns the current meal plan, or `nil` when the API reports there is none for this week (404).
    func fetchCurrentMealPlanAllowingMissing() async throws -> MealPlan? {
        do {
            return try await foodService.fetchCurrentMealPlan()
        } catch {
            if let api = error as? APIError,
               case .serverError(let msg) = api,
               msg.localizedCaseInsensitiveContains("no current meal plan") {
                return nil
            }
            throw error
        }
    }

    /// Adds a meal to the meal plan for the week that contains `scheduledDate`, creating that week's plan if needed.
    func addMealToCurrentWeekPlan(recipeId: String, servings: Int, scheduledDate: Date, mealType: MealType) async -> Bool {
        error = nil
        let cal = Calendar.current
        let dayStart = cal.startOfDay(for: scheduledDate)
        let todayStart = cal.startOfDay(for: Date())
        guard dayStart >= todayStart else {
            self.error = "Choose today or a future date."
            return false
        }

        let dateStr = Self.dateFormatter.string(from: dayStart)
        let weekStart = Self.mealPlanWeekMondayString(for: scheduledDate)

        do {
            let page = try await foodService.fetchMealPlans(weekStartDate: weekStart, page: 1)
            if let plan = page.items.first {
                let dayKey = String(dateStr.prefix(10))
                let isDuplicate = plan.meals.contains { m in
                    m.recipeId == recipeId && String(m.scheduledDate.prefix(10)) == dayKey && m.mealType == mealType
                }
                if isDuplicate {
                    self.error = "This recipe is already planned for \(mealType.displayName) on that day."
                    return false
                }
                let newMeal = Meal(recipeId: recipeId, scheduledDate: dateStr, mealType: mealType, servings: servings)
                var meals = plan.meals
                meals.append(newMeal)
                currentMealPlan = try await foodService.updateMealPlan(
                    id: plan.id,
                    UpdateMealPlanRequest(meals: meals, status: nil)
                )
            } else {
                let newMeal = Meal(recipeId: recipeId, scheduledDate: dateStr, mealType: mealType, servings: servings)
                currentMealPlan = try await foodService.createMealPlan(
                    CreateMealPlanRequest(weekStartDate: weekStart, meals: [newMeal], status: .proposed)
                )
            }
            return true
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func updateMealServings(planId: String, mealIndex: Int, servings: Int) async {
        guard var plan = currentMealPlan, plan.id == planId, mealIndex < plan.meals.count else { return }
        guard plan.meals[mealIndex].servings != servings else { return }
        plan.meals[mealIndex].servings = servings
        currentMealPlan = plan
        do {
            currentMealPlan = try await foodService.updateMealPlan(
                id: planId,
                UpdateMealPlanRequest(meals: plan.meals, status: nil)
            )
        } catch {
            self.error = error.localizedDescription
            await loadMealPlanForWeek(displayedWeekStart)
        }
    }

    func removeMealFromPlan(planId: String, mealIndex: Int) async {
        guard var plan = currentMealPlan, plan.id == planId, mealIndex < plan.meals.count else { return }
        plan.meals.remove(at: mealIndex)
        currentMealPlan = plan
        do {
            currentMealPlan = try await foodService.updateMealPlan(
                id: planId,
                UpdateMealPlanRequest(meals: plan.meals, status: nil)
            )
        } catch {
            self.error = error.localizedDescription
            await loadMealPlanForWeek(displayedWeekStart)
        }
    }

    func createWeekMealPlan(for weekStart: Date) async {
        mealPlanLoading = true
        error = nil
        defer { mealPlanLoading = false }
        do {
            let weekStr = Self.mealPlanWeekMondayString(for: weekStart)
            currentMealPlan = try await foodService.createMealPlan(
                CreateMealPlanRequest(weekStartDate: weekStr, meals: [], status: .proposed)
            )
        } catch {
            self.error = error.localizedDescription
        }
    }

    func clearError() {
        error = nil
    }

    func loadMealPlanCookTime(mealPlanId: String) async {
        do {
            mealPlanCookTime = try await foodService.fetchMealPlanCookTime(mealPlanId: mealPlanId)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func updateMealPlanStatus(id: String, status: MealPlanStatus) async {
        do {
            currentMealPlan = try await foodService.updateMealPlan(id: id, UpdateMealPlanRequest(status: status))
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: - Grocery List Methods

    /// Loads the single evergreen grocery list for the current user.
    func loadMyGroceryList() async {
        groceryLoading = true
        error = nil
        defer { groceryLoading = false }
        do {
            let response = try await foodService.fetchGroceryLists()
            activeGroceryList = response.items.first
        } catch {
            self.error = error.localizedDescription
        }
    }

    func generateGroceryList(mealPlanId: String) async {
        groceryLoading = true
        error = nil
        defer { groceryLoading = false }
        do {
            let list = try await foodService.generateGroceryList(mealPlanId: mealPlanId)
            activeGroceryList = list
        } catch {
            self.error = error.localizedDescription
        }
    }

    /// Merges ingredients into the evergreen grocery list (or creates it). Returns `true` on success.
    func addRecipeIngredientsToGrocery(_ items: [AddGroceryItemPayload]) async -> Bool {
        guard !items.isEmpty else { return false }
        groceryLoading = true
        error = nil
        defer { groceryLoading = false }
        do {
            let list = try await foodService.addGroceryItems(items)
            activeGroceryList = list
            return true
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func toggleGroceryItem(listId: String, itemIndex: Int) async {
        guard var list = activeGroceryList, list.id == listId, itemIndex < list.items.count else { return }
        list.items[itemIndex].checked.toggle()
        activeGroceryList = list
        await persistGroceryListItems(listId: listId, items: list.items)
    }

    func updateGroceryItemQuantity(listId: String, itemIndex: Int, quantity: Double) async {
        let q = min(max(quantity, 0.25), 999)
        guard var list = activeGroceryList, list.id == listId, itemIndex < list.items.count else { return }
        list.items[itemIndex].ingredient.quantity = q
        activeGroceryList = list
        await persistGroceryListItems(listId: listId, items: list.items)
    }

    func removeGroceryItem(listId: String, itemIndex: Int) async {
        guard var list = activeGroceryList, list.id == listId, itemIndex < list.items.count else { return }
        list.items.remove(at: itemIndex)
        activeGroceryList = list
        await persistGroceryListItems(listId: listId, items: list.items)
    }

    func addManualGroceryItem(name: String, quantity: Double, unit: String, category: IngredientCategory = .other) async {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else { return }
        let u = unit.trimmingCharacters(in: .whitespacesAndNewlines)
        let unitOut = u.isEmpty ? "each" : u
        let q = min(max(quantity, 0.25), 999)

        groceryLoading = true
        error = nil
        defer { groceryLoading = false }

        if activeGroceryList == nil {
            await loadMyGroceryList()
        }
        guard var list = activeGroceryList else { return }

        let ingredient = Ingredient(name: trimmedName, quantity: q, unit: unitOut, category: category)
        let newItem = GroceryItem(ingredient: ingredient, checked: false, notes: nil)
        list.items.append(newItem)
        activeGroceryList = list
        await persistGroceryListItems(listId: list.id, items: list.items)
    }

    private func persistGroceryListItems(listId: String, items: [GroceryItem]) async {
        do {
            activeGroceryList = try await foodService.updateGroceryList(
                id: listId,
                UpdateGroceryListRequest(items: items)
            )
        } catch {
            self.error = error.localizedDescription
            await loadMyGroceryList()
        }
    }

    func initiateShopping() async -> ShoppingResponse? {
        guard let groceryListId = activeGroceryList?.id else { return nil }
        let prompt = UserDefaults.standard.string(forKey: "openclaw.instacartPrompt")
        do {
            let response = try await foodService.initiateShopping(groceryListId: groceryListId, customInstructions: prompt)
            await loadMyGroceryList()
            return response
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }

    // MARK: - Food Log Methods

    func loadDailyNutrition() async {
        foodLogLoading = true
        error = nil
        defer { foodLogLoading = false }
        do {
            dailyNutrition = try await foodService.fetchDailyNutrition(date: selectedDateString)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func createFoodLog(mealType: MealType, food: Food, servingSize: String, servings: Double, notes: String? = nil) async {
        do {
            var entry = try await foodService.createFoodLog(CreateFoodLogRequest(
                date: selectedDateString,
                mealType: mealType,
                food: food,
                servingSize: servingSize,
                servings: servings,
                notes: notes
            ))
            await writeToHealthKitIfEnabled(&entry)
            dailyNutrition?.entries.append(entry)
            await loadDailyNutrition()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func scanBarcode(_ barcode: String, mealType: MealType? = nil) async -> FoodLogEntry? {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            var entry = try await foodService.scanBarcode(BarcodeScanRequest(barcode: barcode, mealType: mealType))
            await writeToHealthKitIfEnabled(&entry)
            await loadDailyNutrition()
            return entry
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }

    func scanMealPhoto(imageData: Data, mealType: MealType? = nil) async -> FoodLogEntry? {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            var entry = try await foodService.scanMealPhoto(imageData: imageData, mealType: mealType)
            await writeToHealthKitIfEnabled(&entry)
            await loadDailyNutrition()
            return entry
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }

    /// Write a food log entry to HealthKit if sync is enabled and permissions are granted.
    func syncEntryToHealthKit(_ entry: FoodLogEntry) async {
        var mutableEntry = entry
        await writeToHealthKitIfEnabled(&mutableEntry)
        if let index = dailyNutrition?.entries.firstIndex(where: { $0.id == entry.id }) {
            dailyNutrition?.entries[index] = mutableEntry
        }
    }

    private func writeToHealthKitIfEnabled(_ entry: inout FoodLogEntry) async {
        guard syncToHealthKit, healthKitFoodService.hasWritePermission else { return }
        healthKitWriteError = nil
        do {
            try await healthKitFoodService.writeFoodLogEntry(entry)
            entry.writtenToHealthKit = true
        } catch {
            healthKitWriteError = error.localizedDescription
            entry.writtenToHealthKit = false
        }
    }

    func deleteFoodLog(id: String) async {
        do {
            try await foodService.deleteFoodLog(id: id)
            dailyNutrition?.entries.removeAll { $0.id == id }
            await loadDailyNutrition()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func navigateDay(offset: Int) async {
        guard let next = Calendar.current.date(byAdding: .day, value: offset, to: selectedDate) else { return }
        selectedDate = Calendar.current.startOfDay(for: next)
        await loadDailyNutrition()
    }

    // MARK: - Overview

    /// Load minimum data for the pillar overview card.
    func loadForOverview() async {
        await loadDailyNutrition()
    }
}
