import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, buildRateLimitKey } from '@/lib/rate-limit'

describe('rate-limit', () => {
  describe('checkRateLimit', () => {
    it('allows the first request', () => {
      const result = checkRateLimit('test:user1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
      expect(result.resetAt).toBeInstanceOf(Date)
    })

    it('allows requests up to the limit', () => {
      const key = 'test:user2'
      for (let i = 0; i < 4; i++) {
        const result = checkRateLimit(key)
        expect(result.allowed).toBe(true)
      }
    })

    it('rejects requests over the limit', () => {
      const key = 'test:user3'
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key)
      }
      // Next request should be rejected
      const result = checkRateLimit(key)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetAt).toBeInstanceOf(Date)
      expect(result.resetAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('tracks different keys independently', () => {
      const keyA = 'test:userA'
      const keyB = 'test:userB'

      // Exhaust key A
      for (let i = 0; i < 5; i++) {
        checkRateLimit(keyA)
      }
      const resultA = checkRateLimit(keyA)
      expect(resultA.allowed).toBe(false)

      // key B should still be allowed
      const resultB = checkRateLimit(keyB)
      expect(resultB.allowed).toBe(true)
    })

    it('returns correct remaining count', () => {
      const key = 'test:user4'
      const r1 = checkRateLimit(key)
      expect(r1.remaining).toBeGreaterThanOrEqual(1)

      const r2 = checkRateLimit(key)
      expect(r2.remaining).toBeGreaterThanOrEqual(0)
    })
  })

  describe('buildRateLimitKey', () => {
    it('uses userId when provided', () => {
      const key = buildRateLimitKey('user-123')
      expect(key).toBe('gen:user-123')
    })

    it('falls back to anonymous when no userId', () => {
      const key = buildRateLimitKey(null)
      expect(key).toBe('gen:anonymous')
    })

    it('falls back to anonymous when userId is undefined', () => {
      const key = buildRateLimitKey(undefined)
      expect(key).toBe('gen:anonymous')
    })

    it('extracts IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      })
      const key = buildRateLimitKey(null, request)
      expect(key).toBe('gen:1.2.3.4')
    })

    it('uses first IP from x-forwarded-for', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '10.0.0.1' },
      })
      const key = buildRateLimitKey(null, request)
      expect(key).toBe('gen:10.0.0.1')
    })

    it('prefers userId over IP', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      })
      const key = buildRateLimitKey('user-456', request)
      expect(key).toBe('gen:user-456')
    })
  })
})
