import SwiftUI

struct HouseholdSettingsView: View {
    @ObservedObject var householdState: HouseholdState

    @State private var notificationsEnabled = UserDefaults.standard.bool(forKey: "household.notifications.enabled")

    var body: some View {
        List {
            // Property Profile
            Section("Property") {
                if let property = householdState.propertyProfile {
                    LabeledContent("Name", value: property.name)
                    LabeledContent("Type", value: property.type.displayName)
                    LabeledContent("HOA", value: property.hasHOA ? "Yes" : "No")
                    if property.hasHOA {
                        LabeledContent("HOA Covers Exterior", value: property.hoaCoversExterior ? "Yes" : "No")
                    }
                    if let appliances = property.appliances, !appliances.isEmpty {
                        LabeledContent("Appliances") {
                            Text(appliances.joined(separator: ", "))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                    if let systems = property.systems, !systems.isEmpty {
                        LabeledContent("Systems") {
                            Text(systems.joined(separator: ", "))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                } else if householdState.propertyLoading {
                    ProgressView()
                } else {
                    Text("No property profile configured")
                        .foregroundStyle(.secondary)
                }
            }

            // Maintenance Templates
            Section("Maintenance Templates") {
                if householdState.templatesLoading {
                    ProgressView()
                } else if householdState.templates.isEmpty {
                    Text("No templates loaded")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(householdState.templates) { template in
                        TemplateRow(template: template) {
                            Task { await householdState.toggleTemplate(template) }
                        }
                    }
                }
            }

            // Notifications
            Section("Notifications") {
                Toggle("Enable Notifications", isOn: $notificationsEnabled)
                    .onChange(of: notificationsEnabled) { _, newValue in
                        UserDefaults.standard.set(newValue, forKey: "household.notifications.enabled")
                        if newValue {
                            requestNotificationPermission()
                            householdState.scheduleLocalNotifications()
                        } else {
                            UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
                        }
                    }

                if notificationsEnabled {
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundStyle(.blue)
                        VStack(alignment: .leading) {
                            Text("Monthly Nudge")
                                .font(.subheadline)
                            Text("1st of month, 9:00 AM")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    HStack {
                        Image(systemName: "bell")
                            .foregroundStyle(.green)
                        VStack(alignment: .leading) {
                            Text("Weekly Reminder")
                                .font(.subheadline)
                            Text("Sunday, 6:00 PM")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    HStack {
                        Image(systemName: "sparkles")
                            .foregroundStyle(.orange)
                        VStack(alignment: .leading) {
                            Text("Cleaner Rotation")
                                .font(.subheadline)
                            Text("Thursday, 6:00 PM")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    HStack {
                        Image(systemName: "exclamationmark.triangle")
                            .foregroundStyle(.red)
                        VStack(alignment: .leading) {
                            Text("Overdue Alerts")
                                .font(.subheadline)
                            Text("When task passes due date")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .task {
            async let p: () = householdState.loadPropertyProfile()
            async let t: () = householdState.loadTemplates()
            _ = await (p, t)
        }
    }

    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { _, _ in }
    }
}

// MARK: - Template Row

private struct TemplateRow: View {
    let template: MaintenanceTaskTemplate
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: template.category.icon)
                .foregroundStyle(template.isActive ? .blue : .secondary)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(template.title)
                    .font(.subheadline)
                    .foregroundStyle(template.isActive ? .primary : .secondary)

                HStack(spacing: 6) {
                    Text(template.frequency.displayName)
                        .font(.caption2)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 1)
                        .background(Color.blue.opacity(0.12), in: Capsule())

                    Text(template.diyVsHire.displayName)
                        .font(.caption2)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 1)
                        .background(Color.secondary.opacity(0.12), in: Capsule())

                    if let cost = template.cost {
                        Text("$\(Int(cost))")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Spacer()

            Button {
                onToggle()
            } label: {
                Image(systemName: template.isActive ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(template.isActive ? .green : .secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 2)
    }
}
