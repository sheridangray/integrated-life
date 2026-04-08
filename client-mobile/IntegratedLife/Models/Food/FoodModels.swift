import Foundation

// MARK: - Enums

enum MealType: String, Codable, CaseIterable, Identifiable {
    case breakfast, lunch, dinner, snack
    var id: String { rawValue }

    var displayName: String { rawValue.capitalized }

    var icon: String {
        switch self {
        case .breakfast: return "sunrise"
        case .lunch: return "sun.max"
        case .dinner: return "moon.stars"
        case .snack: return "leaf"
        }
    }
}

enum IngredientCategory: String, Codable, CaseIterable {
    case produce, meat, seafood, dairy, bakery, pantry, frozen, beverages, other
    var displayName: String { rawValue.capitalized }
}

enum MealPlanStatus: String, Codable {
    case proposed, confirmed, shopping, complete

    var displayName: String { rawValue.capitalized }

    var color: String {
        switch self {
        case .proposed: return "gray"
        case .confirmed: return "blue"
        case .shopping: return "orange"
        case .complete: return "green"
        }
    }
}

enum GroceryListStatus: String, Codable {
    case draft, ordered, complete
    var displayName: String { rawValue.capitalized }
}

enum FoodLogSource: String, Codable {
    case barcode, photo, manual, recipe
    var displayName: String { rawValue.capitalized }
}

enum Store: String, Codable, CaseIterable, Identifiable {
    case costco, safeway, other
    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .costco: return "Costco"
        case .safeway: return "Safeway"
        case .other: return "Other"
        }
    }

    var icon: String {
        switch self {
        case .costco: return "building.2"
        case .safeway: return "cart"
        case .other: return "bag"
        }
    }
}

// MARK: - Core Objects

struct Nutrition: Codable, Equatable {
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
    let fiber: Double
}

struct Ingredient: Codable, Identifiable, Equatable {
    var id: String { "\(name)-\(quantity)-\(unit)" }
    let name: String
    let quantity: Double
    let unit: String
    let category: IngredientCategory
}

// MARK: - Recipe

struct Recipe: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    let name: String
    let description: String?
    let servings: Int
    let prepTime: Int
    let cookTime: Int
    let ingredients: [Ingredient]
    let instructions: [String]
    let tags: [String]
    let nutritionPerServing: Nutrition

    var totalTime: Int { prepTime + cookTime }

    var totalTimeFormatted: String {
        let total = totalTime
        if total < 60 { return "\(total)m" }
        let h = total / 60
        let m = total % 60
        return m > 0 ? "\(h)h \(m)m" : "\(h)h"
    }
}

struct CreateRecipeRequest: Encodable {
    let name: String
    let description: String?
    let servings: Int
    let prepTime: Int
    let cookTime: Int
    let ingredients: [Ingredient]
    let instructions: [String]
    let tags: [String]
    let nutritionPerServing: Nutrition
}

struct UpdateRecipeRequest: Encodable {
    var name: String?
    var description: String?
    var servings: Int?
    var prepTime: Int?
    var cookTime: Int?
    var ingredients: [Ingredient]?
    var instructions: [String]?
    var tags: [String]?
    var nutritionPerServing: Nutrition?
}

// MARK: - Meal Plan

struct Meal: Codable, Identifiable, Equatable {
    var id: String { "\(recipeId)-\(scheduledDate)-\(mealType.rawValue)" }
    let recipeId: String
    let scheduledDate: String
    let mealType: MealType
    let servings: Int
}

struct MealPlan: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    let weekStartDate: String
    let meals: [Meal]
    let status: MealPlanStatus
}

struct CreateMealPlanRequest: Encodable {
    let weekStartDate: String
    let meals: [Meal]
    let status: MealPlanStatus
}

struct UpdateMealPlanRequest: Encodable {
    var meals: [Meal]?
    var status: MealPlanStatus?
}

// MARK: - Grocery List

struct GroceryItem: Codable, Identifiable, Equatable {
    var id: String { "\(ingredient.name)-\(store.rawValue)" }
    let ingredient: Ingredient
    let store: Store
    var checked: Bool
    let notes: String?
}

struct GroceryList: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    let mealPlanId: String
    var items: [GroceryItem]
    let status: GroceryListStatus
}

struct GenerateGroceryListRequest: Encodable {
    let mealPlanId: String
}

struct UpdateGroceryListRequest: Encodable {
    var items: [GroceryItem]?
    var status: GroceryListStatus?
}

struct ShoppingResponse: Codable {
    let groceryListId: String
    let status: String
    let stores: [String: StoreItems]

    struct StoreItems: Codable {
        let items: [GroceryItem]
        let count: Int
    }
}

// MARK: - Food Log

struct Food: Codable, Equatable {
    let name: String
    let brand: String?
    let nutrition: Nutrition
}

struct FoodLogEntry: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    let date: String
    let mealType: MealType
    let source: FoodLogSource
    let food: Food
    let servingSize: String
    let servings: Double
    let notes: String?

    var totalCalories: Double {
        food.nutrition.calories * servings
    }
}

struct CreateFoodLogRequest: Encodable {
    let date: String
    let mealType: MealType
    let food: Food
    let servingSize: String
    let servings: Double
    let notes: String?
}

struct UpdateFoodLogRequest: Encodable {
    var date: String?
    var mealType: MealType?
    var food: Food?
    var servingSize: String?
    var servings: Double?
    var notes: String?
}

struct BarcodeScanRequest: Encodable {
    let barcode: String
    let mealType: MealType?
}

// MARK: - Daily Nutrition

struct DailyNutrition: Codable {
    let date: String
    let totals: Nutrition
    var entries: [FoodLogEntry]
}

// MARK: - Paginated Response

struct PaginatedResponse<T: Codable>: Codable {
    let items: [T]
    let total: Int
    let page: Int
    let limit: Int
    let totalPages: Int
}
