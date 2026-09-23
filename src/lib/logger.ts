/**
 * One small logger, so nothing in the codebase reaches for `console.log` directly.
 *
 * Never log personal data: no names, admission numbers, phone numbers, file keys or
 * tokens. Log ids and outcomes instead.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }

const threshold: number = ORDER[(process.env.LOG_LEVEL as Level) ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug')]

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  if (ORDER[level] < threshold) return

  const line = { level, time: new Date().toISOString(), message, ...context }

  if (level === 'error') console.error(JSON.stringify(line))
  else if (level === 'warn') console.warn(JSON.stringify(line))
  else console.log(JSON.stringify(line))
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
}
