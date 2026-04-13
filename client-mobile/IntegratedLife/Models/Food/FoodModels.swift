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

    var icon: String {
        switch self {
        case .barcode: return "barcode"
        case .photo: return "camera"
        case .manual: return "square.and.pencil"
        case .recipe: return "book"
        }
    }
}

// MARK: - Core Objects

struct Nutrition: Codable, Equatable {
    // Basic macros
    let calories: Double
    let protein: Double // grams
    let carbs: Double // grams
    let fat: Double // grams
    let fiber: Double // grams

    // Expanded macros
    var sugar: Double? // grams
    var water: Double? // mL

    // Fat breakdown
    var saturatedFat: Double? // grams
    var monounsaturatedFat: Double? // grams
    var polyunsaturatedFat: Double? // grams
    var cholesterol: Double? // mg
    var transFat: Double? // grams

    // Vitamins
    var vitaminA: Double? // mcg
    var vitaminB6: Double? // mg
    var vitaminB12: Double? // mcg
    var vitaminC: Double? // mg
    var vitaminD: Double? // mcg
    var vitaminE: Double? // mg
    var vitaminK: Double? // mcg
    var thiamin: Double? // mg (B1)
    var riboflavin: Double? // mg (B2)
    var niacin: Double? // mg (B3)
    var folate: Double? // mcg
    var pantothenicAcid: Double? // mg (B5)
    var biotin: Double? // mcg

    // Minerals
    var calcium: Double? // mg
    var iron: Double? // mg
    var magnesium: Double? // mg
    var manganese: Double? // mg
    var phosphorus: Double? // mg
    var potassium: Double? // mg
    var zinc: Double? // mg
    var selenium: Double? // mcg
    var copper: Double? // mg
    var chromium: Double? // mcg
    var molybdenum: Double? // mcg
    var chloride: Double? // mg
    var iodine: Double? // mcg
    var sodium: Double? // mg

    // Other
    var caffeine: Double? // mg

    func scaled(by factor: Double) -> Nutrition {
        Nutrition(
            calories: calories * factor,
            protein: protein * factor,
            carbs: carbs * factor,
            fat: fat * factor,
            fiber: fiber * factor,
            sugar: sugar.map { $0 * factor },
            water: water.map { $0 * factor },
            saturatedFat: saturatedFat.map { $0 * factor },
            monounsaturatedFat: monounsaturatedFat.map { $0 * factor },
            polyunsaturatedFat: polyunsaturatedFat.map { $0 * factor },
            cholesterol: cholesterol.map { $0 * factor },
            transFat: transFat.map { $0 * factor },
            vitaminA: vitaminA.map { $0 * factor },
            vitaminB6: vitaminB6.map { $0 * factor },
            vitaminB12: vitaminB12.map { $0 * factor },
            vitaminC: vitaminC.map { $0 * factor },
            vitaminD: vitaminD.map { $0 * factor },
            vitaminE: vitaminE.map { $0 * factor },
            vitaminK: vitaminK.map { $0 * factor },
            thiamin: thiamin.map { $0 * factor },
            riboflavin: riboflavin.map { $0 * factor },
            niacin: niacin.map { $0 * factor },
            folate: folate.map { $0 * factor },
            pantothenicAcid: pantothenicAcid.map { $0 * factor },
            biotin: biotin.map { $0 * factor },
            calcium: calcium.map { $0 * factor },
            iron: iron.map { $0 * factor },
            magnesium: magnesium.map { $0 * factor },
            manganese: manganese.map { $0 * factor },
            phosphorus: phosphorus.map { $0 * factor },
            potassium: potassium.map { $0 * factor },
            zinc: zinc.map { $0 * factor },
            selenium: selenium.map { $0 * factor },
            copper: copper.map { $0 * factor },
            chromium: chromium.map { $0 * factor },
            molybdenum: molybdenum.map { $0 * factor },
            chloride: chloride.map { $0 * factor },
            iodine: iodine.map { $0 * factor },
            sodium: sodium.map { $0 * factor },
            caffeine: caffeine.map { $0 * factor }
        )
    }
}

struct Ingredient: Codable, Identifiable, Equatable {
    var id: String { "\(name)-\(quantity)-\(unit)" }
    var name: String
    var quantity: Double
    var unit: String
    var category: IngredientCategory
}

// MARK: - Recipe Image

struct RecipeImage: Codable, Identifiable, Equatable {
    var id: String { url }
    let url: String
    let caption: String?
    let order: Int
}

// MARK: - Recipe

