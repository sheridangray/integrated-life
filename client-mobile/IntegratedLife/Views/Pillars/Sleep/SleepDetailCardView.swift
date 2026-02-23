import SwiftUI

struct SleepDetailCardView: View {
    let title: String
    let value: String
    let baseline: String?
    let delta: Double?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value)
                    .font(.title3.weight(.semibold))

                if let delta {
                    HStack(spacing: 2) {
                        Image(systemName: delta >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.caption2)
                        Text(String(format: "%+.1f", delta))
                            .font(.caption2)
                    }
                    .foregroundStyle(delta >= 0 ? .green : .red)
                }
            }

            if let baseline {
                Text("Baseline: \(baseline)")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}
