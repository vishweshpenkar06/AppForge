/**
 * Rate limiter for generation endpoints.
 *
 * Uses an in-memory sliding-window counter keyed by userId (Clerk) or IP.
 *
 * LIMITATION: In-memory state is per-server-instance and resets on restart.
 * For production multi-instance deployments, swap the store for Upstash Redis:
 *   npm i @upstash/ratelimit @upstash/redis
 * then replace `memoryStore` with an Upstash-backed adapter.
 */

const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_REQUESTS = 5

interface Entry {
  timestamps: number[]
}

const store = new Map<string, Entry>()

// Periodic cleanup to prevent unbounded growth (runs every 10 minutes)
const CLEANUP_INTERVAL = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  const cutoff = now - WINDOW_MS
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Check (and record) a rate-limit hit for the given key.
 * Returns `{ allowed: true }` if the request is within limits,
 * or `{ allowed: false, resetAt }` when the limit is exceeded.
 */
export function checkRateLimit(key: string): RateLimitResult {
  cleanup()

  const now = Date.now()
  const windowStart = now - WINDOW_MS

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Prune timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldest = entry.timestamps[0]
    const resetAt = new Date(oldest + WINDOW_MS)
    return { allowed: false, remaining: 0, resetAt }
  }

  entry.timestamps.push(now)
  return { allowed: true, remaining: MAX_REQUESTS - entry.timestamps.length, resetAt: new Date(now + WINDOW_MS) }
}

/**
 * Build the rate-limit key for a request.
 * Prefers Clerk userId; falls back to the `x-forwarded-for` IP header.
 */
export function buildRateLimitKey(userId?: string | null, request?: Request): string {
  if (userId) return `gen:${userId}`
  const forwarded = request?.headers?.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'anonymous'
  return `gen:${ip}`
}
