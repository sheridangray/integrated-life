import SwiftUI

struct ScoreRingView: View {
    let score: Int
    let label: String
    var size: CGFloat = 160

    private var progress: Double {
        Double(score) / 100.0
    }

    private var color: Color {
        switch score {
        case 85...100: return .green
        case 70..<85: return .blue
        case 50..<70: return .orange
        default: return .red
        }
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.15), lineWidth: 12)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.8), value: score)

            VStack(spacing: 4) {
                Text("\(score)")
                    .font(.system(size: size * 0.3, weight: .bold, design: .rounded))
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(width: size, height: size)
    }
}
