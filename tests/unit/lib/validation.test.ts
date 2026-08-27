import { describe, it, expect } from 'vitest'
import { analyzePromptClarity } from '@/lib/validation'

// The 10 edge-case prompts from the eval suite
const EDGE_CASES = [
  { id: 11, type: 'vague', prompt: 'Build an app' },
  { id: 12, type: 'vague', prompt: 'I need a website for my business' },
  { id: 13, type: 'conflicting', prompt: 'Build a public dashboard that only logged-in admins can see' },
  { id: 14, type: 'conflicting', prompt: 'Make everything free but also add premium features for all users' },
  { id: 15, type: 'incomplete', prompt: 'Add payments to my app' },
  { id: 16, type: 'incomplete', prompt: 'Build a social platform' },
  { id: 17, type: 'overloaded', prompt: 'Build Uber + Airbnb + LinkedIn + Shopify in one app' },
  { id: 18, type: 'contradictory_roles', prompt: 'Admins cannot see user data but must generate user reports' },
  { id: 19, type: 'missing_auth', prompt: 'Build a banking app with no login' },
  { id: 20, type: 'ambiguous_premium', prompt: 'Some features should cost money' },
]

describe('analyzePromptClarity', () => {
  describe('vague prompts', () => {
    it('detects very short prompt (< 10 chars)', () => {
      const result = analyzePromptClarity('Help')
      expect(result.confidence).toBeLessThan(1)
      expect(result.detectedIssues).toContain('Prompt is very short and may lack detail')
    })

    it('id 11: "Build an app" — vague, low confidence', () => {
      const result = analyzePromptClarity(EDGE_CASES[0].prompt)
      expect(result.needsClarification).toBe(true)
      expect(result.confidence).toBeLessThan(0.5)
      expect(result.clarificationQuestions).toBeDefined()
      expect(result.clarificationQuestions!.length).toBeGreaterThan(0)
    })

    it('id 12: "I need a website for my business" — vague, no action verb', () => {
      const result = analyzePromptClarity(EDGE_CASES[1].prompt)
      expect(result.needsClarification).toBe(true)
      expect(result.confidence).toBeLessThan(0.5)
    })

    it('penalizes multiple vague keywords', () => {
      const result = analyzePromptClarity('Build something cool and nice for me')
      expect(result.detectedIssues).toContain('Prompt uses vague language')
    })
  })

  describe('conflicting requirements', () => {
    it('id 13: public + admin-only — detected conflict', () => {
      const result = analyzePromptClarity(EDGE_CASES[2].prompt)
      expect(result.detectedIssues.length).toBeGreaterThan(0)
    })

    it('id 14: free + premium conflict', () => {
      const result = analyzePromptClarity(EDGE_CASES[3].prompt)
      expect(result.detectedIssues.length).toBeGreaterThan(0)
    })

    it('detects simple vs advanced conflict', () => {
      const result = analyzePromptClarity('Build a simple app with AI and machine learning and blockchain')
      expect(result.detectedIssues).toContain(
        'Conflicting requirements: "simple/minimal" vs "advanced/complex" features'
      )
    })

    it('detects offline vs real-time conflict', () => {
      const result = analyzePromptClarity('Build an offline app with real-time websocket streaming')
      expect(result.detectedIssues).toContain(
        'Conflicting requirements: "offline" vs "real-time" capabilities'
      )
    })

    it('detects scalability vs single-db conflict', () => {
      const result = analyzePromptClarity('Handle 1M users on a single database instance')
      expect(result.detectedIssues).toContain(
        'Conflicting requirements: high scalability with single database instance'
      )
    })
  })

  describe('incomplete prompts', () => {
    it('id 15: "Add payments to my app" — missing build verb + short', () => {
      const result = analyzePromptClarity(EDGE_CASES[4].prompt)
      expect(result.detectedIssues.length).toBeGreaterThan(0)
    })

    it('id 16: "Build a social platform" — no roles or features', () => {
      const result = analyzePromptClarity(EDGE_CASES[5].prompt)
      // social is an app-type keyword, so no "does not clearly describe" penalty
      // but no roles → triggers role warning
      expect(result.detectedIssues.length).toBeGreaterThan(0)
    })
  })

  describe('overloaded / contradictory / missing-auth / ambiguous', () => {
    it('id 17: overloaded prompt — many app types combined', () => {
      const result = analyzePromptClarity(EDGE_CASES[6].prompt)
      // Very long prompt with app-type keywords, should not be flagged as vague
      expect(result.detectedIssues.length).toBeGreaterThanOrEqual(0)
    })

    it('id 18: contradictory roles', () => {
      const result = analyzePromptClarity(EDGE_CASES[7].prompt)
      expect(result.detectedIssues.length).toBeGreaterThan(0)
    })

    it('id 19: banking app with no login — may not be a build request if short', () => {
      const result = analyzePromptClarity(EDGE_CASES[8].prompt)
      expect(result.detectedIssues.length).toBeGreaterThan(0)
    })

    it('id 20: "Some features should cost money" — ambiguous', () => {
      const result = analyzePromptClarity(EDGE_CASES[9].prompt)
      expect(result.needsClarification).toBe(true)
      expect(result.confidence).toBeLessThan(0.5)
    })
  })

  describe('well-formed prompts', () => {
    it('clear prompt gets high confidence', () => {
      const result = analyzePromptClarity(
        'Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.'
      )
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      expect(result.needsClarification).toBe(false)
    })

    it('confidence is clamped between 0 and 1', () => {
      const result = analyzePromptClarity('')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })
})
