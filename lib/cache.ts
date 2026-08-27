import { createHash } from 'crypto'
import { prisma } from './db'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CACHE_PREFIX = 'appforge:cache:'

let totalHits = 0
let totalMisses = 0

function normalizePrompt(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, ' ')
}

function computeCacheKey(prompt: string, mode: string): string {
  const payload = `${normalizePrompt(prompt)}:${mode}`
  return createHash('sha256').update(payload).digest('hex')
}

// ── Upstash Redis (lazy) ────────────────────────────────────────
let redisClient: any = null
let redisAvailable: boolean | null = null

async function getRedis() {
  if (redisAvailable !== null) return redisAvailable ? redisClient : null

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    redisAvailable = false
    console.log('[Cache] No UPSTASH_REDIS_REST_URL — using Prisma fallback')
    return null
  }

  try {
    const { Redis } = await import('@upstash/redis')
    redisClient = new Redis({ url, token })
    await redisClient.ping()
    redisAvailable = true
    console.log('[Cache] Using Upstash Redis')
    return redisClient
  } catch (err) {
    console.warn('[Cache] Upstash init failed, falling back to Prisma', err)
    redisAvailable = false
    return null
  }
}

// ── Public API ──────────────────────────────────────────────────

export interface CacheResult {
  hit: boolean
  data?: any
  cachedAt?: string
}

export async function getCache(prompt: string, mode: string): Promise<CacheResult> {
  const key = computeCacheKey(prompt, mode)

  // Try Redis first
  const redis = await getRedis()
  if (redis) {
    try {
      const raw = await redis.get(`${CACHE_PREFIX}${key}`)
      if (raw) {
        totalHits++
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw
        return { hit: true, data, cachedAt: data._cachedAt }
      }
    } catch (err) {
      console.warn('[Cache] Redis get error:', err)
    }
  }

  // Fallback: Prisma
  try {
    const entry = await prisma.cacheEntry.findUnique({ where: { cacheKey: key } })
    if (entry && entry.expiresAt > new Date()) {
      totalHits++
      return { hit: true, data: entry.result, cachedAt: entry.createdAt.toISOString() }
    }
    if (entry) {
      await prisma.cacheEntry.delete({ where: { cacheKey: key } }).catch(() => {})
    }
  } catch (err) {
    console.warn('[Cache] Prisma get error:', err)
  }

  totalMisses++
  return { hit: false }
}

export async function setCache(prompt: string, mode: string, data: any): Promise<void> {
  const key = computeCacheKey(prompt, mode)
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS)
  const payload = { ...data, _cachedAt: new Date().toISOString() }

  // Try Redis first
  const redis = await getRedis()
  if (redis) {
    try {
      await redis.set(`${CACHE_PREFIX}${key}`, JSON.stringify(payload), {
        ex: Math.floor(CACHE_TTL_MS / 1000),
      })
      return
    } catch (err) {
      console.warn('[Cache] Redis set error:', err)
    }
  }

  // Fallback: Prisma
  try {
    await prisma.cacheEntry.upsert({
      where: { cacheKey: key },
      create: { cacheKey: key, result: payload, expiresAt },
      update: { result: payload, expiresAt },
    })
  } catch (err) {
    console.warn('[Cache] Prisma set error:', err)
  }
}

export interface CacheStats {
  totalHits: number
  totalMisses: number
  hitRate: number
  totalEntries: number
  redisAvailable: boolean
}

export async function getCacheStats(): Promise<CacheStats> {
  let totalEntries = 0
  try {
    totalEntries = await prisma.cacheEntry.count({
      where: { expiresAt: { gt: new Date() } },
    })
  } catch (err) {
    console.warn('[Cache] Stats query error:', err)
  }

  const total = totalHits + totalMisses
  return {
    totalHits,
    totalMisses,
    hitRate: total > 0 ? totalHits / total : 0,
    totalEntries,
    redisAvailable: redisAvailable === true,
  }
}
