import SwiftUI

enum FoodTab: String, CaseIterable, Identifiable {
    case mealPlan = "Meal Plan"
    case recipes = "Recipes"
    case log = "Log"
    case grocery = "Grocery"

    var id: String { rawValue }
}

enum FoodNavDestination: Hashable {
    case recipeDetail(String)
    case recipeDetailFromMealPlan(recipeId: String, planId: String, mealIndex: Int, currentServings: Int)
    case barcodeScanner
    case mealScanner
    case nutritionDetail(String)
}

struct FoodPillarView: View {
    @ObservedObject var foodState: FoodState

    @State private var selectedTab: FoodTab = .mealPlan

    var body: some View {
        VStack(spacing: 0) {
            Picker("Section", selection: $selectedTab) {
                ForEach(FoodTab.allCases) { tab in
                    Text(tab.rawValue).tag(tab)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 8)

            switch selectedTab {
            case .mealPlan:
                MealPlanView(foodState: foodState, selectedTab: $selectedTab)
            case .recipes:
                RecipeListView(foodState: foodState)
            case .log:
                FoodLogView(foodState: foodState)
            case .grocery:
                GroceryTabView(foodState: foodState)
            }
        }
        .navigationTitle("Food")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
        .navigationDestination(for: FoodNavDestination.self) { destination in
            switch destination {
            case .recipeDetail(let id):
                RecipeDetailView(recipeId: id, foodState: foodState)
            case .recipeDetailFromMealPlan(let recipeId, let planId, let mealIndex, let currentServings):
                RecipeDetailView(
                    recipeId: recipeId,
                    foodState: foodState,
                    showServingsStepper: true,
                    mealPlanId: planId,
                    mealIndex: mealIndex,
                    mealCurrentServings: currentServings
                )
            case .barcodeScanner:
                BarcodeScannerView(foodState: foodState)
            case .mealScanner:
                MealScannerView(foodState: foodState)
            case .nutritionDetail(let entryId):
                if let entry = foodState.dailyNutrition?.entries.first(where: { $0.id == entryId }) {
                    NutritionDetailView(entry: entry)
                }
            }
        }
    }
}
