import SwiftUI

struct SleepStageBarView: View {
    let deep: Double?
    let core: Double?
    let rem: Double?
    let awake: Double?

    private var segments: [(label: String, value: Double, color: Color)] {
        var result: [(String, Double, Color)] = []
        if let deep, deep > 0 { result.append(("Deep", deep, .indigo)) }
        if let core, core > 0 { result.append(("Core", core, .blue)) }
        if let rem, rem > 0 { result.append(("REM", rem, .cyan)) }
        if let awake, awake > 0 { result.append(("Awake", awake, .orange)) }
        return result
    }

    private var total: Double {
        segments.reduce(0) { $0 + $1.value }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if total > 0 {
                GeometryReader { geo in
                    HStack(spacing: 2) {
                        ForEach(segments.indices, id: \.self) { i in
                            let segment = segments[i]
                            let fraction = segment.value / total
                            RoundedRectangle(cornerRadius: 4)
                                .fill(segment.color)
                                .frame(width: max(4, geo.size.width * fraction))
                        }
                    }
                }
                .frame(height: 24)
                .clipShape(RoundedRectangle(cornerRadius: 6))

                HStack(spacing: 16) {
                    ForEach(segments.indices, id: \.self) { i in
                        let segment = segments[i]
                        HStack(spacing: 4) {
                            Circle()
                                .fill(segment.color)
                                .frame(width: 8, height: 8)
                            Text("\(segment.label) \(formatMinutes(segment.value))")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            } else {
                Text("No stage data available")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func formatMinutes(_ mins: Double) -> String {
        let h = Int(mins) / 60
        let m = Int(mins) % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }
}
