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

// ── Upstash Redis via REST API (no SDK dependency) ──────────────
let upstashUrl: string | null = null
let upstashToken: string | null = null
let redisAvailable: boolean | null = null

async function upstashRequest(command: string[], expirySeconds?: number): Promise<any> {
  const url = upstashUrl!
  const body = JSON.stringify(command)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${upstashToken}`,
    'Content-Type': 'application/json',
  }
  if (expirySeconds !== undefined) {
    headers['Upstash-Session-Metadata-TTL'] = String(expirySeconds)
  }
  const res = await fetch(url, { method: 'POST', headers, body })
  if (!res.ok) throw new Error(`Upstash ${res.status}`)
  return res.json()
}

async function getRedis() {
  if (redisAvailable !== null) return redisAvailable

  upstashUrl = process.env.UPSTASH_REDIS_REST_URL ?? null
  upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? null
  if (!upstashUrl || !upstashToken) {
    redisAvailable = false
    console.log('[Cache] No UPSTASH_REDIS_REST_URL — using Prisma fallback')
    return false
  }

  try {
    await upstashRequest(['PING'])
    redisAvailable = true
    console.log('[Cache] Using Upstash Redis')
    return true
  } catch (err) {
    console.warn('[Cache] Upstash init failed, falling back to Prisma', err)
    redisAvailable = false
    return false
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
  const hasRedis = await getRedis()
  if (hasRedis) {
    try {
      const raw = await upstashRequest(['GET', `${CACHE_PREFIX}${key}`])
      if (raw.result) {
        totalHits++
        const data = typeof raw.result === 'string' ? JSON.parse(raw.result) : raw.result
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
  const hasRedis = await getRedis()
  if (hasRedis) {
    try {
      const ttlSeconds = Math.floor(CACHE_TTL_MS / 1000)
      await upstashRequest(['SET', `${CACHE_PREFIX}${key}`, JSON.stringify(payload), 'EX', String(ttlSeconds)])
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
