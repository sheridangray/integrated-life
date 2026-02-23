import SwiftUI

// MARK: - Button Styles

struct PrimaryButtonStyle: ButtonStyle {
	func makeBody(configuration: Configuration) -> some View {
		configuration.label
			.font(.body.weight(.medium))
			.frame(maxWidth: .infinity)
			.frame(height: AppMetrics.buttonHeight)
			.background(Color.blue.opacity(configuration.isPressed ? 0.85 : 1.0))
			.foregroundStyle(.white)
			.cornerRadius(10)
	}
}

struct SecondaryButtonStyle: ButtonStyle {
	func makeBody(configuration: Configuration) -> some View {
		configuration.label
			.font(.body.weight(.medium))
			.frame(maxWidth: .infinity)
			.frame(height: AppMetrics.buttonHeight)
			.background(Color.blue.opacity(configuration.isPressed ? 0.15 : 0.1))
			.foregroundStyle(.blue)
			.cornerRadius(10)
	}
}

struct SuccessButtonStyle: ButtonStyle {
	func makeBody(configuration: Configuration) -> some View {
		configuration.label
			.font(.body.weight(.medium))
			.frame(maxWidth: .infinity)
			.frame(height: AppMetrics.buttonHeight)
			.background(Color.green.opacity(configuration.isPressed ? 0.85 : 1.0))
			.foregroundStyle(.white)
			.cornerRadius(10)
	}
}

// MARK: - Metrics

enum AppMetrics {
	static let buttonHeight: CGFloat = 50
	static let inputHeight: CGFloat = 50
}

// MARK: - Helpers

enum YouTubeHelper {
	static func thumbnailURL(from videoUrl: String) -> URL? {
		guard let url = URL(string: videoUrl) else { return nil }
		var videoId: String?
		if url.host?.contains("youtube.com") == true {
			videoId = URLComponents(url: url, resolvingAgainstBaseURL: false)?
				.queryItems?.first(where: { $0.name == "v" })?.value
		} else if url.host?.contains("youtu.be") == true {
			videoId = url.lastPathComponent
		}
		guard let videoId, !videoId.isEmpty else { return nil }
		return URL(string: "https://img.youtube.com/vi/\(videoId)/hqdefault.jpg")
	}
}

enum DateFormatting {
	private static let isoFormatter: ISO8601DateFormatter = {
		let f = ISO8601DateFormatter()
		f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
		return f
	}()

	private static let isoFormatterBasic: ISO8601DateFormatter = {
		let f = ISO8601DateFormatter()
		return f
	}()

	static func parseISO(_ string: String) -> Date? {
		isoFormatter.date(from: string) ?? isoFormatterBasic.date(from: string)
	}

	static func displayDate(_ isoString: String) -> String {
		guard let date = parseISO(isoString) else { return isoString }
		let formatter = DateFormatter()
		formatter.dateStyle = .medium
		formatter.timeStyle = .none
		return formatter.string(from: date)
	}

	static func displayTime(_ isoString: String) -> String {
		guard let date = parseISO(isoString) else { return isoString }
		let formatter = DateFormatter()
		formatter.timeStyle = .short
		return formatter.string(from: date)
	}
}
