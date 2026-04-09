import SwiftUI
import Charts

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
                        // Daily nutrition chart (replaces simple macro summary)
                        if let daily = foodState.dailyNutrition {
                            DailyNutritionChartView(dailyNutrition: daily)
                        }

                        // HealthKit sync toggle
                        HealthKitSyncRow(foodState: foodState)

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
                } onSyncToHealthKit: {
                    Task { await foodState.syncEntryToHealthKit(entry) }
                }
            }
        }
    }
}

private struct FoodLogEntryRow: View {
    let entry: FoodLogEntry
    let onDelete: () -> Void
    let onSyncToHealthKit: () -> Void

    var body: some View {
        NavigationLink(value: FoodNavDestination.nutritionDetail(entry.id)) {
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
                    HStack(spacing: 4) {
                        Text("\(entry.servings, specifier: "%.1f") x \(entry.servingSize)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        if entry.writtenToHealthKit == true {
                            Image(systemName: "heart.fill")
                                .font(.caption2)
                                .foregroundStyle(.red)
                                .accessibilityLabel("Synced to Health")
                        }
                    }
                }
                Spacer()
                Text("\(Int(entry.totalCalories)) cal")
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
        }
        .foregroundStyle(.primary)
        .padding(.horizontal)
        .padding(.vertical, 6)
        .contextMenu {
            if entry.writtenToHealthKit != true {
                Button(action: onSyncToHealthKit) {
                    Label("Sync to Health", systemImage: "heart.circle")
                }
            }
            Button(role: .destructive, action: onDelete) {
                Label("Delete", systemImage: "trash")
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(entry.food.name), \(Int(entry.totalCalories)) calories")
    }
}

// MARK: - HealthKit Sync Row

private struct HealthKitSyncRow: View {
    @ObservedObject var foodState: FoodState
    private let hkService = HealthKitFoodService.shared

    var body: some View {
        HStack {
            Image(systemName: "heart.circle.fill")
                .foregroundStyle(.red)
            Toggle("Sync to Health", isOn: $foodState.syncToHealthKit)
                .font(.subheadline)
        }
        .padding(.horizontal)
        .padding(.vertical, 4)

        if let writeError = foodState.healthKitWriteError {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)
                    .font(.caption)
                Text(writeError)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - Nutrition Detail View

struct NutritionDetailView: View {
    let entry: FoodLogEntry

    private var n: Nutrition { entry.food.nutrition }
    private var s: Double { entry.servings }

    var body: some View {
        List {
            Section("Overview") {
                row("Calories", value: n.calories * s, unit: "kcal")
                row("Servings", value: s, unit: "x \(entry.servingSize)")
                if entry.writtenToHealthKit == true {
                    Label("Synced to Apple Health", systemImage: "heart.fill")
                        .font(.subheadline)
                        .foregroundStyle(.red)
                }
            }

            Section("Macros") {
                row("Protein", value: n.protein * s, unit: "g")
                row("Carbohydrates", value: n.carbs * s, unit: "g")
                row("Fat", value: n.fat * s, unit: "g")
                row("Fiber", value: n.fiber * s, unit: "g")
                optRow("Sugar", value: n.sugar, unit: "g")
                optRow("Water", value: n.water, unit: "mL")
            }

            Section("Fat Breakdown") {
                optRow("Saturated Fat", value: n.saturatedFat, unit: "g")
                optRow("Monounsaturated Fat", value: n.monounsaturatedFat, unit: "g")
                optRow("Polyunsaturated Fat", value: n.polyunsaturatedFat, unit: "g")
                optRow("Cholesterol", value: n.cholesterol, unit: "mg")
                optRow("Trans Fat", value: n.transFat, unit: "g")
            }

            Section("Vitamins") {
                optRow("Vitamin A", value: n.vitaminA, unit: "mcg")
                optRow("Vitamin B6", value: n.vitaminB6, unit: "mg")
                optRow("Vitamin B12", value: n.vitaminB12, unit: "mcg")
                optRow("Vitamin C", value: n.vitaminC, unit: "mg")
                optRow("Vitamin D", value: n.vitaminD, unit: "mcg")
                optRow("Vitamin E", value: n.vitaminE, unit: "mg")
                optRow("Vitamin K", value: n.vitaminK, unit: "mcg")
                optRow("Thiamin (B1)", value: n.thiamin, unit: "mg")
                optRow("Riboflavin (B2)", value: n.riboflavin, unit: "mg")
                optRow("Niacin (B3)", value: n.niacin, unit: "mg")
                optRow("Folate", value: n.folate, unit: "mcg")
                optRow("Pantothenic Acid (B5)", value: n.pantothenicAcid, unit: "mg")
                optRow("Biotin", value: n.biotin, unit: "mcg")
            }

            Section("Minerals") {
                optRow("Calcium", value: n.calcium, unit: "mg")
                optRow("Iron", value: n.iron, unit: "mg")
                optRow("Magnesium", value: n.magnesium, unit: "mg")
                optRow("Manganese", value: n.manganese, unit: "mg")
                optRow("Phosphorus", value: n.phosphorus, unit: "mg")
                optRow("Potassium", value: n.potassium, unit: "mg")
                optRow("Zinc", value: n.zinc, unit: "mg")
                optRow("Selenium", value: n.selenium, unit: "mcg")
                optRow("Copper", value: n.copper, unit: "mg")
                optRow("Chromium", value: n.chromium, unit: "mcg")
                optRow("Molybdenum", value: n.molybdenum, unit: "mcg")
                optRow("Chloride", value: n.chloride, unit: "mg")
                optRow("Iodine", value: n.iodine, unit: "mcg")
                optRow("Sodium", value: n.sodium, unit: "mg")
            }

            Section("Other") {
                optRow("Caffeine", value: n.caffeine, unit: "mg")
            }
        }
        .navigationTitle(entry.food.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func row(_ label: String, value: Double, unit: String) -> some View {
        HStack {
            Text(label)
                .font(.subheadline)
            Spacer()
            Text("\(value, specifier: "%.1f") \(unit)")
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private func optRow(_ label: String, value: Double?, unit: String) -> some View {
        if let v = value, v > 0 {
            row(label, value: v * s, unit: unit)
        }
    }
}
