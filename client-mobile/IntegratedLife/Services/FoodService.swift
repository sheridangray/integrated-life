import Foundation

final class FoodService {
    private let api = APIClient.shared
    private let auth = AuthService.shared

    static let shared = FoodService()
    private init() {}

    private func token() async throws -> String {
        try await auth.getValidAccessToken()
    }

    // MARK: - Recipes

    func fetchRecipes(search: String? = nil, tag: String? = nil, page: Int = 1, limit: Int = 20) async throws -> PaginatedResponse<Recipe> {
        var query = "?page=\(page)&limit=\(limit)"
        if let search, !search.isEmpty {
            query += "&search=\(search.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? search)"
        }
        if let tag, !tag.isEmpty {
            query += "&tag=\(tag.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? tag)"
        }
        return try await api.get(
            path: "/v1/food/recipes\(query)",
            token: try await token(),
            as: PaginatedResponse<Recipe>.self
        )
    }

    func fetchRecipe(id: String) async throws -> Recipe {
        try await api.get(
            path: "/v1/food/recipes/\(id)",
            token: try await token(),
            as: Recipe.self
        )
    }

    func createRecipe(_ request: CreateRecipeRequest) async throws -> Recipe {
        try await api.post(
            path: "/v1/food/recipes",
            body: request,
            token: try await token(),
            as: Recipe.self
        )
    }

    func updateRecipe(id: String, _ request: UpdateRecipeRequest) async throws -> Recipe {
        try await api.put(
            path: "/v1/food/recipes/\(id)",
            body: request,
            token: try await token(),
            as: Recipe.self
        )
    }

    func deleteRecipe(id: String) async throws {
        try await api.delete(path: "/v1/food/recipes/\(id)", token: try await token())
    }

    // MARK: - Meal Plans

    func fetchMealPlans(weekStartDate: String? = nil, status: MealPlanStatus? = nil, page: Int = 1) async throws -> PaginatedResponse<MealPlan> {
        var query = "?page=\(page)&limit=20"
        if let weekStartDate {
            query += "&weekStartDate=\(weekStartDate)"
        }
        if let status {
            query += "&status=\(status.rawValue)"
        }
        return try await api.get(
            path: "/v1/food/meal-plans\(query)",
            token: try await token(),
            as: PaginatedResponse<MealPlan>.self
        )
    }

    func fetchCurrentMealPlan() async throws -> MealPlan {
        try await api.get(
            path: "/v1/food/meal-plans/current",
            token: try await token(),
            as: MealPlan.self
        )
    }

    func createMealPlan(_ request: CreateMealPlanRequest) async throws -> MealPlan {
        try await api.post(
            path: "/v1/food/meal-plans",
            body: request,
            token: try await token(),
            as: MealPlan.self
        )
    }

    func updateMealPlan(id: String, _ request: UpdateMealPlanRequest) async throws -> MealPlan {
        try await api.put(
            path: "/v1/food/meal-plans/\(id)",
            body: request,
            token: try await token(),
            as: MealPlan.self
        )
    }

    func deleteMealPlan(id: String) async throws {
        try await api.delete(path: "/v1/food/meal-plans/\(id)", token: try await token())
    }

    // MARK: - Grocery Lists

    func fetchGroceryLists(page: Int = 1) async throws -> PaginatedResponse<GroceryList> {
        try await api.get(
            path: "/v1/food/grocery-lists?page=\(page)&limit=20",
            token: try await token(),
            as: PaginatedResponse<GroceryList>.self
        )
    }

    func fetchGroceryList(id: String) async throws -> GroceryList {
        try await api.get(
            path: "/v1/food/grocery-lists/\(id)",
            token: try await token(),
            as: GroceryList.self
        )
    }

    func generateGroceryList(mealPlanId: String) async throws -> GroceryList {
        try await api.post(
            path: "/v1/food/grocery-lists/generate",
            body: GenerateGroceryListRequest(mealPlanId: mealPlanId),
            token: try await token(),
            as: GroceryList.self
        )
    }

    func updateGroceryList(id: String, _ request: UpdateGroceryListRequest) async throws -> GroceryList {
        try await api.put(
            path: "/v1/food/grocery-lists/\(id)",
            body: request,
            token: try await token(),
            as: GroceryList.self
        )
    }

    func initiateShopping(groceryListId: String) async throws -> ShoppingResponse {
        struct Empty: Encodable {}
        return try await api.post(
            path: "/v1/food/grocery-lists/\(groceryListId)/initiate-shopping",
            body: Empty(),
            token: try await token(),
            as: ShoppingResponse.self
        )
    }

    // MARK: - Food Log

    func fetchFoodLog(startDate: String? = nil, endDate: String? = nil, mealType: MealType? = nil, page: Int = 1) async throws -> PaginatedResponse<FoodLogEntry> {
        var query = "?page=\(page)&limit=20"
        if let startDate { query += "&startDate=\(startDate)" }
        if let endDate { query += "&endDate=\(endDate)" }
        if let mealType { query += "&mealType=\(mealType.rawValue)" }
        return try await api.get(
            path: "/v1/food/log\(query)",
            token: try await token(),
            as: PaginatedResponse<FoodLogEntry>.self
        )
    }

    func fetchDailyNutrition(date: String) async throws -> DailyNutrition {
        try await api.get(
            path: "/v1/food/log/daily/\(date)",
            token: try await token(),
            as: DailyNutrition.self
        )
    }

    func createFoodLog(_ request: CreateFoodLogRequest) async throws -> FoodLogEntry {
        try await api.post(
            path: "/v1/food/log",
            body: request,
            token: try await token(),
            as: FoodLogEntry.self
        )
    }

    func scanBarcode(_ request: BarcodeScanRequest) async throws -> FoodLogEntry {
        try await api.post(
            path: "/v1/food/log/barcode",
            body: request,
            token: try await token(),
            as: FoodLogEntry.self
        )
    }

    /// Upload meal photo for AI nutrition estimation.
    /// Uses multipart/form-data instead of JSON.
    func scanMealPhoto(imageData: Data, mealType: MealType?) async throws -> FoodLogEntry {
        let boundary = UUID().uuidString
        var body = Data()

        // Image field
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"meal.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)

        // Optional mealType field
        if let mealType {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"mealType\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(mealType.rawValue)\r\n".data(using: .utf8)!)
        }

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        guard let url = URL(string: "\(Config.apiBaseURL)/v1/food/log/photo") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(try await token())", forHTTPHeaderField: "Authorization")
        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.serverError("Photo upload failed")
        }

        return try JSONDecoder().decode(FoodLogEntry.self, from: data)
    }

    func updateFoodLog(id: String, _ request: UpdateFoodLogRequest) async throws -> FoodLogEntry {
        try await api.put(
            path: "/v1/food/log/\(id)",
            body: request,
            token: try await token(),
            as: FoodLogEntry.self
        )
    }

    func deleteFoodLog(id: String) async throws {
        try await api.delete(path: "/v1/food/log/\(id)", token: try await token())
    }
}
