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
    @Published var selectedRecipe: Recipe?
    @Published var recipesLoading = false

    // MARK: - Meal Plan

    @Published var currentMealPlan: MealPlan?
    @Published var mealPlanLoading = false

    // MARK: - Grocery List

    @Published var groceryLists: [GroceryList] = []
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
        return f
    }()

    // MARK: - Recipe Methods

    func loadRecipes(search: String? = nil, tag: String? = nil) async {
        recipesLoading = true
        error = nil
        defer { recipesLoading = false }
        do {
            let response = try await foodService.fetchRecipes(search: search, tag: tag)
            recipes = response.items
        } catch {
            self.error = error.localizedDescription
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

    // MARK: - Meal Plan Methods

    func loadCurrentMealPlan() async {
        mealPlanLoading = true
        error = nil
        defer { mealPlanLoading = false }
        do {
            currentMealPlan = try await foodService.fetchCurrentMealPlan()
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

    func loadGroceryLists() async {
        groceryLoading = true
        error = nil
        defer { groceryLoading = false }
        do {
            let response = try await foodService.fetchGroceryLists()
            groceryLists = response.items
        } catch {
            self.error = error.localizedDescription
        }
    }

    func loadGroceryList(id: String) async {
        groceryLoading = true
        error = nil
        defer { groceryLoading = false }
        do {
            activeGroceryList = try await foodService.fetchGroceryList(id: id)
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
            groceryLists.insert(list, at: 0)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func toggleGroceryItem(listId: String, itemIndex: Int) async {
        guard var list = activeGroceryList, list.id == listId, itemIndex < list.items.count else { return }
        list.items[itemIndex].checked.toggle()
        activeGroceryList = list
        do {
            activeGroceryList = try await foodService.updateGroceryList(
                id: listId,
                UpdateGroceryListRequest(items: list.items)
            )
        } catch {
            self.error = error.localizedDescription
        }
    }

    func initiateShopping(groceryListId: String) async -> ShoppingResponse? {
        do {
            return try await foodService.initiateShopping(groceryListId: groceryListId)
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
