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
                        Label("\(recipe.servings) servings", systemImage: "person.2")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }

                // Nutrition per serving
                VStack(alignment: .leading, spacing: 8) {
                    Text("Nutrition per Serving")
                        .font(.headline)
                    HStack(spacing: 16) {
                        MacroColumn(label: "Calories", value: "\(Int(recipe.nutritionPerServing.calories))", color: .orange)
                        MacroColumn(label: "Protein", value: "\(Int(recipe.nutritionPerServing.protein))g", color: .red)
                        MacroColumn(label: "Carbs", value: "\(Int(recipe.nutritionPerServing.carbs))g", color: .blue)
                        MacroColumn(label: "Fat", value: "\(Int(recipe.nutritionPerServing.fat))g", color: .yellow)
                        MacroColumn(label: "Fiber", value: "\(Int(recipe.nutritionPerServing.fiber))g", color: .green)
                    }
                }

                // Ingredients
                VStack(alignment: .leading, spacing: 8) {
                    Text("Ingredients")
                        .font(.headline)
                    ForEach(recipe.ingredients) { ingredient in
                        HStack {
                            Text("•")
                                .foregroundStyle(.secondary)
                            Text("\(ingredient.quantity, specifier: ingredient.quantity == ingredient.quantity.rounded() ? "%.0f" : "%.1f") \(ingredient.unit)")
                                .fontWeight(.medium)
                            Text(ingredient.name)
                        }
                        .font(.body)
                    }
                }

                // Instructions
                VStack(alignment: .leading, spacing: 8) {
                    Text("Instructions")
                        .font(.headline)
                    ForEach(Array(recipe.instructions.enumerated()), id: \.offset) { index, step in
                        HStack(alignment: .top, spacing: 12) {
                            Text("\(index + 1)")
                                .font(.caption.weight(.bold))
                                .frame(width: 24, height: 24)
                                .background(Color.accentColor.opacity(0.15), in: Circle())
                            Text(step)
                                .font(.body)
                        }
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
