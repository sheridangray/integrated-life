import SwiftUI

// MARK: - Display formatting

private enum GroceryDisplay {
    static func formatName(_ raw: String) -> String {
        raw
            .split(whereSeparator: { $0.isWhitespace })
            .map { part -> String in
                let w = String(part)
                if w.allSatisfy({ $0.isNumber }) { return w }
                return w.capitalized
            }
            .joined(separator: " ")
    }

    static func formatUnit(_ raw: String) -> String {
        let u = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !u.isEmpty else { return "" }
        let key = u.lowercased()
        let specials: [String: String] = [
            "tbsp": "Tbsp", "tsp": "Tsp", "lb": "lb", "lbs": "lb", "oz": "oz",
            "gal": "gal", "qt": "qt", "pt": "pt", "cup": "Cup", "cups": "Cups",
            "ml": "mL", "l": "L", "g": "g", "kg": "kg",
            "whole": "Whole", "cloves": "Cloves", "clove": "Clove",
            "medium": "Medium", "large": "Large", "small": "Small",
            "pieces": "Pieces", "piece": "Piece", "each": "Each"
        ]
        if let s = specials[key] { return s }
        return u.capitalized
    }

    static func formatQuantity(_ q: Double) -> String {
        if abs(q - round(q)) < 0.001 { return String(Int(round(q))) }
        let s = String(format: "%.2f", q)
        if s.hasSuffix("0") {
            return String(format: "%.1f", q)
        }
        return s
    }

    static func quantityLine(quantity: Double, unit: String) -> String {
        "\(formatQuantity(quantity)) \(formatUnit(unit))"
    }

    static func stepSize(for quantity: Double) -> Double {
        if quantity >= 1, abs(quantity - round(quantity)) < 0.001 { return 1 }
        return 0.25
    }

    static func categoryIcon(_ category: IngredientCategory) -> String {
        switch category {
        case .produce: return "leaf"
        case .meat: return "flame"
        case .seafood: return "fish"
        case .dairy: return "cup.and.saucer"
        case .bakery: return "birthday.cake"
        case .pantry: return "cabinet"
        case .frozen: return "snowflake"
        case .beverages: return "wineglass"
        case .other: return "bag"
        }
    }
}

/// Single evergreen grocery list for the user.
struct GroceryTabView: View {
    @ObservedObject var foodState: FoodState
    @State private var showShoppingConfirm = false
    @State private var showAddSheet = false

