type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
	const entry = {
		level,
		message,
		...(meta && Object.keys(meta).length > 0 && { ...meta }),
		timestamp: new Date().toISOString()
	}
	console.log(JSON.stringify(entry))
}

export const logger = {
	debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
	info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
	warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
	error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta)
}
