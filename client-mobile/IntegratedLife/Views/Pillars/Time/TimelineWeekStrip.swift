import SwiftUI

struct TimelineWeekStrip: View {
	@Binding var selectedDate: Date
	let onSelect: (Date) -> Void

	private let calendar = Calendar.current
	private let dayWidth: CGFloat = 48
	private let totalDays = 21

	private var days: [Date] {
		let startOfSelectedWeek = calendar.date(
			from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate)
		) ?? selectedDate
		let rangeStart = calendar.date(byAdding: .day, value: -7, to: startOfSelectedWeek) ?? startOfSelectedWeek
		return (0..<totalDays).compactMap { calendar.date(byAdding: .day, value: $0, to: rangeStart) }
	}

	var body: some View {
		ScrollViewReader { proxy in
			ScrollView(.horizontal, showsIndicators: false) {
				HStack(spacing: 4) {
					ForEach(days, id: \.timeIntervalSince1970) { day in
						DayCell(
							date: day,
							isSelected: calendar.isDate(day, inSameDayAs: selectedDate),
							isToday: calendar.isDateInToday(day)
						)
						.id(calendar.startOfDay(for: day))
						.onTapGesture {
							withAnimation(.easeInOut(duration: 0.2)) {
								selectedDate = calendar.startOfDay(for: day)
							}
							onSelect(day)
						}
					}
				}
				.padding(.horizontal, 12)
			}
			.frame(height: 64)
			.onAppear {
				proxy.scrollTo(calendar.startOfDay(for: selectedDate), anchor: .center)
			}
			.onChange(of: selectedDate) { _, newDate in
				withAnimation {
					proxy.scrollTo(calendar.startOfDay(for: newDate), anchor: .center)
				}
			}
		}
	}
}

private struct DayCell: View {
	let date: Date
	let isSelected: Bool
	let isToday: Bool

	private let calendar = Calendar.current

	var body: some View {
		VStack(spacing: 4) {
			Text(date, format: .dateTime.weekday(.abbreviated))
				.font(.caption2)
				.foregroundStyle(isSelected ? .white : isToday ? .blue : .secondary)

			Text("\(calendar.component(.day, from: date))")
				.font(.subheadline.weight(isSelected || isToday ? .bold : .regular))
				.foregroundStyle(isSelected ? .white : isToday ? .blue : .primary)
		}
		.frame(width: 44, height: 52)
		.background(
			RoundedRectangle(cornerRadius: 12)
				.fill(isSelected ? Color.blue : Color.clear)
		)
	}
}
