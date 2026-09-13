import { describe, it, expect } from 'vitest'
import {
  canCompile,
  canUseMode,
  canExportFormat,
  remainingCompiles,
  getDetailLevel,
  PLAN_LIMITS,
  type PlanTier,
} from '@/lib/plan-limits'

describe('plan-limits', () => {
  describe('canCompile', () => {
    it('allows compilation when under the limit', () => {
      expect(canCompile('free', 0)).toBe(true)
      expect(canCompile('free', 5)).toBe(true)
      expect(canCompile('free', 9)).toBe(true)
    })

    it('blocks compilation when at the limit', () => {
      expect(canCompile('free', 10)).toBe(false)
      expect(canCompile('free', 15)).toBe(false)
    })

    it('pro tier has higher limits', () => {
      expect(canCompile('pro', 50)).toBe(true)
      expect(canCompile('pro', 99)).toBe(true)
      expect(canCompile('pro', 100)).toBe(false)
    })

    it('team tier has unlimited compiles', () => {
      expect(canCompile('team', 1000)).toBe(true)
      expect(canCompile('team', 999999)).toBe(true)
    })
  })

  describe('canUseMode', () => {
    it('free tier only allows fast mode', () => {
      expect(canUseMode('free', 'fast')).toBe(true)
      expect(canUseMode('free', 'balanced')).toBe(false)
      expect(canUseMode('free', 'precise')).toBe(false)
    })

    it('pro tier allows fast and balanced', () => {
      expect(canUseMode('pro', 'fast')).toBe(true)
      expect(canUseMode('pro', 'balanced')).toBe(true)
      expect(canUseMode('pro', 'precise')).toBe(false)
    })

    it('team tier allows all modes', () => {
      expect(canUseMode('team', 'fast')).toBe(true)
      expect(canUseMode('team', 'balanced')).toBe(true)
      expect(canUseMode('team', 'precise')).toBe(true)
    })

    it('rejects invalid mode names', () => {
      expect(canUseMode('free', 'turbo')).toBe(false)
      expect(canUseMode('team', '')).toBe(false)
    })
  })

  describe('canExportFormat', () => {
    it('yaml is available for all plans', () => {
      expect(canExportFormat('free', 'yaml')).toBe(true)
      expect(canExportFormat('pro', 'yaml')).toBe(true)
      expect(canExportFormat('team', 'yaml')).toBe(true)
    })

    it('json is available for all plans', () => {
      expect(canExportFormat('free', 'json')).toBe(true)
      expect(canExportFormat('pro', 'json')).toBe(true)
      expect(canExportFormat('team', 'json')).toBe(true)
    })

    it('zip requires pro or team', () => {
      expect(canExportFormat('free', 'zip')).toBe(false)
      expect(canExportFormat('pro', 'zip')).toBe(true)
      expect(canExportFormat('team', 'zip')).toBe(true)
    })

    it('sql and express and react require pro or team', () => {
      for (const format of ['sql', 'express', 'react']) {
        expect(canExportFormat('free', format)).toBe(false)
        expect(canExportFormat('pro', format)).toBe(true)
        expect(canExportFormat('team', format)).toBe(true)
      }
    })
  })

  describe('remainingCompiles', () => {
    it('returns full count when no compiles used', () => {
      expect(remainingCompiles('free', 0)).toBe(10)
      expect(remainingCompiles('pro', 0)).toBe(100)
    })

    it('returns correct remaining count', () => {
      expect(remainingCompiles('free', 3)).toBe(7)
      expect(remainingCompiles('pro', 50)).toBe(50)
    })

    it('returns zero when at or over limit', () => {
      expect(remainingCompiles('free', 10)).toBe(0)
      expect(remainingCompiles('free', 20)).toBe(0)
    })

    it('team tier returns Infinity', () => {
      expect(remainingCompiles('team', 0)).toBe(Infinity)
      expect(remainingCompiles('team', 999999)).toBe(Infinity)
    })
  })

  describe('getDetailLevel', () => {
    it('returns minimal for free', () => {
      expect(getDetailLevel('free')).toBe('minimal')
    })

    it('returns maximum for pro', () => {
      expect(getDetailLevel('pro')).toBe('maximum')
    })

    it('returns maximum for team', () => {
      expect(getDetailLevel('team')).toBe('maximum')
    })
  })

  describe('PLAN_LIMITS structure', () => {
    it('has all three tiers', () => {
      expect(PLAN_LIMITS).toHaveProperty('free')
      expect(PLAN_LIMITS).toHaveProperty('pro')
      expect(PLAN_LIMITS).toHaveProperty('team')
    })

    it('each tier has required fields', () => {
      for (const tier of ['free', 'pro', 'team'] as PlanTier[]) {
        const limits = PLAN_LIMITS[tier]
        expect(limits).toHaveProperty('compilesPerMonth')
        expect(limits).toHaveProperty('modes')
        expect(limits).toHaveProperty('exportFormats')
        expect(limits).toHaveProperty('historyDays')
        expect(limits).toHaveProperty('seats')
        expect(Array.isArray(limits.modes)).toBe(true)
        expect(Array.isArray(limits.exportFormats)).toBe(true)
      }
    })

    it('team has more compiles than pro, pro more than free', () => {
      expect(PLAN_LIMITS.team.compilesPerMonth).toBeGreaterThanOrEqual(
        PLAN_LIMITS.pro.compilesPerMonth
      )
      expect(PLAN_LIMITS.pro.compilesPerMonth).toBeGreaterThan(
        PLAN_LIMITS.free.compilesPerMonth
      )
    })

    it('team has more seats than pro and free', () => {
      expect(PLAN_LIMITS.team.seats).toBeGreaterThan(PLAN_LIMITS.pro.seats)
      expect(PLAN_LIMITS.team.seats).toBeGreaterThan(PLAN_LIMITS.free.seats)
    })
  })
})
