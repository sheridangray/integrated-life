import OSLog
import SwiftUI

private let recipeImageLogger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "IntegratedLife", category: "RecipeImage")

struct RecipeListView: View {
    @ObservedObject var foodState: FoodState
    @State private var searchText = ""
    @State private var filterSheetPresented = false
    @State private var aiCreateSheetPresented = false
    @State private var filterMaxTotalMinutes: Int?
    @State private var filterTag: String?

    private var filtersActive: Bool {
        filterMaxTotalMinutes != nil || filterTag != nil
    }

    private var recipeQuerySignature: String {
        [searchText, filterTag ?? "", filterMaxTotalMinutes.map(String.init) ?? ""].joined(separator: "|")
    }

    var body: some View {
        Group {
            if foodState.recipesLoading {
                ProgressView("Loading recipes...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if foodState.recipes.isEmpty, let err = foodState.error, !err.isEmpty {
                ContentUnavailableView {
                    Label("Couldn't load recipes", systemImage: "wifi.exclamationmark")
                } description: {
                    Text(err)
                } actions: {
                    Button("Try again") {
                        Task { await reloadRecipes() }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if foodState.recipes.isEmpty {
                ContentUnavailableView(
                    "No recipes found",
                    systemImage: "magnifyingglass",
                    description: Text(
                        filtersActive || !searchText.isEmpty
                            ? "Try different words or adjust filters."
                            : "Add a recipe to get started."
                    )
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundStyle(.secondary)
                            TextField("Search name or ingredients", text: $searchText)
                                .textFieldStyle(.plain)
                            if !searchText.isEmpty {
                                Button { searchText = "" } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(.secondary)
                                }
                            }
                            Button {
                                filterSheetPresented = true
                            } label: {
                                Image(systemName: filtersActive ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                                    .foregroundStyle(filtersActive ? .accent : .secondary)
                            }
                            .accessibilityLabel("Recipe filters")
                        }
                        .padding(8)
                        .background(Color.secondary.opacity(0.1))
                        .cornerRadius(8)

                        if filtersActive {
                            HStack {
                                Text(filterSummary)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Spacer(minLength: 8)
                                Button("Clear filters") {
                                    filterTag = nil
                                    filterMaxTotalMinutes = nil
                                }
                                .font(.caption.weight(.semibold))
                            }
                            .padding(.horizontal, 4)
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
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    aiCreateSheetPresented = true
                } label: {
                    Label("Add", systemImage: "plus")
                }
                .accessibilityLabel("Create recipe with AI")
            }
        }
        .sheet(isPresented: $filterSheetPresented) {
            RecipeFilterSheet(
                maxTotalMinutes: $filterMaxTotalMinutes,
                selectedTag: $filterTag,
                availableTags: foodState.recipeTagFilterOptions
            )
        }
        .sheet(isPresented: $aiCreateSheetPresented) {
            AIRecipeCreationSheet(foodState: foodState)
        }
        .task(id: recipeQuerySignature) {
            try? await Task.sleep(for: .milliseconds(300))
            await reloadRecipes()
        }
        .task {
            await foodState.loadRecipeTagFilterOptions()
        }
    }

    private var filterSummary: String {
        var parts: [String] = []
        if let m = filterMaxTotalMinutes {
            parts.append("≤ \(m) min total")
        }
        if let t = filterTag {
            parts.append("Tag: \(t)")
        }
        return parts.joined(separator: " · ")
    }

    private func reloadRecipes() async {
        let search = searchText.isEmpty ? nil : searchText
        await foodState.loadRecipes(
            search: search,
            tag: filterTag,
            maxTotalTimeMinutes: filterMaxTotalMinutes
        )
    }
}

// MARK: - Recipe filters (time + tag)

private struct RecipeFilterSheet: View {
    @Binding var maxTotalMinutes: Int?
    @Binding var selectedTag: String?
    let availableTags: [String]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Max total time", selection: $maxTotalMinutes) {
                        Text("Any").tag(Int?.none)
                        Text("15 min or less").tag(Optional(15))
                        Text("30 min or less").tag(Optional(30))
                        Text("45 min or less").tag(Optional(45))
                        Text("60 min or less").tag(Optional(60))
                        Text("90 min or less").tag(Optional(90))
                        Text("120 min or less").tag(Optional(120))
                    }
                } header: {
                    Text("Time")
                } footer: {
                    Text("Includes prep and cook time.")
                }

                Section {
                    Picker("Tag", selection: $selectedTag) {
                        Text("Any tag").tag(String?.none)
                        ForEach(availableTags, id: \.self) { tag in
                            Text(tag).tag(Optional(tag))
                        }
                    }
                } header: {
                    Text("Tags")
                } footer: {
                    Text("Matches recipes that include this tag.")
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

private struct RecipeCardView: View {
    let recipe: Recipe

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                recipeThumbnail
                HStack(alignment: .top, spacing: 8) {
                    Text(recipe.name)
                        .font(.headline)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                        // minWidth: 0 lets the label wrap in an HStack instead of truncating to one line.
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(minWidth: 0, maxWidth: .infinity, alignment: .leading)
                    Text(recipe.totalTimeFormatted)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: true, vertical: false)
                        .layoutPriority(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let desc = recipe.description {
                Text(desc)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
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
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            HStack(spacing: 12) {
                NutritionBadge(label: "Cal", value: "\(Int(recipe.nutritionPerServing.calories))")
                NutritionBadge(label: "P", value: "\(Int(recipe.nutritionPerServing.protein))g")
                NutritionBadge(label: "C", value: "\(Int(recipe.nutritionPerServing.carbs))g")
                NutritionBadge(label: "F", value: "\(Int(recipe.nutritionPerServing.fat))g")
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(recipe.name), \(Int(recipe.nutritionPerServing.calories)) calories per serving")
        .onAppear(perform: logThumbnailDiagnostics)
    }

    @ViewBuilder
    private var recipeThumbnail: some View {
        if let imageUrl = recipe.primaryImage, !imageUrl.isEmpty, let url = URL(string: imageUrl) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(1, contentMode: .fill)
                        .frame(width: 60, height: 60)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                case .failure(let error):
                    Color.orange.opacity(0.2)
                        .frame(width: 60, height: 60)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.caption)
                                .foregroundStyle(.orange)
                        }
                        .onAppear {
                            recipeImageLogger.error("AsyncImage failed recipe=\(recipe.name, privacy: .public) url=\(imageUrl, privacy: .public) error=\(String(describing: error), privacy: .public)")
                        }
                case .empty:
                    Color.secondary.opacity(0.2)
                        .frame(width: 60, height: 60)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay { ProgressView() }
                @unknown default:
                    Color.secondary.opacity(0.2)
                        .frame(width: 60, height: 60)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        } else {
            ZStack {
                Color.secondary.opacity(0.15)
                Image(systemName: "photo")
                    .foregroundStyle(.tertiary)
            }
            .frame(width: 60, height: 60)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }

    private func logThumbnailDiagnostics() {
        let primary = recipe.primaryImage.map { "\($0)" } ?? "nil"
        recipeImageLogger.debug("recipe=\(recipe.id, privacy: .public) name=\(recipe.name, privacy: .public) primaryImage=\(primary, privacy: .public) images.count=\(recipe.images.count) legacyImageUrl=\(recipe.imageUrl ?? "nil", privacy: .public)")
        if recipe.primaryImage == nil {
            recipeImageLogger.notice("No image URL on model — AsyncImage not used; showing placeholder. Fix: ensure API returns imageUrl/images[].url or imageId-derived URL.")
        } else if let s = recipe.primaryImage, URL(string: s) == nil {
            recipeImageLogger.warning("primaryImage is not a valid URL string: \(s, privacy: .public)")
        }
    }
}

struct RecipeDetailView: View {
    let recipeId: String
    @ObservedObject var foodState: FoodState
    var showServingsStepper: Bool = false
    var mealPlanId: String? = nil
    var mealIndex: Int? = nil
    var mealCurrentServings: Int? = nil

    var body: some View {
        Group {
            if let recipe = foodState.selectedRecipe, recipe.id == recipeId {
                RecipeDetailContent(
                    recipe: recipe,
                    foodState: foodState,
                    showServingsStepper: showServingsStepper,
                    mealPlanId: mealPlanId,
                    mealIndex: mealIndex,
                    initialServings: mealCurrentServings
                )
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

/// Full-width bordered actions with matching height and corner treatment.
private struct RecipeDetailActionButton: View {
    let title: String
    let systemImage: String
    var disabled: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .labelStyle(.titleAndIcon)
                .appActionLabelStyle()
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity, minHeight: AppMetrics.buttonHeight, alignment: .center)
        }
        .buttonStyle(.bordered)
        .controlSize(.large)
        .disabled(disabled)
    }
}

private struct AddToMealPlanSheet: View {
    let recipeId: String
    let recipeName: String
    let defaultServings: Int
    @ObservedObject var foodState: FoodState
    var onAdded: () -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var servings: Int
    @State private var mealType: MealType = .dinner
    @State private var selectedDate = Calendar.current.startOfDay(for: Date())
    @State private var isWorking = false
    @State private var localError: String?

    init(recipeId: String, recipeName: String, defaultServings: Int, foodState: FoodState, onAdded: @escaping () -> Void) {
        self.recipeId = recipeId
        self.recipeName = recipeName
        self.defaultServings = defaultServings
        self.foodState = foodState
        self.onAdded = onAdded
        _servings = State(initialValue: defaultServings)
    }

    /// Today through two years ahead; past days are not selectable.
    private var selectableDateRange: ClosedRange<Date> {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        let end = cal.date(byAdding: .year, value: 2, to: today) ?? today
        return today ... end
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text(recipeName)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                if let localError, !localError.isEmpty {
                    Section {
                        Text(localError)
                            .foregroundStyle(.red)
                    }
                }
                Section {
                    Picker("Meal type", selection: $mealType) {
                        ForEach(MealType.allCases) { type in
                            Text(type.displayName).tag(type)
                        }
                    }
                    DatePicker("Day", selection: $selectedDate, in: selectableDateRange, displayedComponents: .date)
                    HStack {
                        Text("Servings")
                        Spacer()
                        Button {
                            if servings > 1 { servings -= 1 }
                        } label: {
                            Image(systemName: "minus.circle")
                        }
                        .disabled(servings <= 1)
                        .buttonStyle(.plain)
                        Text("\(servings)")
                            .font(.body.weight(.medium))
                            .monospacedDigit()
                            .frame(minWidth: 28, alignment: .center)
                        Button {
                            servings += 1
                        } label: {
                            Image(systemName: "plus.circle")
                        }
                        .buttonStyle(.plain)
                    }
                } footer: {
                    Text("The meal is scheduled on the day you pick. A meal plan is created or updated for that week.")
                }
            }
            .navigationTitle("Add to meal plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .disabled(isWorking)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        Task { await submit() }
                    }
                    .disabled(isWorking)
                }
            }
        }
    }

    private func submit() async {
        localError = nil
        isWorking = true
        defer { isWorking = false }
        let ok = await foodState.addMealToCurrentWeekPlan(
            recipeId: recipeId,
            servings: servings,
            scheduledDate: selectedDate,
            mealType: mealType
        )
        if ok {
            onAdded()
            dismiss()
        } else {
            localError = foodState.error
        }
    }
}

private struct RecipeDetailContent: View {
    let recipe: Recipe
    @ObservedObject var foodState: FoodState
    let showServingsStepper: Bool
    let mealPlanId: String?
    let mealIndex: Int?
    @State private var scaledServings: Int
    @State private var checkedIngredients: Set<String> = []
    @State private var currentStep: Int? = nil
    @State private var selectedImageIndex: Int = 0
    @State private var toastMessage: String?
    @State private var isAddingToGrocery = false
    @State private var addToMealPlanPresented = false
    @State private var aiEditSheetPresented = false
    @State private var variants: [Recipe] = []

