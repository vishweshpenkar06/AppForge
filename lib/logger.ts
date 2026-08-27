import pino from 'pino'

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const baseLogger = pino({
  level,
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino/file', options: { destination: 1 } }
      : undefined,
  base: { service: 'appforge' },
  serializers: {
    err: pino.stdSerializers.err,
  },
})

export interface LogContext {
  route?: string
  userId?: string | null
  generationId?: string | null
  [key: string]: unknown
}

export function createLogger(context: LogContext) {
  return baseLogger.child(context)
}

export const logger = baseLogger

// ── Dashboard widget query helpers ──────────────────────────────

interface LogEntry {
  timestamp: string
  level: string
  message: string
  route?: string
  userId?: string | null
  generationId?: string | null
  err?: { type: string; message: string; stack?: string }
  [key: string]: unknown
}

/**
 * In-memory ring buffer for recent log entries.
 * Replace with a DB/Redis-backed store in production at scale.
 */
const recentLogs: LogEntry[] = []
const MAX_BUFFER_SIZE = 1000

const originalLog = baseLogger.info.bind(baseLogger)
baseLogger.info = function (...args: Parameters<typeof originalLog>) {
  const entry = args[1] ?? args[0]
  if (typeof entry === 'object' && entry !== null) {
    recentLogs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      ...(entry as object),
      message: typeof args[0] === 'string' ? args[0] : (entry as any).msg ?? '',
    } satisfies LogEntry)
    if (recentLogs.length > MAX_BUFFER_SIZE) recentLogs.shift()
  }
  return originalLog.apply(this, args)
} as typeof originalLog

/**
 * Query recent error logs for a dashboard widget.
 * Filters by route, userId, or time window.
 */
export function queryRecentErrors(opts: {
  route?: string
  userId?: string
  sinceMs?: number
  limit?: number
} = {}): LogEntry[] {
  const { route, userId, sinceMs, limit = 50 } = opts
  const cutoff = sinceMs ? Date.now() - sinceMs : 0

  return recentLogs
    .filter((e) => e.level === 'error')
    .filter((e) => (route ? e.route === route : true))
    .filter((e) => (userId ? e.userId === userId : true))
    .filter((e) => (cutoff ? new Date(e.timestamp).getTime() >= cutoff : true))
    .slice(-limit)
}

/**
 * Get aggregated error counts per route for a dashboard widget.
 */
export function getErrorCountsByRoute(sinceMs?: number): Record<string, number> {
  const cutoff = sinceMs ? Date.now() - sinceMs : 0
  const counts: Record<string, number> = {}

  for (const entry of recentLogs) {
    if (entry.level !== 'error') continue
    if (cutoff && new Date(entry.timestamp).getTime() < cutoff) continue
    const route = entry.route ?? 'unknown'
    counts[route] = (counts[route] ?? 0) + 1
  }

  return counts
}

/**
 * Get a summary of recent log activity for a dashboard overview.
 */
export function getLogSummary(sinceMs?: number): {
  total: number
  errors: number
  byRoute: Record<string, number>
  recentErrors: LogEntry[]
} {
  const cutoff = sinceMs ? Date.now() - sinceMs : 0
  const filtered = cutoff
    ? recentLogs.filter((e) => new Date(e.timestamp).getTime() >= cutoff)
    : recentLogs

  const errors = filtered.filter((e) => e.level === 'error')
  const byRoute: Record<string, number> = {}

  for (const e of filtered) {
    const route = e.route ?? 'unknown'
    byRoute[route] = (byRoute[route] ?? 0) + 1
  }

  return {
    total: filtered.length,
    errors: errors.length,
    byRoute,
    recentErrors: errors.slice(-20),
  }
}
