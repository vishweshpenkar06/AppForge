export type PlanTier = 'free' | 'pro' | 'team';

export const PLAN_LIMITS = {
  free: {
    compilesPerMonth: 10,
    modes: ['fast'],
    exportFormats: ['json', 'yaml'],
    historyDays: 7,
    seats: 1,
  },
  pro: {
    compilesPerMonth: 100,
    modes: ['fast', 'balanced'],
    exportFormats: ['json', 'sql', 'express', 'react'],
    historyDays: 90,
    seats: 1,
  },
  team: {
    compilesPerMonth: Infinity,
    modes: ['fast', 'balanced', 'precise'],
    exportFormats: ['json', 'sql', 'express', 'react', 'zip'],
    historyDays: Infinity,
    seats: 5,
  },
} as const;

export function canCompile(plan: PlanTier, compilesThisMonth: number): boolean {
  return compilesThisMonth < PLAN_LIMITS[plan].compilesPerMonth;
}

export function canUseMode(plan: PlanTier, mode: string): boolean {
  return (PLAN_LIMITS[plan].modes as readonly string[]).includes(mode);
}

export function canExportFormat(plan: PlanTier, format: string): boolean {
  // yaml is just a format conversion — available for all plans
  if (format === 'yaml') return true
  // zip export requires pro or team
  if (format === 'zip') return plan === 'team' || plan === 'pro'
  return (PLAN_LIMITS[plan].exportFormats as readonly string[]).includes(format)
}

export function remainingCompiles(plan: PlanTier, compilesThisMonth: number): number {
  const limit = PLAN_LIMITS[plan].compilesPerMonth;
  return limit === Infinity ? Infinity : Math.max(0, limit - compilesThisMonth);
}

// ── Detail Levels ─────────────────────────────────────────────

export const DETAIL_LEVEL = {
  free: 'minimal',
  pro: 'maximum',
  team: 'standard',
} as const;

export type DetailLevel = 'minimal' | 'standard' | 'maximum';

export function getDetailLevel(plan: PlanTier): DetailLevel {
  return DETAIL_LEVEL[plan];
}

export const DETAIL_PROMPTS: Record<DetailLevel, string> = {
  minimal: `Generate a MINIMAL, functional schema. Keep it lean:
- Only the essential columns needed for the feature to work (typically 3-5 per table)
- Only core CRUD endpoints (GET list, GET one, POST, no complex filtering)
- Basic UI components only, no advanced states
- Skip edge case handling, skip detailed validation rules
- This is a quick prototype, not production-ready`,

  standard: `Generate a SOLID PRODUCTION schema:
- Comprehensive columns per table (8-12 typical), including relevant metadata fields
- Full CRUD + filtering/pagination on list endpoints
- Proper validation rules on all required fields
- UI components include loading, empty, and error states
- Include foreign keys and basic relationship integrity`,

  maximum: `Generate an EXHAUSTIVE, PRODUCTION-GRADE schema. Leave nothing out:
- Every relevant column for each entity (12-20+ typical), including: soft-delete fields (deletedAt), audit fields (createdBy, updatedBy), versioning where relevant, search-optimized fields
- Full CRUD + advanced filtering, sorting, pagination, bulk operations on every entity
- Complete validation rules: min/max lengths, regex patterns, required combinations
- Detailed error response schemas
- UI components include loading, empty, error, AND optimistic-update states
- Include database indexes on every foreign key and frequently-queried column
- Include a changelog/audit_log table if the app has admin or sensitive data operations
- Add integration/webhook considerations if the app type suggests it
- This should look like a senior engineer's design doc, not a prototype`,
};

export const TOKEN_MULTIPLIER: Record<DetailLevel, number> = {
  minimal: 0.6,
  standard: 1.0,
  maximum: 1.8,
};