    /// Shared leading column for ingredient checkmarks and instruction step badges so rows align visually.
    private let rowLeadingSize: CGFloat = 28

    init(recipe: Recipe, foodState: FoodState, showServingsStepper: Bool = false,
         mealPlanId: String? = nil, mealIndex: Int? = nil, initialServings: Int? = nil) {
        self.recipe = recipe
        self.foodState = foodState
        self.showServingsStepper = showServingsStepper
        self.mealPlanId = mealPlanId
        self.mealIndex = mealIndex
        _scaledServings = State(initialValue: initialServings ?? recipe.servings)
    }

    private var scale: Double {
        Double(scaledServings) / Double(recipe.servings)
    }

    private func scaledQuantity(_ ingredient: Ingredient) -> Double {
        ingredient.quantity * scale
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

                // Variant picker
                if variants.count > 1 {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(variants) { variant in
                                Button {
                                    Task { await foodState.loadRecipe(id: variant.id) }
                                } label: {
                                    Text(variant.name)
                                        .font(.subheadline.weight(variant.id == recipe.id ? .semibold : .regular))
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(
                                            variant.id == recipe.id ? Color.accentColor : Color.secondary.opacity(0.12),
                                            in: Capsule()
                                        )
                                        .foregroundStyle(variant.id == recipe.id ? .white : .primary)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
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

                if showServingsStepper {
                    VStack(alignment: .leading, spacing: 12) {
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
                    }
                } else {
                    RecipeDetailActionButton(
                        title: "Add to Meal Plan",
                        systemImage: "calendar.badge.plus"
                    ) {
                        addToMealPlanPresented = true
                    }
                }

                RecipeDetailActionButton(
                    title: "Edit with AI",
                    systemImage: "wand.and.stars"
                ) {
                    aiEditSheetPresented = true
                }

                // Nutrition
                VStack(alignment: .leading, spacing: 8) {
                    Text("Nutrition")
                        .font(.headline)
                    Text("Per Serving")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    let nutrition = recipe.nutritionPerServing
                    HStack(spacing: 16) {
                        MacroColumn(label: "Calories", value: "\(Int(nutrition.calories))", color: .orange)
                        MacroColumn(label: "Protein", value: "\(Int(nutrition.protein))g", color: .red)
                        MacroColumn(label: "Carbs", value: "\(Int(nutrition.carbs))g", color: .blue)
                        MacroColumn(label: "Fat", value: "\(Int(nutrition.fat))g", color: .yellow)
                        MacroColumn(label: "Fiber", value: "\(Int(nutrition.fiber))g", color: .green)
                    }
                }

                // Ingredients with checkboxes
                VStack(alignment: .leading, spacing: 12) {
                    Text("Ingredients")
                        .font(.headline)

                    RecipeDetailActionButton(
                        title: "Add to Grocery",
                        systemImage: "cart.badge.plus",
                        disabled: checkedIngredients.isEmpty || isAddingToGrocery
                    ) {
                        Task { await addSelectedIngredientsToGrocery() }
                    }

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
                                    .font(.system(size: 22, weight: .regular))
                                    .foregroundStyle(checkedIngredients.contains(ingredient.id) ? .green : .secondary)
                                    .frame(width: rowLeadingSize, height: rowLeadingSize)
                                VStack(alignment: .leading, spacing: 2) {
                                    let qty = scaledQuantity(ingredient)
                                    let qtyStr = qty == qty.rounded() ? String(format: "%.0f", qty) : String(format: "%.1f", qty)
                                    Text("\(qtyStr) \(ingredient.unit) \(ingredient.name)")
                                        .foregroundStyle(.primary)
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
                                    .monospacedDigit()
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.65)
                                    .frame(width: rowLeadingSize, height: rowLeadingSize)
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
            }
            .padding()
        }
        .onDisappear {
            guard showServingsStepper, let planId = mealPlanId, let idx = mealIndex else { return }
            Task { await foodState.updateMealServings(planId: planId, mealIndex: idx, servings: scaledServings) }
        }
        .task {
            guard let groupId = recipe.variantGroupId, !groupId.isEmpty else { return }
            do {
                variants = try await FoodService.shared.fetchRecipeVariants(groupId: groupId)
            } catch {
                variants = []
            }
        }
        .sheet(isPresented: $addToMealPlanPresented) {
            AddToMealPlanSheet(
                recipeId: recipe.id,
                recipeName: recipe.name,
                defaultServings: recipe.servings,
                foodState: foodState,
                onAdded: {
                    withAnimation {
                        toastMessage = "Added to your meal plan."
                    }
                    Task {
                        try? await Task.sleep(for: .seconds(2.2))
                        if toastMessage != nil {
                            withAnimation { toastMessage = nil }
                        }
                    }
                }
            )
        }
        .sheet(isPresented: $aiEditSheetPresented) {
            AIRecipeEditSheet(recipeId: recipe.id, foodState: foodState)
        }
        .overlay(alignment: .bottom) {
            if let toastMessage {
                Text(toastMessage)
                    .font(.subheadline)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(.regularMaterial, in: Capsule())
                    .padding(.bottom, 24)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.25), value: toastMessage)
    }

    private func addSelectedIngredientsToGrocery() async {
        let payloads: [AddGroceryItemPayload] = recipe.ingredients
            .filter { checkedIngredients.contains($0.id) }
            .map {
                AddGroceryItemPayload(
                    name: $0.name,
                    quantity: scaledQuantity($0),
                    unit: $0.unit,
                    category: $0.category.rawValue
                )
            }
        guard !payloads.isEmpty else { return }
        isAddingToGrocery = true
        defer { isAddingToGrocery = false }
        let ok = await foodState.addRecipeIngredientsToGrocery(payloads)
        if ok {
            withAnimation {
                toastMessage = "Added \(payloads.count) ingredient\(payloads.count == 1 ? "" : "s") to your grocery list."
            }
            checkedIngredients.removeAll()
            Task {
                try? await Task.sleep(for: .seconds(2.2))
                if toastMessage != nil {
                    withAnimation { toastMessage = nil }
                }
            }
        } else {
            withAnimation {
                toastMessage = foodState.error ?? "Couldn’t add to grocery list."
            }
            Task {
                try? await Task.sleep(for: .seconds(2.5))
                if toastMessage != nil {
                    withAnimation { toastMessage = nil }
                }
            }
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