struct Recipe: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    let name: String
    let description: String?
    let imageUrl: String? // DEPRECATED: Use images array
    let images: [RecipeImage]
    let servings: Int
    let prepTime: Int
    let cookTime: Int
    let ingredients: [Ingredient]
    let instructions: [String]
    let tags: [String]
    let nutritionPerServing: Nutrition
    let variantGroupId: String?
    let isVariantPrimary: Bool?

    var totalTime: Int { prepTime + cookTime }

    var totalTimeFormatted: String {
        let total = totalTime
        if total < 60 { return "\(total)m" }
        let h = total / 60
        let m = total % 60
        return m > 0 ? "\(h)h \(m)m" : "\(h)h"
    }
    
    // Helper to get primary image (first image or legacy imageUrl)
    var primaryImage: String? {
        images.first?.url ?? imageUrl
    }
    
    // Coding keys for backward compatibility
    enum CodingKeys: String, CodingKey {
        case id, userId, name, description, imageUrl, images
        case servings, prepTime, cookTime, ingredients, instructions, tags
        case nutritionPerServing, variantGroupId, isVariantPrimary
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        userId = try container.decode(String.self, forKey: .userId)
        name = try container.decode(String.self, forKey: .name)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        imageUrl = try container.decodeIfPresent(String.self, forKey: .imageUrl)
        servings = try container.decode(Int.self, forKey: .servings)
        prepTime = try container.decode(Int.self, forKey: .prepTime)
        cookTime = try container.decode(Int.self, forKey: .cookTime)
        ingredients = try container.decode([Ingredient].self, forKey: .ingredients)
        instructions = try container.decode([String].self, forKey: .instructions)
        tags = try container.decode([String].self, forKey: .tags)
        nutritionPerServing = try container.decode(Nutrition.self, forKey: .nutritionPerServing)
        variantGroupId = try container.decodeIfPresent(String.self, forKey: .variantGroupId)
        isVariantPrimary = try container.decodeIfPresent(Bool.self, forKey: .isVariantPrimary)
        
        // Handle images array with migration fallback
        if let decodedImages = try? container.decode([RecipeImage].self, forKey: .images), !decodedImages.isEmpty {
            images = decodedImages
        } else if let legacyUrl = imageUrl {
            images = [RecipeImage(url: legacyUrl, caption: nil, order: 0)]
        } else {
            images = []
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(userId, forKey: .userId)
        try container.encode(name, forKey: .name)
        try container.encodeIfPresent(description, forKey: .description)
        try container.encodeIfPresent(imageUrl, forKey: .imageUrl)
        try container.encode(images, forKey: .images)
        try container.encode(servings, forKey: .servings)
        try container.encode(prepTime, forKey: .prepTime)
        try container.encode(cookTime, forKey: .cookTime)
        try container.encode(ingredients, forKey: .ingredients)
        try container.encode(instructions, forKey: .instructions)
        try container.encode(tags, forKey: .tags)
        try container.encode(nutritionPerServing, forKey: .nutritionPerServing)
        try container.encodeIfPresent(variantGroupId, forKey: .variantGroupId)
        try container.encodeIfPresent(isVariantPrimary, forKey: .isVariantPrimary)
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
    var servings: Int
    var recipeName: String?
    var recipeImageUrl: String?
    var caloriesPerServing: Int?
    var proteinPerServing: Int?
    var carbsPerServing: Int?
    var fatPerServing: Int?
}

struct MealPlan: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    let weekStartDate: String
    var meals: [Meal]
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

// MARK: - Meal Plan Cook Time

struct MealPlanCookTime: Codable, Equatable {
    let totalMinutes: Int
    let byDay: [DayCookTime]
}

struct DayCookTime: Codable, Equatable {
    let date: String
    let minutes: Int
    let meals: Int
}

// MARK: - Grocery List

struct GroceryItem: Codable, Identifiable, Equatable {
    var id: String { "\(ingredient.name)-\(ingredient.unit)" }
    var ingredient: Ingredient
    var checked: Bool
    var notes: String?
}

struct GroceryList: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    let mealPlanId: String?
    var items: [GroceryItem]
    let status: GroceryListStatus
}

/// Body for `POST /v1/food/grocery-lists/add-items`
struct AddGroceryItemPayload: Encodable, Equatable {
    let name: String
    let quantity: Double
    let unit: String
    let category: String
}

struct AddGroceryItemsRequestBody: Encodable {
    let items: [AddGroceryItemPayload]
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
    let itemCount: Int
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
    var writtenToHealthKit: Bool?

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
