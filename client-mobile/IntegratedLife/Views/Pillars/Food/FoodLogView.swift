import SwiftUI

struct FoodLogView: View {
    @ObservedObject var foodState: FoodState
    @State private var showAddSheet = false

    private var todayString: String {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMM d"
        return f.string(from: foodState.selectedDate)
    }

    var body: some View {
        VStack(spacing: 0) {
            // Date navigation
            HStack {
                Button {
                    Task { await foodState.navigateDay(offset: -1) }
                } label: {
                    Image(systemName: "chevron.left")
                }
                .accessibilityLabel("Previous day")

                Spacer()
                Text(todayString)
                    .font(.headline)
                Spacer()

                Button {
                    Task { await foodState.navigateDay(offset: 1) }
                } label: {
                    Image(systemName: "chevron.right")
                }
                .accessibilityLabel("Next day")
            }
            .padding(.horizontal)
            .padding(.vertical, 8)

            if foodState.foodLogLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    VStack(spacing: 16) {
                        // Macro summary card
                        if let daily = foodState.dailyNutrition {
                            MacroSummaryCard(nutrition: daily.totals)
                        }

                        // Scan buttons
                        HStack(spacing: 12) {
                            NavigationLink(value: FoodNavDestination.barcodeScanner) {
                                ScanButton(title: "Barcode", icon: "barcode.viewfinder")
                            }
                            NavigationLink(value: FoodNavDestination.mealScanner) {
                                ScanButton(title: "Meal Photo", icon: "camera")
                            }
                        }
                        .padding(.horizontal)

                        // Entries by meal type
                        ForEach(MealType.allCases) { mealType in
                            let entries = (foodState.dailyNutrition?.entries ?? []).filter { $0.mealType == mealType }
                            if !entries.isEmpty {
                                MealTypeSection(mealType: mealType, entries: entries, foodState: foodState)
                            }
                        }

                        if foodState.dailyNutrition?.entries.isEmpty ?? true {
                            ContentUnavailableView(
                                "No Entries",
                                systemImage: "fork.knife",
                                description: Text("Scan a barcode or photo to log food.")
                            )
                        }
                    }
                    .padding(.vertical)
                }
            }
        }
        .task {
            await foodState.loadDailyNutrition()
        }
    }
}

private struct MacroSummaryCard: View {
    let nutrition: Nutrition

    var body: some View {
        VStack(spacing: 12) {
            Text("\(Int(nutrition.calories))")
                .font(.largeTitle.weight(.bold))
                .accessibilityLabel("\(Int(nutrition.calories)) calories")
            Text("Calories")
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack(spacing: 0) {
                MacroBar(label: "Protein", grams: nutrition.protein, color: .red)
                MacroBar(label: "Carbs", grams: nutrition.carbs, color: .blue)
                MacroBar(label: "Fat", grams: nutrition.fat, color: .yellow)
                MacroBar(label: "Fiber", grams: nutrition.fiber, color: .green)
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }
}

private struct MacroBar: View {
    let label: String
    let grams: Double
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text("\(Int(grams))g")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(label), \(Int(grams)) grams")
    }
}

private struct ScanButton: View {
    let title: String
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: icon)
            Text(title)
                .font(.subheadline.weight(.medium))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
        .foregroundStyle(.primary)
    }
}

private struct MealTypeSection: View {
    let mealType: MealType
    let entries: [FoodLogEntry]
    @ObservedObject var foodState: FoodState

    private var sectionCalories: Double {
        entries.reduce(0) { $0 + $1.totalCalories }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: mealType.icon)
                    .foregroundStyle(.secondary)
                Text(mealType.displayName)
                    .font(.headline)
                Spacer()
                Text("\(Int(sectionCalories)) cal")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal)

            ForEach(entries) { entry in
                FoodLogEntryRow(entry: entry) {
                    Task { await foodState.deleteFoodLog(id: entry.id) }
                }
            }
        }
    }
}

private struct FoodLogEntryRow: View {
    let entry: FoodLogEntry
    let onDelete: () -> Void

    var body: some View {
        HStack {
            Image(systemName: entry.source.icon)
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(width: 24)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(entry.food.name)
                        .font(.subheadline)
                    if let brand = entry.food.brand {
                        Text("(\(brand))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Text("\(entry.servings, specifier: "%.1f") × \(entry.servingSize)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(Int(entry.totalCalories)) cal")
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal)
        .padding(.vertical, 6)
        .contextMenu {
            Button(role: .destructive, action: onDelete) {
                Label("Delete", systemImage: "trash")
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(entry.food.name), \(Int(entry.totalCalories)) calories")
    }
}
