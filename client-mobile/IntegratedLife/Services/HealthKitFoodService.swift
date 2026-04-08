import Foundation
import HealthKit

final class HealthKitFoodService {
    static let shared = HealthKitFoodService()

    private let healthStore = HKHealthStore()

    /// All nutrition quantity types we write to HealthKit.
    static let nutritionWriteTypes: Set<HKSampleType> = {
        var types = Set<HKSampleType>()
        for mapping in NutritionMapping.all {
            if let qt = HKQuantityType.quantityType(forIdentifier: mapping.typeId) {
                types.insert(qt)
            }
        }
        return types
    }()

    private init() {}

    // MARK: - Permissions

    var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    func requestWritePermission() async throws -> Bool {
        guard isAvailable else { return false }
        try await healthStore.requestAuthorization(toShare: Self.nutritionWriteTypes, read: [])
        // Check at least calories is authorized as a proxy
        guard let caloriesType = HKQuantityType.quantityType(forIdentifier: .dietaryEnergyConsumed) else {
            return false
        }
        return healthStore.authorizationStatus(for: caloriesType) == .sharingAuthorized
    }

    var hasWritePermission: Bool {
        guard let caloriesType = HKQuantityType.quantityType(forIdentifier: .dietaryEnergyConsumed) else {
            return false
        }
        return healthStore.authorizationStatus(for: caloriesType) == .sharingAuthorized
    }

    // MARK: - Write Food Log

    func writeFoodLogEntry(_ entry: FoodLogEntry) async throws {
        let nutrition = entry.food.nutrition
        let servings = entry.servings
        let date = Self.parseDate(entry.date) ?? Date()

        let metadata: [String: Any] = [
            HKMetadataKeyFoodType: entry.food.name,
            "FoodLogId": entry.id,
            "MealType": entry.mealType.rawValue,
            "Source": entry.source.rawValue,
        ]

        var samples: [HKQuantitySample] = []
        for mapping in NutritionMapping.all {
            let value = mapping.extractor(nutrition) * servings
            guard value > 0 else { continue }
            guard let quantityType = HKQuantityType.quantityType(forIdentifier: mapping.typeId) else { continue }

            let quantity = HKQuantity(unit: mapping.unit, doubleValue: value)
            let sample = HKQuantitySample(
                type: quantityType,
                quantity: quantity,
                start: date,
                end: date,
                metadata: metadata
            )
            samples.append(sample)
        }

        guard !samples.isEmpty else { return }
        try await healthStore.save(samples)
    }

    // MARK: - Helpers

    private static func parseDate(_ dateString: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        guard let day = formatter.date(from: dateString) else { return nil }
        // Set to noon so the entry appears mid-day in Health
        return Calendar.current.date(bySettingHour: 12, minute: 0, second: 0, of: day)
    }
}

// MARK: - Nutrition Field → HealthKit Mapping

struct NutritionMapping {
    let typeId: HKQuantityTypeIdentifier
    let unit: HKUnit
    let extractor: (Nutrition) -> Double

