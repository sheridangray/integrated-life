import SwiftUI
import Charts

// MARK: - Nutrition Chart View

struct NutritionChartView: View {
    let nutrition: Nutrition
    
    var body: some View {
        VStack(spacing: 16) {
            // Bar chart for macros
            Chart(MacroData.from(nutrition: nutrition)) { data in
                BarMark(
                    x: .value("Macro", data.label),
                    y: .value("Amount", data.value)
                )
                .foregroundStyle(data.color)
                .annotation(position: .top) {
                    Text(data.formattedValue)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .chartXAxis {
                AxisMarks { _ in
                    AxisValueLabels()
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel {
                        if let v = value.as(Double.self) {
                            Text("\(Int(v))g")
                        }
                    }
                }
            }
            .frame(height: 200)
        }
    }
}

// MARK: - Daily Nutrition Chart

struct DailyNutritionChartView: View {
    let dailyNutrition: DailyNutrition
    
    var body: some View {
        VStack(spacing: 16) {
            // Calorie ring
            ZStack {
                Circle()
                    .stroke(Color.secondary.opacity(0.2), lineWidth: 12)
                Circle()
                    .trim(from: 0, to: min(1, dailyNutrition.totals.calories / 2000))
                    .stroke(
                        LinearGradient(
                            colors: [.orange, .red],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.easeOut, value: dailyNutrition.totals.calories)
                
                VStack(spacing: 4) {
                    Text("\(Int(dailyNutrition.totals.calories))")
                        .font(.title.bold())
                    Text("cal")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 120, height: 120)
            
            // Macro percentages
            HStack(spacing: 20) {
                MacroPercentageView(
                    label: "Protein",
                    grams: dailyNutrition.totals.protein,
                    color: .red,
                    target: 150
                )
                MacroPercentageView(
                    label: "Carbs",
                    grams: dailyNutrition.totals.carbs,
                    color: .blue,
                    target: 250
                )
                MacroPercentageView(
                    label: "Fat",
                    grams: dailyNutrition.totals.fat,
                    color: .yellow,
                    target: 65
                )
                MacroPercentageView(
                    label: "Fiber",
                    grams: dailyNutrition.totals.fiber,
                    color: .green,
                    target: 30
                )
            }
            
            // Bar chart for detailed view
            Chart(MacroData.from(nutrition: dailyNutrition.totals)) { data in
                BarMark(
                    x: .value("Macro", data.label),
                    y: .value("Amount", data.value)
                )
                .foregroundStyle(data.color.gradient)
            }
            .chartXAxis {
                AxisMarks { _ in
                    AxisValueLabels()
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading)
            }
            .frame(height: 150)
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Macro Percentage View

struct MacroPercentageView: View {
    let label: String
    let grams: Double
    let color: Color
    let target: Double
    
    private var percentage: Double {
        min(1, grams / target)
    }
    
    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                Circle()
                    .stroke(Color.secondary.opacity(0.15), lineWidth: 4)
                Circle()
                    .trim(from: 0, to: percentage)
                    .stroke(color, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .rotationEffect(.degrees(-90))
            }
            .frame(width: 44, height: 44)
            .overlay(
                Text("\(Int(percentage * 100))%")
                    .font(.caption2.weight(.semibold))
            )
            
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            
            Text("\(Int(grams))g")
                .font(.caption)
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Supporting Types

struct MacroData: Identifiable {
    let id = UUID()
    let label: String
    let value: Double
    let color: Color
    
    var formattedValue: String {
        "\(Int(value))g"
    }
    
    static func from(nutrition: Nutrition) -> [MacroData] {
        [
            MacroData(label: "Protein", value: nutrition.protein, color: .red),
            MacroData(label: "Carbs", value: nutrition.carbs, color: .blue),
            MacroData(label: "Fat", value: nutrition.fat, color: .yellow),
            MacroData(label: "Fiber", value: nutrition.fiber, color: .green)
        ]
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 20) {
        NutritionChartView(nutrition: Nutrition(
            calories: 450,
            protein: 32,
            carbs: 48,
            fat: 14,
            fiber: 6
        ))
        .padding()
        
        DailyNutritionChartView(dailyNutrition: DailyNutrition(
            date: "2024-01-15",
            totals: Nutrition(
                calories: 1850,
                protein: 95,
                carbs: 220,
                fat: 58,
                fiber: 28
            ),
            entries: []
        ))
    }
    .padding()
}
