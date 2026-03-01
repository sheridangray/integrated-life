import SwiftUI

struct CategoryPickerSheet: View {
	let onSelect: (TimeCategory) -> Void
	@Environment(\.dismiss) private var dismiss
	@State private var selectedBucket: MetaBucket?

	var body: some View {
		NavigationStack {
			Group {
				if let bucket = selectedBucket {
					categoryList(for: bucket)
				} else {
					bucketGrid
				}
			}
			.navigationTitle(selectedBucket == nil ? "Start Tracking" : selectedBucket!.rawValue)
			.navigationBarTitleDisplayMode(.inline)
			.toolbar {
				ToolbarItem(placement: .cancellationAction) {
					Button("Cancel") { dismiss() }
				}
				if selectedBucket != nil {
					ToolbarItem(placement: .navigationBarLeading) {
						Button {
							withAnimation { selectedBucket = nil }
						} label: {
							Image(systemName: "chevron.left")
						}
					}
				}
			}
		}
	}

	private var bucketGrid: some View {
		ScrollView {
			LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
				ForEach(MetaBucket.allCases, id: \.self) { bucket in
					Button {
						withAnimation { selectedBucket = bucket }
					} label: {
						VStack(spacing: 8) {
							Image(systemName: bucket.icon)
								.font(.title)
								.foregroundStyle(bucket.color)
							Text(bucket.rawValue)
								.font(.subheadline.weight(.medium))
								.foregroundStyle(.primary)
						}
						.frame(maxWidth: .infinity)
						.frame(height: 100)
						.background(bucket.color.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
					}
					.buttonStyle(.plain)
				}
			}
			.padding()
		}
	}

	private func categoryList(for bucket: MetaBucket) -> some View {
		let categories = TimeCategory.all.filter { $0.metaBucket == bucket }
		return List(categories) { category in
			Button {
				onSelect(category)
				dismiss()
			} label: {
				VStack(alignment: .leading, spacing: 4) {
					Text(category.name)
						.font(.body.weight(.medium))
						.foregroundStyle(.primary)
					Text(category.description)
						.font(.caption)
						.foregroundStyle(.secondary)
				}
				.padding(.vertical, 4)
			}
		}
		.listStyle(.plain)
	}
}
