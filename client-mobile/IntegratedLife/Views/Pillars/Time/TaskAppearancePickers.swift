import SwiftUI

// MARK: - Color & Icon Presets

enum TaskColors {
	static let presets: [String] = [
		"#FF6B6B", "#FF8E72", "#FFA94D", "#FFD43B",
		"#69DB7C", "#38D9A9", "#4DABF7", "#748FFC",
		"#9775FA", "#DA77F2", "#F783AC", "#868E96"
	]
}

enum TaskIcons {
	static let presets: [String] = [
		"circle.fill", "star.fill", "heart.fill", "bolt.fill",
		"cup.and.saucer.fill", "fork.knife", "figure.walk",
		"book.fill", "laptopcomputer", "phone.fill",
		"envelope.fill", "cart.fill", "house.fill",
		"car.fill", "airplane", "bed.double.fill",
		"leaf.fill", "music.note", "gamecontroller.fill",
		"paintbrush.fill", "wrench.fill", "graduationcap.fill",
		"dumbbell.fill", "cross.fill", "person.2.fill"
	]
}

// MARK: - Duration Presets

enum DurationPreset: CaseIterable, Identifiable {
	case fifteenMin, thirtyMin, oneHour, ninetyMin, twoHour

	var id: Int { minutes }

	var minutes: Int {
		switch self {
		case .fifteenMin: return 15
		case .thirtyMin: return 30
		case .oneHour: return 60
		case .ninetyMin: return 90
		case .twoHour: return 120
		}
	}

	var label: String {
		switch self {
		case .fifteenMin: return "15m"
		case .thirtyMin: return "30m"
		case .oneHour: return "1h"
		case .ninetyMin: return "1.5h"
		case .twoHour: return "2h"
		}
	}
}

// MARK: - Reusable Color Picker Row

struct TaskColorPickerRow: View {
	@Binding var selectedColor: String

	var body: some View {
		ScrollView(.horizontal, showsIndicators: false) {
			HStack(spacing: 10) {
				ForEach(TaskColors.presets, id: \.self) { hex in
					Circle()
						.fill(Color(hex: hex) ?? .gray)
						.frame(width: 32, height: 32)
						.overlay {
							if hex == selectedColor {
								Circle().stroke(.white, lineWidth: 2)
									.frame(width: 26, height: 26)
							}
						}
						.onTapGesture { selectedColor = hex }
				}
			}
			.padding(.vertical, 4)
		}
	}
}

// MARK: - Reusable Icon Picker Row

struct TaskIconPickerRow: View {
	@Binding var selectedIcon: String
	let tintColor: String

	var body: some View {
		ScrollView(.horizontal, showsIndicators: false) {
			HStack(spacing: 12) {
				ForEach(TaskIcons.presets, id: \.self) { name in
					Image(systemName: name)
						.font(.title3)
						.frame(width: 36, height: 36)
						.background(
							name == selectedIcon
								? (Color(hex: tintColor) ?? .blue).opacity(0.2)
								: Color.clear,
							in: RoundedRectangle(cornerRadius: 8)
						)
						.foregroundStyle(
							name == selectedIcon
								? (Color(hex: tintColor) ?? .blue)
								: .secondary
						)
						.onTapGesture { selectedIcon = name }
				}
			}
			.padding(.vertical, 4)
		}
	}
}
