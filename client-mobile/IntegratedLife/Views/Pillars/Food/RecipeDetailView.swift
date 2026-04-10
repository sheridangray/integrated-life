import SwiftUI

struct RecipeListView: View {
    @ObservedObject var foodState: FoodState
    @State private var searchText = ""
    @State private var searchScope: SearchScope = .all
    
    enum SearchScope: String, CaseIterable {
        case all = "All"
        case ingredients = "Ingredients"
        case tags = "Tags"
    }

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
                        // Inline search field
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundStyle(.secondary)
                            TextField("Search by name, ingredient, or tag", text: $searchText)
                                .textFieldStyle(.plain)
                            if !searchText.isEmpty {
                                Button { searchText = "" } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                        .padding(8)
                        .background(Color.secondary.opacity(0.1))
                        .cornerRadius(8)
                        
                        // Scope picker
                        HStack(spacing: 8) {
                            ForEach(SearchScope.allCases, id: \.self) { scope in
                                Button { searchScope = scope } label: {
                                    Text(scope.rawValue)
                                        .font(.caption)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(searchScope == scope ? Color.accentColor : Color.secondary.opacity(0.2))
                                        .foregroundStyle(searchScope == scope ? .white : .primary)
                                        .cornerRadius(4)
                                }
                            }
                        }
                        
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
        .task(id: (searchText, searchScope)) {
            try? await Task.sleep(for: .milliseconds(300))
            let search = searchText.isEmpty ? nil : searchText
            let tag = searchScope == .tags ? search : nil
            let ingredient = searchScope == .ingredients ? search : nil
            await foodState.loadRecipes(search: search, tag: tag, ingredient: ingredient)
        }
    }
}

private struct RecipeCardView: View {
    let recipe: Recipe

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Thumbnail image - use primaryImage helper
            if let imageUrl = recipe.primaryImage, let url = URL(string: imageUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(1, contentMode: .fill)
                            .frame(width: 60, height: 60)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    case .failure, .empty:
                        Color.secondary.opacity(0.2)
                            .frame(width: 60, height: 60)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    @unknown default:
                        Color.secondary.opacity(0.2)
                            .frame(width: 60, height: 60)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
            
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
        .toolbarBackground(.hidden, for: .navigationBar)
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
    @State private var selectedImageIndex: Int = 0

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
        nutrition.scaled(by: scale)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Recipe Image Gallery
                if !recipe.images.isEmpty {
                    RecipeImageGallery(images: recipe.images, selectedIndex: $selectedImageIndex)
                } else if let imageUrl = recipe.imageUrl, let url = URL(string: imageUrl) {
                    // Fallback for legacy single image
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(16/9, contentMode: .fill)
                                .frame(maxWidth: .infinity)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        case .failure:
                            EmptyView()
                        case .empty:
                            ProgressView()
                                .frame(height: 200)
                        @unknown default:
                            EmptyView()
                        }
                    }
                    .accessibilityLabel("Recipe image for \(recipe.name)")
                }
                
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
                
                // Quick Actions
                HStack(spacing: 12) {
                    Button {
                        // TODO: Add to grocery list functionality
                    } label: {
                        Label("Add to Grocery", systemImage: "cart.badge.plus")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    
                    Button {
                        // TODO: Add to meal plan functionality
                    } label: {
                        Label("Add to Meal Plan", systemImage: "calendar.badge.plus")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
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
                            HStack(alignment: .top, spacing: 12) {
                                Image(systemName: checkedIngredients.contains(ingredient.id) ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(checkedIngredients.contains(ingredient.id) ? .green : .secondary)
                                    .frame(width: 24, height: 24)
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
                        FlowLayout(spacing: 6) {
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

// MARK: - Image Gallery Component

private struct RecipeImageGallery: View {
    let images: [RecipeImage]
    @Binding var selectedIndex: Int
    
    var body: some View {
        VStack(spacing: 8) {
            TabView(selection: $selectedIndex) {
                ForEach(Array(images.enumerated()), id: \.element.id) { index, image in
                    AsyncImage(url: URL(string: image.url)) { phase in
                        switch phase {
                        case .success(let loadedImage):
                            loadedImage
                                .resizable()
                                .aspectRatio(16/9, contentMode: .fill)
                                .frame(maxWidth: .infinity)
                                .clipped()
                        case .failure:
                            Color.secondary.opacity(0.2)
                                .frame(maxWidth: .infinity)
                                .frame(height: 200)
                                .overlay(
                                    Image(systemName: "photo")
                                        .foregroundStyle(.secondary)
                                )
                        case .empty:
                            ProgressView()
                                .frame(height: 200)
                        @unknown default:
                            Color.secondary.opacity(0.2)
                                .frame(height: 200)
                        }
                    }
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .automatic))
            .frame(height: 250)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            
            // Caption for selected image
            if let caption = images[selectedIndex].caption, !caption.isEmpty {
                Text(caption)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal)
            }
            
            // Page indicator for multiple images
            if images.count > 1 {
                HStack(spacing: 6) {
                    ForEach(Array(images.enumerated()), id: \.element.id) { index, _ in
                        Circle()
                            .fill(index == selectedIndex ? Color.accentColor : Color.secondary.opacity(0.3))
                            .frame(width: 8, height: 8)
                            .onTapGesture {
                                withAnimation { selectedIndex = index }
                            }
                    }
                }
                .padding(.bottom, 4)
            }
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
