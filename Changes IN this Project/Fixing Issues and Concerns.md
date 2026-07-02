# AppForge — Changes Log

Track record of every modification made to the project. Each entry includes what was changed, why, and which files were touched.

---

## 2026-07-02 — Critical & Moderate Issue Fixes

### Fix 1: Token Tracking in `lib/ai.ts`
**Problem:** `callLLMText()` returned only a string, discarding `inputTokens` and `outputTokens` from the LLM response. All pipeline stages showed 0 tokens.

**Fix:** Changed `callLLMText` return type from `string` to `LLMTextResult { text, inputTokens, outputTokens }`. Updated all 7 return paths (deterministic stub + real LLM) to return the new format. Added `LLMTextResult` interface export.

**Files:** `lib/ai.ts`

---

### Fix 2: Token Tracking in `lib/pipeline.ts`
**Problem:** `recordStage()` hardcoded `inputTokens: 0, outputTokens: 0`. `totalTokens` was always 0.

**Fix:** `recordStage()` now accepts `inputTokens` and `outputTokens` params. Added `totalInputTokens`/`totalOutputTokens` accumulators. `totalTokens` now correctly sums all stage tokens.

**Files:** `lib/pipeline.ts`

---

### Fix 3: Error Handling in `lib/ai.ts`
**Problem:** `callLLM()` catch block threw a plain object `{ success, error, latencyMs }` instead of an `Error` instance. Downstream `instanceof Error` checks failed silently.

**Fix:** Catch block now throws a proper `Error` instance with the latency context in the message.

**Files:** `lib/ai.ts`

---

### Fix 4: Evaluation Cost Estimation
**Problem:** `estimateCost()` in evaluation used `(latencyMs / 1000) * 0.01` — a meaningless heuristic unrelated to actual token costs.

**Fix:** Replaced with token-based estimate: ~3000 input + ~1800 output tokens per compile at Groq pricing ($0.000003/input, $0.000015/output).

**Files:** `lib/compiler/evaluation.ts`

---

### Fix 5: Metrics Recording
**Problem:** `recordGenerationMetrics()` only logged to console; actual `prisma.metric.create` was commented out.

**Fix:** Now persists metrics metadata to the `Generation` record via `prisma.generation.update()`.

**Files:** `lib/metrics.ts`

---

### Fix 6: Duplicate UI Components Removed
**Problem:** `components/ui/use-toast.ts` and `components/ui/use-mobile.tsx` were identical copies of `hooks/use-toast.ts` and `hooks/use-mobile.ts`. The `hooks/` versions were the ones actually imported.

**Fix:** Deleted `components/ui/use-toast.ts` and `components/ui/use-mobile.tsx`.

**Files:** `components/ui/use-toast.ts` (deleted), `components/ui/use-mobile.tsx` (deleted)

---

### Fix 7: Snake Game Fallback Trimmed
**Problem:** `app/api/compile/route.ts` had ~270 lines of hardcoded snake game generation with verbose markdown docs inline.

**Fix:** Replaced with ~70-line compact version that produces the same output with shorter docs. Removed unused `toRouteRoute()` helper and `SchemaOutput` type import.

**Files:** `app/api/compile/route.ts`

---

### Fix 8: Pipeline Planning Docs + Artifact Persistence
**Problem:** `lib/pipeline.ts` (used by `/api/generate`) didn't generate planning docs or persist artifacts to `AppConfig`, unlike `/api/compile`.

**Fix:** `pipeline.ts` now imports `buildPlanningDocs`, generates all 6 docs, creates `AppConfig` record with artifacts (PRD, TRD, etc.), and returns docs in the result.

**Files:** `lib/pipeline.ts`

---

### Fix 9: `lib/compiler/core.ts` LLM Result Format
**Problem:** All 5 stage functions (`extractIntent`, `designSystem`, `generateSchemas`, `refineSchemas`, `validateAndRepair`) used `const text = await callLLMText(...)` which no longer matched the new return type.

