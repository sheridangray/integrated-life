import SwiftUI

struct CleanerRotationView: View {
    @ObservedObject var householdState: HouseholdState

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if let rotation = householdState.cleanerRotation {
                    // Current focus card
                    if let current = rotation.currentEntry {
                        VStack(spacing: 12) {
                            Image(systemName: "sparkles")
                                .font(.largeTitle)
                                .foregroundStyle(.blue)

                            Text("Current Focus")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                                .textCase(.uppercase)

                            Text(current.area)
                                .font(.title2.weight(.bold))

                            Text(current.details)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                        .padding(.horizontal)
                    }

                    // Next run countdown
                    if let days = rotation.daysUntilNext {
                        HStack(spacing: 12) {
                            Image(systemName: "calendar")
                                .foregroundStyle(.orange)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Next Rotation")
                                    .font(.caption.weight(.medium))
                                    .foregroundStyle(.secondary)
                                Text(days == 0 ? "Today" : days == 1 ? "Tomorrow" : "In \(days) days")
                                    .font(.subheadline.weight(.semibold))
                            }

                            Spacer()

                            Text(rotation.nextRunDate)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal)
                    }

                    // Advance button
                    Button {
                        Task { await householdState.advanceCleanerRotation() }
                    } label: {
                        Label("Advance Rotation", systemImage: "arrow.forward.circle.fill")
                            .appActionLabelStyle()
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .padding(.horizontal)

                    Divider()
                        .padding(.horizontal)

                    // Full rotation list
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Full Rotation")
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal)

                        ForEach(rotation.rotation) { entry in
                            HStack(spacing: 12) {
                                Text("\(entry.index + 1)")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(.white)
                                    .frame(width: 24, height: 24)
                                    .background(
                                        entry.index == rotation.nextRotationIndex ? Color.blue : Color.secondary.opacity(0.4),
                                        in: Circle()
                                    )

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(entry.area)
                                        .font(.subheadline.weight(.medium))
                                        .foregroundStyle(entry.index == rotation.nextRotationIndex ? .primary : .secondary)
                                    Text(entry.details)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(2)
                                }

                                Spacer()

                                if entry.index == rotation.nextRotationIndex {
                                    Image(systemName: "arrow.right.circle.fill")
                                        .foregroundStyle(.blue)
                                }
                            }
                            .padding(.horizontal)
                            .padding(.vertical, 6)
                        }
                    }
                } else if householdState.cleanerLoading {
                    ProgressView("Loading rotation...")
                        .padding(.top, 40)
                } else {
                    ContentUnavailableView("No Rotation Set", systemImage: "sparkles", description: Text("Cleaner rotation hasn't been configured yet."))
                }
            }
            .padding(.top)
        }
        .task {
            if householdState.cleanerRotation == nil {
                await householdState.loadCleanerRotation()
            }
        }
    }
}
