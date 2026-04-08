import Foundation
import UserNotifications

@MainActor
final class HouseholdState: ObservableObject {
    private let householdService = HouseholdService.shared

    // MARK: - Tasks

    @Published var upcomingTasks: [HouseholdTask] = []
    @Published var allTasks: [HouseholdTask] = []
    @Published var tasksLoading = false

    // MARK: - Cleaner Rotation

    @Published var cleanerRotation: CleanerRotationState?
    @Published var cleanerLoading = false

    // MARK: - Templates

    @Published var templates: [MaintenanceTaskTemplate] = []
    @Published var templatesLoading = false

    // MARK: - Property

    @Published var propertyProfile: PropertyProfile?
    @Published var propertyLoading = false

    // MARK: - Shared

    @Published var isLoading = false
    @Published var error: String?

    // MARK: - Computed

    var overdueTasks: [HouseholdTask] {
        upcomingTasks.filter { $0.isOverdue }
    }

    var pendingTaskCount: Int {
        upcomingTasks.filter { !$0.isDone }.count
    }

    var todayTasks: [HouseholdTask] {
        let today = dateString(from: Date())
        return upcomingTasks.filter { $0.dueDate == today && !$0.isDone }
    }

    var thisWeekTasks: [HouseholdTask] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        guard let weekEnd = cal.date(byAdding: .day, value: 7, to: today) else { return [] }
        let todayStr = dateString(from: today)
        return upcomingTasks.filter { task in
            guard !task.isDone, task.dueDate != todayStr,
                  let due = task.dueDateParsed else { return false }
            return due > today && due <= weekEnd
        }
    }

    var thisMonthTasks: [HouseholdTask] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        guard let weekEnd = cal.date(byAdding: .day, value: 7, to: today),
              let monthEnd = cal.date(byAdding: .month, value: 1, to: today) else { return [] }
        return upcomingTasks.filter { task in
            guard !task.isDone, let due = task.dueDateParsed else { return false }
            return due > weekEnd && due <= monthEnd
        }
    }

    // MARK: - Task Methods

    func loadUpcomingTasks() async {
        tasksLoading = true
        error = nil
        defer { tasksLoading = false }
        do {
            let response = try await householdService.fetchUpcomingTasks()
            upcomingTasks = response.tasks
            if let rotation = response.cleanerRotation {
                cleanerRotation = rotation
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func loadAllTasks(category: MaintenanceCategory? = nil) async {
        tasksLoading = true
        error = nil
        defer { tasksLoading = false }
        do {
            let response = try await householdService.fetchTasks(category: category)
            allTasks = response.items
        } catch {
            self.error = error.localizedDescription
        }
    }

    func completeTask(_ task: HouseholdTask) async {
        do {
            let updated = try await householdService.completeTask(id: task.id)
            replaceTask(updated)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func skipTask(_ task: HouseholdTask, reason: String) async {
        do {
            let updated = try await householdService.skipTask(id: task.id, reason: reason)
            replaceTask(updated)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func replaceTask(_ updated: HouseholdTask) {
        if let i = upcomingTasks.firstIndex(where: { $0.id == updated.id }) {
            upcomingTasks[i] = updated
        }
        if let i = allTasks.firstIndex(where: { $0.id == updated.id }) {
            allTasks[i] = updated
        }
    }

    // MARK: - Cleaner Rotation Methods

    func loadCleanerRotation() async {
        cleanerLoading = true
        error = nil
        defer { cleanerLoading = false }
        do {
            cleanerRotation = try await householdService.fetchCleanerRotation()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func advanceCleanerRotation() async {
        guard let current = cleanerRotation else { return }
        let nextIndex = (current.nextRotationIndex + 1) % current.rotation.count
        let cal = Calendar.current
        let nextDate = cal.date(byAdding: .day, value: 14, to: Date()) ?? Date()
        do {
            cleanerRotation = try await householdService.updateCleanerRotation(
                UpdateCleanerRotationRequest(
                    nextRotationIndex: nextIndex,
                    nextRunDate: dateString(from: nextDate)
                )
            )
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: - Templates Methods

    func loadTemplates() async {
        templatesLoading = true
        error = nil
        defer { templatesLoading = false }
        do {
            templates = try await householdService.fetchTemplates()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func toggleTemplate(_ template: MaintenanceTaskTemplate) async {
        do {
            let updated = try await householdService.updateTemplate(
                id: template.id,
                UpdateTemplateRequest(isActive: !template.isActive)
            )
            if let i = templates.firstIndex(where: { $0.id == updated.id }) {
                templates[i] = updated
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func deleteTemplate(_ template: MaintenanceTaskTemplate) async {
        do {
            try await householdService.deleteTemplate(id: template.id)
            templates.removeAll { $0.id == template.id }
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: - Property Methods

    func loadPropertyProfile() async {
        propertyLoading = true
        error = nil
        defer { propertyLoading = false }
        do {
            propertyProfile = try await householdService.fetchPropertyProfile()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func updatePropertyProfile(_ request: UpdatePropertyProfileRequest) async {
        do {
            propertyProfile = try await householdService.updatePropertyProfile(request)
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: - Overview

    func loadForOverview() async {
        await loadUpcomingTasks()
    }

    // MARK: - Push Notifications

    func scheduleLocalNotifications() {
        let center = UNUserNotificationCenter.current()

        // Monthly maintenance nudge (1st of month, 9am)
        let monthlyContent = UNMutableNotificationContent()
        monthlyContent.title = "Household Maintenance"
        monthlyContent.body = "\(pendingTaskCount) household tasks due this month"
        monthlyContent.sound = .default
        monthlyContent.categoryIdentifier = "HOUSEHOLD_MONTHLY"

        var monthlyComponents = DateComponents()
        monthlyComponents.day = 1
        monthlyComponents.hour = 9
        let monthlyTrigger = UNCalendarNotificationTrigger(dateMatching: monthlyComponents, repeats: true)
        center.add(UNNotificationRequest(identifier: "household.monthly", content: monthlyContent, trigger: monthlyTrigger))

        // Weekly reminder (Sunday 6pm)
        let weeklyContent = UNMutableNotificationContent()
        weeklyContent.title = "Weekly Household Check"
        weeklyContent.body = "Tasks due this week: \(thisWeekTasks.count + todayTasks.count) items"
        weeklyContent.sound = .default
        weeklyContent.categoryIdentifier = "HOUSEHOLD_WEEKLY"

        var weeklyComponents = DateComponents()
        weeklyComponents.weekday = 1 // Sunday
        weeklyComponents.hour = 18
        let weeklyTrigger = UNCalendarNotificationTrigger(dateMatching: weeklyComponents, repeats: true)
        center.add(UNNotificationRequest(identifier: "household.weekly", content: weeklyContent, trigger: weeklyTrigger))

        // Cleaner rotation (Thursday 6pm)
        if let entry = cleanerRotation?.currentEntry {
            let cleanerContent = UNMutableNotificationContent()
            cleanerContent.title = "Cleaner Focus Tomorrow"
            cleanerContent.body = "Tomorrow's cleaner focus: \(entry.area)"
            cleanerContent.sound = .default
            cleanerContent.categoryIdentifier = "HOUSEHOLD_CLEANER"

            var cleanerComponents = DateComponents()
            cleanerComponents.weekday = 5 // Thursday
            cleanerComponents.hour = 18
            let cleanerTrigger = UNCalendarNotificationTrigger(dateMatching: cleanerComponents, repeats: true)
            center.add(UNNotificationRequest(identifier: "household.cleaner", content: cleanerContent, trigger: cleanerTrigger))
        }

        // Overdue alerts
        for task in overdueTasks {
            let overdueContent = UNMutableNotificationContent()
            overdueContent.title = "Overdue Task"
            overdueContent.body = "\(task.title) is overdue"
            overdueContent.sound = .default
            overdueContent.categoryIdentifier = "HOUSEHOLD_OVERDUE"
            overdueContent.userInfo = ["taskId": task.id]

            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
            center.add(UNNotificationRequest(identifier: "household.overdue.\(task.id)", content: overdueContent, trigger: trigger))
        }
    }

    static func registerNotificationCategories() {
        let completeAction = UNNotificationAction(identifier: "COMPLETE", title: "Mark Complete", options: [.foreground])
        let viewAction = UNNotificationAction(identifier: "VIEW", title: "View Tasks", options: [.foreground])

        let monthlyCategory = UNNotificationCategory(identifier: "HOUSEHOLD_MONTHLY", actions: [viewAction], intentIdentifiers: [])
        let weeklyCategory = UNNotificationCategory(identifier: "HOUSEHOLD_WEEKLY", actions: [viewAction], intentIdentifiers: [])
        let cleanerCategory = UNNotificationCategory(identifier: "HOUSEHOLD_CLEANER", actions: [viewAction], intentIdentifiers: [])
        let overdueCategory = UNNotificationCategory(identifier: "HOUSEHOLD_OVERDUE", actions: [completeAction, viewAction], intentIdentifiers: [])

        UNUserNotificationCenter.current().setNotificationCategories([monthlyCategory, weeklyCategory, cleanerCategory, overdueCategory])
    }

    // MARK: - Helpers

    private func dateString(from date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.string(from: date)
    }
}