**Fix:** Updated all callers to destructure `const llmResult = await callLLMText(...)` and use `llmResult.text` for JSON extraction.

**Files:** `lib/compiler/core.ts`

---

### Fix 10: TypeScript Type Error in `lib/pipeline.ts`
**Problem:** After changing `recordStage` signature, the validation stage call passed a string (`validation.errors.join(', ')`) as the `inputTokens` parameter.

**Fix:** Changed to pass `0, 0` for tokens and the error string as the optional `error` parameter.

**Files:** `lib/pipeline.ts`

---

## 2026-07-02 — NVIDIA NIM Provider Integration

### Change 11: NVIDIA NIM as Primary LLM Provider
**Problem:** AppForge only had flat provider configuration with no selection logic. Users had to manually set base URLs and model names.

**Fix:** Rewrote `lib/ai.ts` with a provider registry pattern:
- 3 providers: `nvidia`, `groq`, `featherless` — each with baseUrl, apiKey, defaultModel, fallbackModel
- `LLM_PROVIDER` env var selects the active provider (default: `nvidia`)
- Automatic fallback: tries primary provider, on 429/timeout falls back to secondary
- `isRetryableError()` detects rate limits and transient failures
- `getActiveProviderInfo()` exported for health check and logging
- NVIDIA NIM: `mistralai/mistral-nemotron-super-49b-v1` (primary), `deepseek-ai/deepseek-v4-pro` (fallback)

**Files:** `lib/ai.ts`

---

### Change 12: Health Check Updated
**Problem:** Health endpoint hardcoded provider detection logic, didn't reflect the new provider system.

**Fix:** Uses `getActiveProviderInfo()` from `lib/ai.ts`. Response now includes `active_provider`, `fallback_provider`, `model`, `base_url`.

**Files:** `app/api/health/route.ts`

---

### Change 13: `.env.example` Updated
**Problem:** `.env.example` didn't document `LLM_PROVIDER` or NVIDIA NIM configuration.

**Fix:** Added `LLM_PROVIDER` selection var, NVIDIA NIM section as primary option, documented fallback model behavior.

**Files:** `.env.example`

---

### Change 14: `docs/tradeoffs.md` Created
**Problem:** No documentation comparing LLM providers or explaining the selection/fallback logic.

**Fix:** Created `docs/tradeoffs.md` with provider comparison table, selection logic, cost analysis, and custom provider instructions.

**Files:** `docs/tradeoffs.md`

---

## Summary of All Changes

| # | File | Change Type | Severity |
|---|---|---|---|
| 1 | `lib/ai.ts` | Token tracking + error handling | Critical |
| 2 | `lib/pipeline.ts` | Token accumulation + docs + persistence + type fix | Critical |
| 3 | `lib/compiler/core.ts` | Updated LLM call destructuring | Critical |
| 4 | `lib/compiler/evaluation.ts` | Cost estimation fix | Moderate |
| 5 | `lib/metrics.ts` | Metrics recording implementation | Moderate |
| 6 | `components/ui/use-toast.ts` | Deleted duplicate | Moderate |
| 7 | `components/ui/use-mobile.tsx` | Deleted duplicate | Moderate |
| 8 | `app/api/compile/route.ts` | Snake fallback trimmed + cleanup | Moderate |
| 9 | `lib/compiler/core.ts` | LLM result format update | Critical |
| 10 | `lib/pipeline.ts` | TypeScript type error fix | Critical |
| 11 | `lib/ai.ts` | NVIDIA NIM provider + selection + fallback | Feature |
| 12 | `app/api/health/route.ts` | Health check uses provider info | Feature |
| 13 | `.env.example` | LLM_PROVIDER + NVIDIA NIM docs | Feature |
| 14 | `docs/tradeoffs.md` | Provider comparison documentation | Feature |

---

