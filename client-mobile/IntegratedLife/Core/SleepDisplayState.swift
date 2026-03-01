import Foundation

@MainActor
final class SleepDisplayState: ObservableObject {
    private let sleepDisplayService = SleepDisplayService()

    @Published var selectedPeriod: SleepPeriod = .day
    @Published var dayData: SleepNightDisplay?
    @Published var weekData: [SleepNightDisplay] = []
    @Published var monthData: [SleepNightDisplay] = []
    @Published var sixMonthsData: [SleepNightDisplay] = []
    @Published var isLoading = false
    @Published var error: String?

    var currentNights: [SleepNightDisplay] {
        switch selectedPeriod {
        case .day: return dayData.map { [$0] } ?? []
        case .week: return weekData
        case .month: return monthData
        case .sixMonths: return sixMonthsData
        }
    }

    var timeAsleepLabel: String {
        switch selectedPeriod {
        case .day: return "TIME ASLEEP"
        case .week, .month, .sixMonths: return "AVG. TIME ASLEEP"
        }
    }

    var timeAsleepValue: String? {
        switch selectedPeriod {
        case .day:
            guard let night = dayData else { return nil }
            return formatMinutes(night.totalAsleepMinutes)
        case .week, .month, .sixMonths:
            let nights = currentNights
            guard !nights.isEmpty else { return nil }
            let avg = nights.reduce(0.0) { $0 + $1.totalAsleepMinutes } / Double(nights.count)
            return formatMinutes(avg)
        }
    }

    var averageStageDurations: SleepStageDurations? {
        let nights = currentNights
        guard !nights.isEmpty else { return nil }
        let count = Double(nights.count)
        let awake = nights.reduce(0.0) { $0 + $1.stageDurations.awake } / count
        let rem = nights.reduce(0.0) { $0 + $1.stageDurations.rem } / count
        let core = nights.reduce(0.0) { $0 + $1.stageDurations.core } / count
        let deep = nights.reduce(0.0) { $0 + $1.stageDurations.deep } / count
        return SleepStageDurations(awake: awake, rem: rem, core: core, deep: deep)
    }

    func loadData() async {
        isLoading = true
        error = nil
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())

        do {
            switch selectedPeriod {
            case .day:
                dayData = try await sleepDisplayService.fetchSleepForDay(date: today)
            case .week:
                weekData = try await sleepDisplayService.fetchSleepForWeek(ending: today)
            case .month:
                monthData = try await sleepDisplayService.fetchSleepForMonth(ending: today)
            case .sixMonths:
                sixMonthsData = try await sleepDisplayService.fetchSleepForSixMonths(ending: today)
            }
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    private func formatMinutes(_ minutes: Double) -> String {
        let h = Int(minutes) / 60
        let m = Int(minutes) % 60
        return "\(h) hr \(m) min"
    }
}