    static let all: [NutritionMapping] = [
        // Basic macros
        NutritionMapping(typeId: .dietaryEnergyConsumed, unit: .kilocalorie()) { $0.calories },
        NutritionMapping(typeId: .dietaryProtein, unit: .gram()) { $0.protein },
        NutritionMapping(typeId: .dietaryFatTotal, unit: .gram()) { $0.fat },
        NutritionMapping(typeId: .dietaryCarbohydrates, unit: .gram()) { $0.carbs },
        NutritionMapping(typeId: .dietaryFiber, unit: .gram()) { $0.fiber },

        // Expanded macros
        NutritionMapping(typeId: .dietarySugar, unit: .gram()) { $0.sugar ?? 0 },
        NutritionMapping(typeId: .dietaryWater, unit: .literUnit(with: .milli)) { $0.water ?? 0 },

        // Fat breakdown
        NutritionMapping(typeId: .dietaryFatSaturated, unit: .gram()) { $0.saturatedFat ?? 0 },
        NutritionMapping(typeId: .dietaryFatMonounsaturated, unit: .gram()) { $0.monounsaturatedFat ?? 0 },
        NutritionMapping(typeId: .dietaryFatPolyunsaturated, unit: .gram()) { $0.polyunsaturatedFat ?? 0 },
        NutritionMapping(typeId: .dietaryCholesterol, unit: .gramUnit(with: .milli)) { $0.cholesterol ?? 0 },

        // Vitamins
        NutritionMapping(typeId: .dietaryVitaminA, unit: .gramUnit(with: .micro)) { $0.vitaminA ?? 0 },
        NutritionMapping(typeId: .dietaryVitaminB6, unit: .gramUnit(with: .milli)) { $0.vitaminB6 ?? 0 },
        NutritionMapping(typeId: .dietaryVitaminB12, unit: .gramUnit(with: .micro)) { $0.vitaminB12 ?? 0 },
        NutritionMapping(typeId: .dietaryVitaminC, unit: .gramUnit(with: .milli)) { $0.vitaminC ?? 0 },
        NutritionMapping(typeId: .dietaryVitaminD, unit: .gramUnit(with: .micro)) { $0.vitaminD ?? 0 },
        NutritionMapping(typeId: .dietaryVitaminE, unit: .gramUnit(with: .milli)) { $0.vitaminE ?? 0 },
        NutritionMapping(typeId: .dietaryVitaminK, unit: .gramUnit(with: .micro)) { $0.vitaminK ?? 0 },
        NutritionMapping(typeId: .dietaryThiamin, unit: .gramUnit(with: .milli)) { $0.thiamin ?? 0 },
        NutritionMapping(typeId: .dietaryRiboflavin, unit: .gramUnit(with: .milli)) { $0.riboflavin ?? 0 },
        NutritionMapping(typeId: .dietaryNiacin, unit: .gramUnit(with: .milli)) { $0.niacin ?? 0 },
        NutritionMapping(typeId: .dietaryFolate, unit: .gramUnit(with: .micro)) { $0.folate ?? 0 },
        NutritionMapping(typeId: .dietaryPantothenicAcid, unit: .gramUnit(with: .milli)) { $0.pantothenicAcid ?? 0 },
        NutritionMapping(typeId: .dietaryBiotin, unit: .gramUnit(with: .micro)) { $0.biotin ?? 0 },

        // Minerals
        NutritionMapping(typeId: .dietaryCalcium, unit: .gramUnit(with: .milli)) { $0.calcium ?? 0 },
        NutritionMapping(typeId: .dietaryIron, unit: .gramUnit(with: .milli)) { $0.iron ?? 0 },
        NutritionMapping(typeId: .dietaryMagnesium, unit: .gramUnit(with: .milli)) { $0.magnesium ?? 0 },
        NutritionMapping(typeId: .dietaryManganese, unit: .gramUnit(with: .milli)) { $0.manganese ?? 0 },
        NutritionMapping(typeId: .dietaryPhosphorus, unit: .gramUnit(with: .milli)) { $0.phosphorus ?? 0 },
        NutritionMapping(typeId: .dietaryPotassium, unit: .gramUnit(with: .milli)) { $0.potassium ?? 0 },
        NutritionMapping(typeId: .dietaryZinc, unit: .gramUnit(with: .milli)) { $0.zinc ?? 0 },
        NutritionMapping(typeId: .dietarySelenium, unit: .gramUnit(with: .micro)) { $0.selenium ?? 0 },
        NutritionMapping(typeId: .dietaryCopper, unit: .gramUnit(with: .milli)) { $0.copper ?? 0 },
        NutritionMapping(typeId: .dietaryChromium, unit: .gramUnit(with: .micro)) { $0.chromium ?? 0 },
        NutritionMapping(typeId: .dietaryMolybdenum, unit: .gramUnit(with: .micro)) { $0.molybdenum ?? 0 },
        NutritionMapping(typeId: .dietaryChloride, unit: .gramUnit(with: .milli)) { $0.chloride ?? 0 },
        NutritionMapping(typeId: .dietaryIodine, unit: .gramUnit(with: .micro)) { $0.iodine ?? 0 },
        NutritionMapping(typeId: .dietarySodium, unit: .gramUnit(with: .milli)) { $0.sodium ?? 0 },

        // Other
        NutritionMapping(typeId: .dietaryCaffeine, unit: .gramUnit(with: .milli)) { $0.caffeine ?? 0 },
    ]
}
