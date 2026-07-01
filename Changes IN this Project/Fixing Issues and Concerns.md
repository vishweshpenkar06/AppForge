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
