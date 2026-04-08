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
    case groceryListDetail(String)
    case barcodeScanner
    case mealScanner
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
                MealPlanView(foodState: foodState)
            case .recipes:
                RecipeListView(foodState: foodState)
            case .log:
                FoodLogView(foodState: foodState)
            case .grocery:
                GroceryListsView(foodState: foodState)
            }
        }
        .navigationTitle("Food")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: FoodNavDestination.self) { destination in
            switch destination {
            case .recipeDetail(let id):
                RecipeDetailView(recipeId: id, foodState: foodState)
            case .groceryListDetail(let id):
                GroceryListDetailView(groceryListId: id, foodState: foodState)
            case .barcodeScanner:
                BarcodeScannerView(foodState: foodState)
            case .mealScanner:
                MealScannerView(foodState: foodState)
            }
        }
    }
}
