import SwiftUI

struct GroceryListsView: View {
    @ObservedObject var foodState: FoodState

    var body: some View {
        Group {
            if foodState.groceryLoading {
                ProgressView("Loading grocery lists...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if foodState.groceryLists.isEmpty {
                ContentUnavailableView(
                    "No Grocery Lists",
                    systemImage: "cart",
                    description: Text("Generate a grocery list from a meal plan to get started.")
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(foodState.groceryLists) { list in
                            NavigationLink(value: FoodNavDestination.groceryListDetail(list.id)) {
                                GroceryListCard(list: list)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                }
            }
        }
        .task {
            await foodState.loadGroceryLists()
        }
    }
}

private struct GroceryListCard: View {
    let list: GroceryList

    private var checkedCount: Int { list.items.filter(\.checked).count }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Grocery List")
                    .font(.headline)
                Text("\(checkedCount)/\(list.items.count) items checked")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            GroceryStatusBadge(status: list.status)
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Grocery list, \(checkedCount) of \(list.items.count) items checked, \(list.status.displayName)")
    }
}

private struct GroceryStatusBadge: View {
    let status: GroceryListStatus

    private var color: Color {
        switch status {
        case .draft: return .gray
        case .ordered: return .orange
        case .complete: return .green
        }
    }

    var body: some View {
        Text(status.displayName)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
    }
}

// MARK: - Grocery List Detail

struct GroceryListDetailView: View {
    let groceryListId: String
    @ObservedObject var foodState: FoodState
    @State private var showShoppingConfirm = false

    var body: some View {
        Group {
            if foodState.groceryLoading {
                ProgressView("Loading...")
            } else if let list = foodState.activeGroceryList, list.id == groceryListId {
                GroceryListContent(list: list, foodState: foodState, showShoppingConfirm: $showShoppingConfirm)
            } else {
                ContentUnavailableView("Not Found", systemImage: "exclamationmark.triangle")
            }
        }
        .navigationTitle("Grocery List")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showShoppingConfirm = true
                } label: {
                    Label("Order", systemImage: "cart.badge.plus")
                }
                .disabled(foodState.activeGroceryList?.status != .draft)
            }
        }
        .confirmationDialog("Start Shopping?", isPresented: $showShoppingConfirm) {
            Button("Send to Instacart") {
                Task {
                    _ = await foodState.initiateShopping(groceryListId: groceryListId)
                    await foodState.loadGroceryList(id: groceryListId)
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will organize your list by store and initiate an Instacart order.")
        }
        .task {
            await foodState.loadGroceryList(id: groceryListId)
        }
    }
}

private struct GroceryListContent: View {
    let list: GroceryList
    @ObservedObject var foodState: FoodState
    @Binding var showShoppingConfirm: Bool

    private var itemsByStore: [(Store, [IndexedGroceryItem])] {
        let indexed = list.items.enumerated().map { IndexedGroceryItem(index: $0.offset, item: $0.element) }
        let grouped = Dictionary(grouping: indexed) { $0.item.store }
        return Store.allCases.compactMap { store in
            let items = grouped[store] ?? []
            return items.isEmpty ? nil : (store, items)
        }
    }

    var body: some View {
        List {
            ForEach(itemsByStore, id: \.0) { store, items in
                Section {
                    ForEach(items) { indexed in
                        GroceryItemRow(item: indexed.item) {
                            Task { await foodState.toggleGroceryItem(listId: list.id, itemIndex: indexed.index) }
                        }
                    }
                } header: {
                    Label(store.displayName, systemImage: store.icon)
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
    let onToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            HStack {
                Image(systemName: item.checked ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(item.checked ? .green : .secondary)
                    .accessibilityLabel(item.checked ? "Checked" : "Unchecked")
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.ingredient.name)
                        .strikethrough(item.checked)
                        .foregroundStyle(item.checked ? .secondary : .primary)
                    Text("\(item.ingredient.quantity, specifier: item.ingredient.quantity == item.ingredient.quantity.rounded() ? "%.0f" : "%.1f") \(item.ingredient.unit)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                if let notes = item.notes {
                    Text(notes)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(item.ingredient.name), \(item.checked ? "checked" : "unchecked")")
        .accessibilityAddTraits(.isButton)
    }
}