## 2026-07-02 — UI Redesign + Pipeline Fixes

### Change 15: Next.js 16 middleware → proxy migration
**Problem:** `middleware.ts` was deprecated in Next.js 16, causing build warnings.

**Fix:** Renamed `middleware.ts` to `proxy.ts`. Clerk docs confirm exports stay the same — only filename changes.

**Files:** `middleware.ts` → `proxy.ts`

---

### Change 16: AppConfig config saved as null fix
**Problem:** Export route read `generation.config` (schema output only) instead of `appConfig.config` (full normalized config).

**Fix:** Export route now reads `appConfig.config` with fallback. Compile route changed from `create` to `upsert` with empty-config guard.

**Files:** `app/api/generations/[id]/export/route.ts`, `app/api/compile/route.ts`

---

### Change 17: LLM pipeline — provider, prompt, and schema fixes
**Problem:** Pipeline was using Llama instead of Mistral Nemotron because `.env.local` had `LLM_MODEL=meta/llama-3.3-70b-instruct` overriding the provider default. Fallback parser was running because LLM returned invalid JSON. Database tables only had id/timestamps.

**Fix:**
- Removed `LLM_MODEL` and `LLM_BASE_URL` overrides from `.env.local`
- Added `LLM_PROVIDER=nvidia` and uncommented `GROQ_API_KEY` for fallback
- Added `console.log('[LLM] Provider: X, Model: Y')` to `callLLM()`
- Strengthened Stage 1 prompt: "You MUST respond with ONLY a valid JSON object. No markdown. No backticks."
- Added aggressive 3-step JSON extraction: direct parse → regex `{...}` → trailing comma cleanup
- Added `console.log('[Stage1] Parse path: ...')` for debugging
- Rewrote Stage 3 prompt with explicit column requirements per entity type + "5+ domain-specific columns minimum"

**Files:** `.env.local`, `lib/ai.ts`, `lib/compiler/core.ts`

---

### Change 18: ZIP export with organized folders
**Problem:** ZIP export was returning a fake/empty ZIP.

**Fix:** Installed JSZip. ZIP now includes 5 folders + README: `config/`, `database/`, `backend/`, `frontend/`, `docs/` (6 planning documents). Added debug logs for doc key discovery.

**Files:** `app/api/generations/[id]/export/route.ts`, `package.json`

---

### Change 19: UI redesign — all 4 pages
**Problem:** UI looked generic with hardcoded hex colors, inconsistent spacing, no cohesive design system.

**Fix:** Complete UI rewrite following premium SaaS aesthetic (Linear/Vercel tier):
- New CSS variable system: `--surface-0/1/2`, `--text-primary/secondary/muted`, `--fill-accent`, `--bg-success/danger/warning`, etc.
- Landing: frosted nav, hero with radial glow, pipeline strip with animated beam, metrics, feature cards
- Compiler: two-panel layout (260px sidebar + flex right), 7 tabs, export buttons (JSON/YAML/ZIP)
- Dashboard: 4 stat cards, compilation form, history sidebar
- Demo: tab selector, split view (prompt + JSON output)
- Zero hardcoded hex colors — all via CSS variables

**Files:** `app/globals.css`, `app/page.tsx`, `app/compiler/page.tsx`, `app/dashboard/page.tsx`, `app/demo/page.tsx`

---

### Change 20: README.md updated
**Problem:** README was outdated — still referenced Llama model, old middleware convention, no ZIP export docs.

**Fix:** Rewrote README with: correct model name (Mistral Nemotron), provider selection docs, ZIP export format, new UI page descriptions, updated project structure, LLM provider comparison table.

**Files:** `README.md`

---

## Summary of All Changes