    var body: some View {
        Group {
            if foodState.groceryLoading && foodState.activeGroceryList == nil {
                ProgressView("Loading grocery list...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let list = foodState.activeGroceryList {
                if list.items.isEmpty {
                    ContentUnavailableView(
                        "Your list is empty",
                        systemImage: "cart",
                        description: Text("Add ingredients from a recipe, generate from a meal plan, or add items below.")
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .safeAreaInset(edge: .bottom) {
                        Button {
                            showAddSheet = true
                        } label: {
                            Label("Add item", systemImage: "plus.circle.fill")
                                .appActionLabelStyle()
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .padding()
                    }
                } else {
                    GroceryListContent(
                        list: list,
                        foodState: foodState,
                        onAddItem: { showAddSheet = true }
                    )
                }
            } else {
                ContentUnavailableView(
                    "Couldn't load grocery list",
                    systemImage: "exclamationmark.triangle",
                    description: Text(foodState.error ?? "Try again.")
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .navigationTitle("Grocery")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button {
                    showAddSheet = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("Add grocery item")

                if let list = foodState.activeGroceryList, !list.items.isEmpty {
                    Button {
                        showShoppingConfirm = true
                    } label: {
                        Label("Order", systemImage: "cart.badge.plus")
                    }
                    .disabled(list.status != .draft)
                }
            }
        }
        .sheet(isPresented: $showAddSheet) {
            AddGroceryItemSheet { name, quantity, unit, category in
                Task {
                    await foodState.addManualGroceryItem(name: name, quantity: quantity, unit: unit, category: category)
                }
            }
        }
        .confirmationDialog("Start Shopping?", isPresented: $showShoppingConfirm) {
            Button("Send to Instacart") {
                Task {
                    _ = await foodState.initiateShopping()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will send your grocery list to OpenClaw which will place the Instacart order.")
        }
        .task {
            await foodState.loadMyGroceryList()
        }
    }
}

// MARK: - List content

private struct GroceryListContent: View {
    let list: GroceryList
    @ObservedObject var foodState: FoodState
    var onAddItem: () -> Void

    private static let categoryOrder: [IngredientCategory] = [
        .produce, .meat, .seafood, .dairy, .bakery, .pantry, .frozen, .beverages, .other
    ]

    private var itemsByCategory: [(IngredientCategory, [IndexedGroceryItem])] {
        let indexed = list.items.enumerated().map { IndexedGroceryItem(index: $0.offset, item: $0.element) }
        let grouped = Dictionary(grouping: indexed) { $0.item.ingredient.category }
        return Self.categoryOrder.compactMap { category in
            let items = grouped[category] ?? []
            return items.isEmpty ? nil : (category, items)
        }
    }

    var body: some View {
        List {
            ForEach(itemsByCategory, id: \.0) { category, items in
                Section {
                    ForEach(items) { indexed in
                        GroceryItemRow(
                            item: indexed.item,
                            listId: list.id,
                            itemIndex: indexed.index,
                            foodState: foodState
                        )
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                Task {
                                    await foodState.removeGroceryItem(listId: list.id, itemIndex: indexed.index)
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                } header: {
                    Label(category.displayName, systemImage: GroceryDisplay.categoryIcon(category))
                }
            }
        }
        .listStyle(.insetGrouped)
    }
}

private struct IndexedGroceryItem: Identifiable {
    let index: Int
    let item: GroceryItem
    var id: Int { index }
}

private struct GroceryItemRow: View {
    let item: GroceryItem
    let listId: String
    let itemIndex: Int
    @ObservedObject var foodState: FoodState

    private var step: Double {
        GroceryDisplay.stepSize(for: item.ingredient.quantity)
    }

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            Button {
                Task { await foodState.toggleGroceryItem(listId: listId, itemIndex: itemIndex) }
            } label: {
                Image(systemName: item.checked ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(item.checked ? .green : .secondary)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(item.checked ? "Checked" : "Unchecked")

            VStack(alignment: .leading, spacing: 6) {
                Text(GroceryDisplay.formatName(item.ingredient.name))
                    .font(.body.weight(.medium))
                    .strikethrough(item.checked)
                    .foregroundStyle(item.checked ? .secondary : .primary)
                    .multilineTextAlignment(.leading)

                HStack(spacing: 10) {
                    Button {
                        Task {
                            let q = item.ingredient.quantity
                            let next = q - step
                            if next < 0.25 - 0.0001 {
                                await foodState.removeGroceryItem(listId: listId, itemIndex: itemIndex)
                            } else {
                                await foodState.updateGroceryItemQuantity(listId: listId, itemIndex: itemIndex, quantity: next)
                            }
                        }
                    } label: {
                        Image(systemName: "minus.circle.fill")
                            .font(.title3)
                            .symbolRenderingMode(.hierarchical)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
                    .accessibilityLabel("Decrease amount")

                    Text(GroceryDisplay.quantityLine(quantity: item.ingredient.quantity, unit: item.ingredient.unit))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .frame(minWidth: 72, alignment: .leading)
                        .monospacedDigit()

                    Button {
                        Task {
                            await foodState.updateGroceryItemQuantity(
                                listId: listId,
                                itemIndex: itemIndex,
                                quantity: item.ingredient.quantity + step
                            )
                        }
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .symbolRenderingMode(.hierarchical)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(Color.accentColor)
                    .accessibilityLabel("Increase amount")
                }
            }

            Spacer(minLength: 0)

            if let notes = item.notes, !notes.isEmpty {
                Text(notes)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .lineLimit(2)
            }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(GroceryDisplay.formatName(item.ingredient.name)), \(GroceryDisplay.quantityLine(quantity: item.ingredient.quantity, unit: item.ingredient.unit))")
    }
}

// MARK: - Add item sheet

private struct AddGroceryItemSheet: View {
    let onSave: (String, Double, String, IngredientCategory) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var quantityText = "1"
    @State private var unit = "each"
    @State private var selectedCategory: IngredientCategory = .other

    var body: some View {
        NavigationStack {
            Form {
                Section("Item") {
                    TextField("Name", text: $name)
                        .textInputAutocapitalization(.words)
                    TextField("Amount", text: $quantityText)
                        .keyboardType(.decimalPad)
                    TextField("Unit", text: $unit, prompt: Text("e.g. cups, lb, each"))
                        .textInputAutocapitalization(.never)
                }

                Section("Category") {
                    Picker("Category", selection: $selectedCategory) {
                        ForEach(IngredientCategory.allCases, id: \.self) { category in
                            Text(category.displayName).tag(category)
                        }
                    }
                }
            }
            .navigationTitle("Add item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        let q = Double(quantityText.replacingOccurrences(of: ",", with: ".")) ?? 1
                        onSave(name, q, unit, selectedCategory)
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}
