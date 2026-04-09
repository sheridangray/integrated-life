import SwiftUI

struct RecipeListView: View {
    @ObservedObject var foodState: FoodState
    @State private var searchText = ""

    var body: some View {
        Group {
            if foodState.recipesLoading {
                ProgressView("Loading recipes...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if foodState.recipes.isEmpty {
                ContentUnavailableView.search(text: searchText)
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(foodState.recipes) { recipe in
                            NavigationLink(value: FoodNavDestination.recipeDetail(recipe.id)) {
                                RecipeCardView(recipe: recipe)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                }
            }
        }
        .searchable(text: $searchText, prompt: "Search recipes")
        .task(id: searchText) {
            try? await Task.sleep(for: .milliseconds(300))
            await foodState.loadRecipes(search: searchText.isEmpty ? nil : searchText)
        }
    }
}

private struct RecipeCardView: View {
    let recipe: Recipe

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(recipe.name)
                    .font(.headline)
                Spacer()
                Text(recipe.totalTimeFormatted)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            if let desc = recipe.description {
                Text(desc)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            HStack(spacing: 12) {
                NutritionBadge(label: "Cal", value: "\(Int(recipe.nutritionPerServing.calories))")
                NutritionBadge(label: "P", value: "\(Int(recipe.nutritionPerServing.protein))g")
                NutritionBadge(label: "C", value: "\(Int(recipe.nutritionPerServing.carbs))g")
                NutritionBadge(label: "F", value: "\(Int(recipe.nutritionPerServing.fat))g")
                Spacer()
                Text("\(recipe.servings) serving\(recipe.servings == 1 ? "" : "s")")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            if !recipe.tags.isEmpty {
                RecipeTagFlowLayout(spacing: 4) {
                    ForEach(recipe.tags, id: \.self) { tag in
                        Text(tag)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.secondary.opacity(0.12), in: Capsule())
                    }
                }
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(recipe.name), \(Int(recipe.nutritionPerServing.calories)) calories per serving")
    }
}

struct RecipeDetailView: View {
    let recipeId: String
    @ObservedObject var foodState: FoodState

    var body: some View {
        Group {
            if let recipe = foodState.selectedRecipe, recipe.id == recipeId {
                RecipeDetailContent(recipe: recipe)
            } else if foodState.error != nil {
                ContentUnavailableView("Error", systemImage: "exclamationmark.triangle", description: Text(foodState.error ?? ""))
            } else {
                ProgressView("Loading recipe...")
            }
        }
        .navigationTitle(foodState.selectedRecipe?.name ?? "Recipe")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await foodState.loadRecipe(id: recipeId)
        }
    }
}

private struct RecipeDetailContent: View {
    let recipe: Recipe
    @State private var scaledServings: Int
    @State private var checkedIngredients: Set<String> = []
    @State private var currentStep: Int? = nil

    init(recipe: Recipe) {
        self.recipe = recipe
        _scaledServings = State(initialValue: recipe.servings)
    }

    private var scale: Double {
        Double(scaledServings) / Double(recipe.servings)
    }

    private func scaledQuantity(_ ingredient: Ingredient) -> Double {
        ingredient.quantity * scale
    }

    private func scaledNutrition(_ nutrition: Nutrition) -> Nutrition {
        var scaled = nutrition
        let s = scale
        scaled.calories = nutrition.calories * s
        scaled.protein = nutrition.protein * s
        scaled.carbs = nutrition.carbs * s
        scaled.fat = nutrition.fat * s
        scaled.fiber = nutrition.fiber * s
        scaled.sugar = nutrition.sugar.map { $0 * s }
        scaled.water = nutrition.water.map { $0 * s }
        scaled.saturatedFat = nutrition.saturatedFat.map { $0 * s }
        scaled.monounsaturatedFat = nutrition.monounsaturatedFat.map { $0 * s }
        scaled.polyunsaturatedFat = nutrition.polyunsaturatedFat.map { $0 * s }
        scaled.cholesterol = nutrition.cholesterol.map { $0 * s }
        scaled.transFat = nutrition.transFat.map { $0 * s }
        scaled.vitaminA = nutrition.vitaminA.map { $0 * s }
        scaled.vitaminB6 = nutrition.vitaminB6.map { $0 * s }
        scaled.vitaminB12 = nutrition.vitaminB12.map { $0 * s }
        scaled.vitaminC = nutrition.vitaminC.map { $0 * s }
        scaled.vitaminD = nutrition.vitaminD.map { $0 * s }
        scaled.vitaminE = nutrition.vitaminE.map { $0 * s }
        scaled.vitaminK = nutrition.vitaminK.map { $0 * s }
        scaled.thiamin = nutrition.thiamin.map { $0 * s }
        scaled.riboflavin = nutrition.riboflavin.map { $0 * s }
        scaled.niacin = nutrition.niacin.map { $0 * s }
        scaled.folate = nutrition.folate.map { $0 * s }
        scaled.pantothenicAcid = nutrition.pantothenicAcid.map { $0 * s }
        scaled.biotin = nutrition.biotin.map { $0 * s }
        scaled.calcium = nutrition.calcium.map { $0 * s }
        scaled.iron = nutrition.iron.map { $0 * s }
        scaled.magnesium = nutrition.magnesium.map { $0 * s }
        scaled.manganese = nutrition.manganese.map { $0 * s }
        scaled.phosphorus = nutrition.phosphorus.map { $0 * s }
        scaled.potassium = nutrition.potassium.map { $0 * s }
        scaled.zinc = nutrition.zinc.map { $0 * s }
        scaled.selenium = nutrition.selenium.map { $0 * s }
        scaled.copper = nutrition.copper.map { $0 * s }
        scaled.chromium = nutrition.chromium.map { $0 * s }
        scaled.molybdenum = nutrition.molybdenum.map { $0 * s }
        scaled.chloride = nutrition.chloride.map { $0 * s }
        scaled.iodine = nutrition.iodine.map { $0 * s }
        scaled.sodium = nutrition.sodium.map { $0 * s }
        scaled.caffeine = nutrition.caffeine.map { $0 * s }
        return scaled
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header info
                VStack(alignment: .leading, spacing: 8) {
                    if let desc = recipe.description {
                        Text(desc)
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }
                    HStack(spacing: 16) {
                        Label("\(recipe.prepTime)m prep", systemImage: "clock")
                        Label("\(recipe.cookTime)m cook", systemImage: "flame")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }

                // Serving Scaler
                VStack(alignment: .leading, spacing: 8) {
                    Text("Servings")
                        .font(.headline)
                    HStack(spacing: 16) {
                        Button {
                            if scaledServings > 1 { scaledServings -= 1 }
                        } label: {
                            Image(systemName: "minus.circle")
                        }
                        .disabled(scaledServings <= 1)

                        Text("\(scaledServings)")
                            .font(.title2.weight(.semibold))
                            .frame(minWidth: 40)

                        Button {
                            scaledServings += 1
                        } label: {
                            Image(systemName: "plus.circle")
                        }
                    }
                    .font(.title2)
                    if scaledServings != recipe.servings {
                        Text("(original: \(recipe.servings))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                // Nutrition per serving (scaled)
                VStack(alignment: .leading, spacing: 8) {
                    Text("Nutrition")
                        .font(.headline)
                    if scaledServings != recipe.servings {
                        Text("Total for \(scaledServings) servings")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    let nutrition = scaledServings == recipe.servings
                        ? recipe.nutritionPerServing
                        : scaledNutrition(recipe.nutritionPerServing)
                    HStack(spacing: 16) {
                        MacroColumn(label: "Calories", value: "\(Int(nutrition.calories))", color: .orange)
                        MacroColumn(label: "Protein", value: "\(Int(nutrition.protein))g", color: .red)
                        MacroColumn(label: "Carbs", value: "\(Int(nutrition.carbs))g", color: .blue)
                        MacroColumn(label: "Fat", value: "\(Int(nutrition.fat))g", color: .yellow)
                        MacroColumn(label: "Fiber", value: "\(Int(nutrition.fiber))g", color: .green)
                    }
                }

                // Ingredients with checkboxes
                VStack(alignment: .leading, spacing: 8) {
                    Text("Ingredients")
                        .font(.headline)
                    ForEach(recipe.ingredients) { ingredient in
                        Button {
                            if checkedIngredients.contains(ingredient.id) {
                                checkedIngredients.remove(ingredient.id)
                            } else {
                                checkedIngredients.insert(ingredient.id)
                            }
                        } label: {
                            HStack {
                                Image(systemName: checkedIngredients.contains(ingredient.id) ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(checkedIngredients.contains(ingredient.id) ? .green : .secondary)
                                    .font(.title3)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("\(scaledQuantity(ingredient), specifier: scaledQuantity(ingredient) == scaledQuantity(ingredient).rounded() ? "%.0f" : "%.1f") \(ingredient.unit) \(ingredient.name)")
                                        .strikethrough(checkedIngredients.contains(ingredient.id))
                                        .foregroundStyle(checkedIngredients.contains(ingredient.id) ? .secondary : .primary)
                                }
                                Spacer()
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }

                // Instructions with step highlighting
                VStack(alignment: .leading, spacing: 8) {
                    Text("Instructions")
                        .font(.headline)
                    ForEach(Array(recipe.instructions.enumerated()), id: \.offset) { index, step in
                        Button {
                            currentStep = currentStep == index ? nil : index
                        } label: {
                            HStack(alignment: .top, spacing: 12) {
                                Text("\(index + 1)")
                                    .font(.caption.weight(.bold))
                                    .frame(width: 24, height: 24)
                                    .background(currentStep == index ? Color.accentColor : Color.accentColor.opacity(0.15), in: Circle())
                                    .foregroundStyle(currentStep == index ? .white : .primary)
                                Text(step)
                                    .font(.body)
                                    .foregroundStyle(currentStep == index ? .primary : .secondary)
                                    .multilineTextAlignment(.leading)
                                Spacer()
                            }
                        }
                        .buttonStyle(.plain)
                        .padding(.vertical, 4)
                        .padding(.horizontal, 8)
                        .background(currentStep == index ? Color.accentColor.opacity(0.1) : Color.clear, in: RoundedRectangle(cornerRadius: 8))
                    }
                    // Prev/Next navigation
                    if currentStep != nil {
                        HStack {
                            Button {
                                if let step = currentStep, step > 0 {
                                    currentStep = step - 1
                                }
                            } label: {
                                Label("Previous", systemImage: "chevron.left")
                            }
                            .disabled(currentStep == 0)
                            Spacer()
                            Text("Step \((currentStep ?? 0) + 1) of \(recipe.instructions.count)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Spacer()
                            Button {
                                if let step = currentStep, step < recipe.instructions.count - 1 {
                                    currentStep = step + 1
                                }
                            } label: {
                                Label("Next", systemImage: "chevron.right")
                            }
                            .disabled(currentStep == recipe.instructions.count - 1)
                        }
                        .font(.subheadline)
                        .padding(.top, 8)
                    }
                }

                // Tags
                if !recipe.tags.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Tags")
                            .font(.headline)
                        RecipeTagFlowLayout(spacing: 6) {
                            ForEach(recipe.tags, id: \.self) { tag in
                                Text(tag)
                                    .font(.caption)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(Color.secondary.opacity(0.12), in: Capsule())
                            }
                        }
                    }
                }
            }
            .padding()
        }
    }
}

struct NutritionBadge: View {
    let label: String
    let value: String

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.caption.weight(.semibold))
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}

struct MacroColumn: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.weight(.semibold))
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

/// Simple horizontal flow layout for tags.
struct RecipeTagFlowLayout: Layout {
    var spacing: CGFloat = 4

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrange(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: proposal, subviews: subviews)
        for (index, subview) in subviews.enumerated() {
            let point = CGPoint(
                x: bounds.minX + result.positions[index].x,
                y: bounds.minY + result.positions[index].y
            )
            subview.place(at: point, proposal: .unspecified)
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (positions: [CGPoint], size: CGSize) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var maxX: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
            maxX = max(maxX, x)
        }

        return (positions, CGSize(width: maxX, height: y + rowHeight))
    }
}