| # | File | Change Type | Session |
|---|---|---|---|
| 1–10 | Various | Critical + moderate fixes | Phase 1 |
| 11–14 | `lib/ai.ts`, docs | NVIDIA NIM provider | Phase 2 |
| 15 | `proxy.ts` | Next.js 16 migration | Phase 3 |
| 16 | Export + compile routes | AppConfig null fix | Phase 3 |
| 17 | `.env.local`, `lib/ai.ts`, `lib/compiler/core.ts` | LLM pipeline fixes | Phase 3 |
| 18 | Export route, `package.json` | ZIP export with JSZip | Phase 3 |
| 19 | `globals.css`, 4 page TSX files | Full UI redesign | Phase 3 |
| 20 | `README.md` | Documentation update | Phase 3 |

---

## 2026-07-02 — Pricing Tiers & Plan Gating

### Change 21: Prisma schema — PlanTier enum + User fields
**Problem:** No plan-based limits existed. Users had unlimited compiles and access to all modes/exports.

**Fix:** Added `PlanTier` enum (free/pro/team) and 3 new User fields: `planStartedAt`, `compilesThisMonth`, `compilesResetAt`. Ran `prisma db push --accept-data-loss`.

**Files:** `prisma/schema.prisma`

---

### Change 22: `lib/plan-limits.ts` — plan limits source of truth
**Problem:** No centralized place for plan-based limits.

**Fix:** Created `lib/plan-limits.ts` with `PLAN_LIMITS` config and 4 exported functions: `canCompile()`, `canUseMode()`, `canExportFormat()`, `remainingCompiles()`.

**Files:** `lib/plan-limits.ts`

---

### Change 23: Compile route — plan gating
**Problem:** No compile count limits or mode restrictions.

**Fix:** Added monthly counter reset, compile count check (429 on limit), mode access check (403 on disallowed mode), counter increment after success.

**Files:** `app/api/compile/route.ts`

---

### Change 24: Export route — format gating
**Problem:** Free users could export ZIP and other premium formats.

**Fix:** Added `canExportFormat()` check before generating the export. Returns 403 with `upgradeRequired: true` for disallowed formats.

**Files:** `app/api/generations/[id]/export/route.ts`

---

### Change 25: Pricing page
**Problem:** No pricing page existed.

**Fix:** Created `/pricing` with 3 cards (Free $0, Pro $19/mo, Team $49/mo) using the CSS variable design system.

**Files:** `app/pricing/page.tsx`

---

### Change 26: Upgrade banner component
**Problem:** No UI feedback when plan limits were hit.

**Fix:** Created `components/upgrade-banner.tsx` showing warning + upgrade link. Wired into compiler page — shows when compile returns 429/403 with `upgradeRequired`.

**Files:** `components/upgrade-banner.tsx`, `app/compiler/page.tsx`

---

### Change 27: Nav updates — pricing link + plan badge
**Problem:** No pricing link in nav, no visible plan indicator.

**Fix:** Added "Pricing" link to nav in all 4 pages (landing, compiler, dashboard, demo). Added "Free" plan badge in landing page nav.

**Files:** `app/page.tsx`, `app/compiler/page.tsx`, `app/dashboard/page.tsx`, `app/demo/page.tsx`

---

## Summary of All Changes

| # | File | Change Type | Session |
|---|---|---|---|
| 1–10 | Various | Critical + moderate fixes | Phase 1 |
| 11–14 | `lib/ai.ts`, docs | NVIDIA NIM provider | Phase 2 |
| 15 | `proxy.ts` | Next.js 16 migration | Phase 3 |
| 16 | Export + compile routes | AppConfig null fix | Phase 3 |
| 17 | `.env.local`, `lib/ai.ts`, `lib/compiler/core.ts` | LLM pipeline fixes | Phase 3 |
| 18 | Export route, `package.json` | ZIP export with JSZip | Phase 3 |
| 19 | `globals.css`, 4 page TSX files | Full UI redesign | Phase 3 |
| 20 | `README.md` | Documentation update | Phase 3 |
| 21–27 | Prisma, routes, pages, components | Pricing tiers + plan gating | Phase 4 |
