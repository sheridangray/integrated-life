import Foundation

@MainActor
final class TimeState: ObservableObject {
	private let timeService = TimeService.shared

	// MARK: - Day planning state

	@Published var selectedDate: Date = Calendar.current.startOfDay(for: Date())
	@Published var tasks: [TimeTask] = []
	@Published var inboxTasks: [TimeTask] = []
	@Published var isLoading = false
	@Published var error: String?

	var selectedDateString: String {
		Self.dateFormatter.string(from: selectedDate)
	}

	var timedTasks: [TimeTask] {
		tasks.filter { !$0.isAllDay && !$0.isInboxTask }.sorted {
			($0.startMinuteOfDay ?? 0) < ($1.startMinuteOfDay ?? 0)
		}
	}

	var allDayTasks: [TimeTask] {
		tasks.filter { $0.isAllDay && !$0.isInboxTask }
	}

	private static let dateFormatter: DateFormatter = {
		let f = DateFormatter()
		f.dateFormat = "yyyy-MM-dd"
		f.locale = Locale(identifier: "en_US_POSIX")
		return f
	}()

	// MARK: - Overdue auto-move

	/// Fetches yesterday's incomplete tasks and moves them to today.
	func migrateOverdueTasks() async {
		let cal = Calendar.current
		guard let yesterday = cal.date(byAdding: .day, value: -1, to: cal.startOfDay(for: Date())) else { return }
		let yesterdayStr = Self.dateFormatter.string(from: yesterday)
		let todayStr = Self.dateFormatter.string(from: cal.startOfDay(for: Date()))

		do {
			let yesterdayTasks = try await timeService.fetchTasks(date: yesterdayStr)
			let overdue = yesterdayTasks.filter { $0.completedAt == nil && $0.isEditable }
			for task in overdue {
				let request = UpdateTimeTaskRequest(date: todayStr)
				_ = try await timeService.updateTask(id: task.id, request)
			}
		} catch {
			// Non-critical: silently skip if migration fails
		}
	}

	// MARK: - Task CRUD

	func loadTasks() async {
		isLoading = true
		error = nil
		defer { isLoading = false }
		do {
			tasks = try await timeService.fetchTasks(date: selectedDateString)
		} catch {
			self.error = error.localizedDescription
		}
	}

	func loadTasks(for date: Date) async {
		selectedDate = Calendar.current.startOfDay(for: date)
		await loadTasks()
	}

	func loadInboxTasks() async {
		isLoading = true
		error = nil
		defer { isLoading = false }
		do {
			inboxTasks = try await timeService.fetchInboxTasks()
		} catch {
			self.error = error.localizedDescription
		}
	}

	func createTask(
		title: String,
		date: String?,
		startTime: String?,
		durationMinutes: Int,
		color: String,
		icon: String,
		notes: String?
	) async {
		do {
			let request = CreateTimeTaskRequest(
				title: title,
				date: date,
				startTime: startTime,
				durationMinutes: durationMinutes,
				color: color,
				icon: icon,
				notes: notes,
				isRecurring: false,
				recurrenceRule: nil
			)
			let task = try await timeService.createTask(request)
			if task.isInboxTask {
				inboxTasks.insert(task, at: 0)
			} else {
				tasks.append(task)
			}
		} catch {
			self.error = error.localizedDescription
		}
	}

	func updateTask(id: String, request: UpdateTimeTaskRequest) async {
		do {
			let updated = try await timeService.updateTask(id: id, request)
			if let idx = tasks.firstIndex(where: { $0.id == id }) {
				if updated.isInboxTask {
					tasks.remove(at: idx)
					inboxTasks.insert(updated, at: 0)
				} else {
					tasks[idx] = updated
				}
			} else if let idx = inboxTasks.firstIndex(where: { $0.id == id }) {
				if updated.isInboxTask {
					inboxTasks[idx] = updated
				} else {
					inboxTasks.remove(at: idx)
					tasks.append(updated)
				}
			}
		} catch {
			self.error = error.localizedDescription
		}
	}

	func toggleCompletion(task: TimeTask) async {
		let newValue = task.isCompleted ? nil : ISO8601DateFormatter().string(from: Date())
		await updateTask(id: task.id, request: UpdateTimeTaskRequest(completedAt: newValue))
	}

	func deleteTask(id: String) async {
		do {
			try await timeService.deleteTask(id: id)
			tasks.removeAll { $0.id == id }
			inboxTasks.removeAll { $0.id == id }
		} catch {
			self.error = error.localizedDescription
		}
	}

	func navigateDay(offset: Int) async {
		guard let next = Calendar.current.date(byAdding: .day, value: offset, to: selectedDate) else { return }
		await loadTasks(for: next)
	}

	// MARK: - Routines

	@Published var routines: [TimeRoutine] = []

	func loadRoutines() async {
		do {
			routines = try await timeService.fetchRoutines()
		} catch {
			self.error = error.localizedDescription
		}
	}

	func createRoutine(
		title: String,
		defaultTime: String?,
		defaultDuration: Int,
		color: String,
		icon: String,
		notes: String?,
		recurrenceRule: TimeTaskRecurrenceRule
	) async {
		do {
			let request = CreateRoutineRequest(
				title: title,
				defaultTime: defaultTime,
				defaultDuration: defaultDuration,
				color: color,
				icon: icon,
				notes: notes,
				recurrenceRule: recurrenceRule
			)
			let routine = try await timeService.createRoutine(request)
			routines.insert(routine, at: 0)
			await loadTasks()
		} catch {
			self.error = error.localizedDescription
		}
	}

	func updateRoutine(id: String, request: UpdateRoutineRequest) async {
		do {
			let updated = try await timeService.updateRoutine(id: id, request)
			if let idx = routines.firstIndex(where: { $0.id == id }) {
				routines[idx] = updated
			}
		} catch {
			self.error = error.localizedDescription
		}
	}

	func toggleRoutineActive(routine: TimeRoutine) async {
		let request = UpdateRoutineRequest(isActive: !routine.isActive)
		await updateRoutine(id: routine.id, request: request)
		await loadTasks()
	}

	func deleteRoutine(id: String) async {
		do {
			try await timeService.deleteRoutine(id: id)
			routines.removeAll { $0.id == id }
			await loadTasks()
		} catch {
			self.error = error.localizedDescription
		}
	}

	/// When deleting a routine-sourced task, skip just today by also deleting the task
	func skipRoutineToday(task: TimeTask) async {
		guard task.isRoutineInstance else { return }
		await deleteTask(id: task.id)
	}

	// MARK: - Legacy (active entries for HomeView)

	@Published var activeEntries: [TimeEntry] = []

	func loadActiveEntries() async {
		do {
			activeEntries = try await timeService.fetchActiveEntries()
		} catch {
			self.error = error.localizedDescription
		}
	}

	func startActivity(categoryId: Int, notes: String? = nil) async {
		do {
			let entry = try await timeService.startEntry(categoryId: categoryId, notes: notes)
			activeEntries.insert(entry, at: 0)
		} catch {
			self.error = error.localizedDescription
		}
	}

	func stopActivity(id: String) async {
		do {
			_ = try await timeService.stopEntry(id: id)
			activeEntries.removeAll { $0.id == id }
		} catch {
			self.error = error.localizedDescription
		}
	}
}
