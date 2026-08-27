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

    it('id 11: "Build an app" — has app-type keyword, stays reasonably confident', () => {
      const result = analyzePromptClarity(EDGE_CASES[0].prompt)
      // "app" is an app-type keyword → no missing-description penalty
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('id 12: "I need a website for my business" — flagged as may-not-be-build-request', () => {
      const result = analyzePromptClarity(EDGE_CASES[1].prompt)
      // "need" is an action word but < 50 chars and no build/create/make/develop
      expect(result.detectedIssues).toContain('Prompt may not be a build request')
    })

    it('penalizes multiple vague keywords', () => {
      const result = analyzePromptClarity('Build something cool and nice for me')
      expect(result.detectedIssues).toContain('Prompt uses vague language')
    })

    it('single vague keyword does NOT trigger vague penalty', () => {
      const result = analyzePromptClarity('Build something great')
      expect(result.detectedIssues).not.toContain('Prompt uses vague language')
    })
  })

  describe('conflicting requirements', () => {
    it('id 13: public dashboard with admin-only — no regex-based conflict detected', () => {
      const result = analyzePromptClarity(EDGE_CASES[2].prompt)
      // "dashboard" is app-type keyword → clear enough; no matching conflict regex
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('id 14: free + premium — no regex-based conflict detected', () => {
      const result = analyzePromptClarity(EDGE_CASES[3].prompt)
      // "make" is action word; no matching conflict regex
      expect(result.confidence).toBeGreaterThan(0)
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

    it('detects scalability vs single-db conflict with exact regex', () => {
      const result = analyzePromptClarity('Handle 1M users on a single database instance')
      // The regex uses \b(single|one) (database|server|instance|db)\b
      expect(result.detectedIssues).toContain(
        'Conflicting requirements: high scalability with single database instance'
      )
    })

    it('does NOT flag when no conflicting keywords present', () => {
      const result = analyzePromptClarity('Build a simple and basic app')
      expect(result.detectedIssues).not.toContain(
        'Conflicting requirements: "simple/minimal" vs "advanced/complex" features'
      )
    })
  })

  describe('incomplete prompts', () => {
    it('id 15: "Add payments to my app" — flagged as may-not-be-build-request', () => {
      const result = analyzePromptClarity(EDGE_CASES[4].prompt)
      // length < 50 and no build/create/make/develop verb
      expect(result.detectedIssues).toContain('Prompt may not be a build request')
    })

    it('id 16: "Build a social platform" — flagged as may-not-be-build-request', () => {
      const result = analyzePromptClarity(EDGE_CASES[5].prompt)
      // "social" and "platform" are app-type keywords → clear enough, but
      // length < 50 and no build/create/make/develop → flagged
      expect(result.detectedIssues).toContain('Prompt may not be a build request')
    })
  })

  describe('overloaded / contradictory / missing-auth / ambiguous', () => {
    it('id 17: overloaded prompt — very long, no short-prompt penalty', () => {
      const result = analyzePromptClarity(EDGE_CASES[6].prompt)
      expect(result.detectedIssues).not.toContain('Prompt is very short and may lack detail')
    })

    it('id 18: contradictory roles — flagged as may-not-be-build-request', () => {
      const result = analyzePromptClarity(EDGE_CASES[7].prompt)
      expect(result.detectedIssues).toContain('Prompt may not be a build request')
    })

    it('id 19: banking app with no login — flagged as may-not-be-build-request', () => {
      const result = analyzePromptClarity(EDGE_CASES[8].prompt)
      // "app" is app-type keyword; "banking" isn't an action word
      expect(result.detectedIssues).toContain('Prompt may not be a build request')
    })

    it('id 20: "Some features should cost money" — flagged as may-not-be-build-request', () => {
      const result = analyzePromptClarity(EDGE_CASES[9].prompt)
      // No app-type keywords, no action words, length < 50
      expect(result.detectedIssues).toContain('Prompt does not clearly describe what to build')
      expect(result.detectedIssues).toContain('Prompt may not be a build request')
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

    it('empty prompt triggers multiple issues', () => {
      const result = analyzePromptClarity('')
      expect(result.detectedIssues.length).toBeGreaterThan(0)
    })
  })
})
