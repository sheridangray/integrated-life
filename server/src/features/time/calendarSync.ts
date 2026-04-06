import { google, Auth } from 'googleapis'
import { env } from '../../config'
import * as timeRepository from './repository'
import * as authRepository from '../auth/repository'

const GOOGLE_CALENDAR_COLOR_MAP: Record<string, string> = {
	'1': '#7986CB',
	'2': '#33B679',
	'3': '#8E24AA',
	'4': '#E67C73',
	'5': '#F6BF26',
	'6': '#F4511E',
	'7': '#039BE5',
	'8': '#616161',
	'9': '#3F51B5',
	'10': '#0B8043',
	'11': '#D50000'
}

const DEFAULT_CALENDAR_COLOR = '#4285F4'
const CALENDAR_ICON = 'calendar'

function createOAuth2Client(accessToken: string, refreshToken?: string): Auth.OAuth2Client {
	const client = new google.auth.OAuth2(
		env.GOOGLE_CLIENT_ID_WEB,
		env.GOOGLE_CLIENT_SECRET_WEB,
		''
	)
	client.setCredentials({
		access_token: accessToken,
		refresh_token: refreshToken
	})
	return client
}

function parseEventTimes(event: { start?: { dateTime?: string | null; date?: string | null }; end?: { dateTime?: string | null; date?: string | null } }): {
	startTime: string | null
	durationMinutes: number
	isAllDay: boolean
	localDate: string | null
} {
	if (event.start?.dateTime && event.end?.dateTime) {
		const startMatch = event.start.dateTime.match(/T(\d{2}):(\d{2})/)
		if (!startMatch) return { startTime: null, durationMinutes: 1440, isAllDay: true, localDate: null }

		const startTime = `${startMatch[1]}:${startMatch[2]}`

		const start = new Date(event.start.dateTime)
		const end = new Date(event.end.dateTime)
		const diffMs = end.getTime() - start.getTime()
		const durationMinutes = Math.max(1, Math.round(diffMs / 60000))

		const dateMatch = event.start.dateTime.match(/^(\d{4}-\d{2}-\d{2})/)
		const localDate = dateMatch ? dateMatch[1] : null

		return { startTime, durationMinutes, isAllDay: false, localDate }
	}

	if (event.start?.date) {
		return { startTime: null, durationMinutes: 1440, isAllDay: true, localDate: event.start.date }
	}

	return { startTime: null, durationMinutes: 1440, isAllDay: true, localDate: null }
}

export async function syncCalendarForDate(userId: string, date: string): Promise<void> {
	const user = await authRepository.findUserById(userId)
	if (!user?.googleAccessToken || !user.googleCalendarEnabled) return

	const oauth2Client = createOAuth2Client(user.googleAccessToken, user.googleRefreshToken)

	const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

	const dayStart = new Date(`${date}T00:00:00Z`)
	dayStart.setUTCHours(dayStart.getUTCHours() - 14)
	const dayEnd = new Date(`${date}T23:59:59Z`)
	dayEnd.setUTCHours(dayEnd.getUTCHours() + 14)

	let events
	try {
		const response = await calendar.events.list({
			calendarId: 'primary',
			timeMin: dayStart.toISOString(),
			timeMax: dayEnd.toISOString(),
			singleEvents: true,
			orderBy: 'startTime',
			maxResults: 100
		})
		events = response.data.items ?? []
	} catch (err: unknown) {
		const status = (err as { code?: number }).code
		if (status === 401 || status === 403) {
			await handleTokenRefreshOrRevocation(userId, oauth2Client, err)
		}
		return
	}

	const activeEventIds: string[] = []

	for (const event of events) {
		if (!event.id || !event.summary) continue
		if (event.status === 'cancelled') continue

		const { startTime, durationMinutes, localDate } = parseEventTimes(event)

		if (localDate && localDate !== date) continue

		activeEventIds.push(event.id)

		const color = event.colorId
			? (GOOGLE_CALENDAR_COLOR_MAP[event.colorId] ?? DEFAULT_CALENDAR_COLOR)
			: DEFAULT_CALENDAR_COLOR

		await timeRepository.upsertCalendarTask(userId, event.id, {
			title: event.summary,
			date,
			startTime,
			durationMinutes,
			color,
			icon: CALENDAR_ICON
		})
	}

	await timeRepository.deleteStaleCalendarTasks(userId, date, activeEventIds)

	await refreshStoredTokens(userId, oauth2Client)
}

async function refreshStoredTokens(userId: string, client: Auth.OAuth2Client): Promise<void> {
	const credentials = client.credentials
	if (credentials.access_token) {
		await authRepository.updateGoogleTokens(userId, {
			accessToken: credentials.access_token,
			expiresAt: credentials.expiry_date
				? new Date(credentials.expiry_date)
				: new Date(Date.now() + 3600 * 1000)
		})
	}
}

async function handleTokenRefreshOrRevocation(
	userId: string,
	client: Auth.OAuth2Client,
	originalError: unknown
): Promise<void> {
	try {
		const { credentials } = await client.refreshAccessToken()
		if (credentials.access_token) {
			await authRepository.updateGoogleTokens(userId, {
				accessToken: credentials.access_token,
				expiresAt: credentials.expiry_date
					? new Date(credentials.expiry_date)
					: new Date(Date.now() + 3600 * 1000)
			})
		}
	} catch {
		console.error('Google Calendar token refresh failed, disabling sync for user:', userId, originalError)
		const { User } = await import('../../models/User')
		await User.findByIdAndUpdate(userId, { $set: { googleCalendarEnabled: false } }).exec()
	}
}
