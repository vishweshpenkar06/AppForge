# ClaudeInfo.md — AppForge Project Context

This document is a complete reference for Claude (or any AI assistant) working on the AppForge codebase. It covers what the project is, how every piece fits together, the data flow, conventions, and gotchas.

---

## 1. What AppForge Is

AppForge is a **Natural Language to Application Compiler**. A user writes a plain English product description (e.g., "Build a CRM with login, contacts, dashboard, and analytics") and AppForge compiles it into:

- A validated JSON application config (database + API + UI + auth)
- A runnable Prisma schema with proper relations
- Express server stubs with JWT auth middleware
- React component stubs with data fetching
- 6 planning documents (PRD, TRD, App Flow, UI/UX Brief, Backend Schema, Implementation Plan)
- Portable SQL, Express, and React runtime files

The key differentiator: it's not a single LLM call. It's a **5-stage pipeline** with Zod validation at every stage, cross-layer consistency checks, and LLM-assisted auto-repair.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| Language | TypeScript | 5.7.3 |
| Database | PostgreSQL via Prisma | 7.8.0 |
| Auth | Clerk | 7.4.2 |
| LLM | NVIDIA NIM (primary) / Groq (fallback) | `mistralai/mistral-nemotron-super-49b-v1` |
| UI | React 19 + CSS variables | Dark mode native |
| Validation | Zod | 3.24.1 |
| ZIP Export | JSZip | — |

---

## 2b. Design System (CSS Variables)

All UI uses these variables — no hardcoded hex colors:

```css
--surface-0: #09090b;        /* Page background */
--surface-1: #111113;        /* Card/panel background */
--surface-2: #1a1a1f;        /* Hover states, inputs */
--border: rgba(255,255,255,0.08);
--text-primary: #f4f4f5;     /* Headings */
--text-secondary: #a1a1aa;   /* Body text */
--text-muted: #52525b;       /* Labels, captions */
--fill-accent: #6366f1;      /* Primary CTA, active states */
--text-accent: #818cf8;      /* Links, code */
--bg-success: rgba(34,197,94,0.12);
--text-success: #4ade80;
--bg-danger: rgba(239,68,68,0.12);
--text-danger: #f87171;
--bg-warning: rgba(245,158,11,0.12);
--text-warning: #fbbf24;
--radius: 10px;
--font-sans: system-ui;
--font-mono: 'SF Mono', monospace;
```

---

## 3. Project Structure

```
AppForge/
├── proxy.ts                        # Clerk auth proxy (was middleware.ts — Next.js 16)
├── app/                            # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── compile/route.ts        # MAIN ENDPOINT — synchronous 6-stage compile
│   │   ├── generate/route.ts       # Async endpoint — fires pipeline in background
│   │   ├── evaluate/route.ts       # Runs 20-case evaluation suite
│   │   ├── health/route.ts         # System health check (DB + LLM provider)
│   │   ├── metrics/route.ts        # Metrics dashboard data
│   │   ├── generations/            # CRUD + ZIP/JSON/YAML export
│   │   └── webhooks/clerk/         # Clerk webhook handler
│   ├── compiler/page.tsx           # Compiler UI — two-panel, 7 tabs, export buttons
│   ├── dashboard/page.tsx          # Dashboard — stats, form, history sidebar
│   ├── demo/page.tsx               # Pre-compiled examples — split view
│   ├── page.tsx                    # Landing — nav, hero, pipeline strip, features
│   ├── sign-in/                    # Clerk sign-in
│   └── sign-up/                    # Clerk sign-up
│
├── lib/                          # Core business logic
│   ├── compiler/
│   │   ├── core.ts               # Pipeline stages 1–5 + validation (810 lines)
│   │   ├── export.ts             # Stage 6 — Prisma/API/UI generation + 6 docs (656 lines)
│   │   └── evaluation.ts         # 20-case test suite + report generation (383 lines)
│   ├── runtime/
│   │   └── generators.ts         # Portable SQL, Express server, React app generation
│   ├── ai.ts                     # LLM abstraction — provider selection, fallback, deterministic stub
│   ├── schemas.ts                # Zod schemas for AppConfig, Intent, Auth, DB, API, UI
│   ├── validation.ts             # Cross-layer consistency checks + prompt clarity analysis
│   ├── pipeline.ts               # Pipeline orchestrator — delegates to core.ts, persists to DB
│   ├── metrics.ts                # Quality scoring + user/system metrics
│   ├── db.ts                     # Prisma client singleton + Clerk user sync
│   └── clerk-user.ts             # Clerk auth helper
│
├── prisma/
│   └── schema.prisma             # 5 models: User, Generation, PipelineStage, AppConfig, EvalRun/Result
│
├── components/                   # React UI components
│   ├── ui/                       # shadcn-style primitives (button, card, tabs, etc.)
│   ├── generation-form.tsx       # Generation input form
│   ├── generation-history.tsx    # Sidebar history list
│   ├── generation-detail.tsx     # Result viewer
│   ├── metrics-dashboard.tsx     # Metrics display
│   └── loading-spinner.tsx       # Loading indicator
│
├── hooks/                        # Custom React hooks (use-toast, use-mobile)
├── scripts/                      # Build/test scripts
├── eval/                         # Evaluation data (evaluation.json)
├── docs/                         # Documentation (tradeoffs.md)
└── Changes IN this Project/      # Change log (Fixing Issues and Concerns.md)
```

---

## 4. The Compilation Pipeline

This is the core of AppForge. A single `POST /api/compile` request triggers 6 stages:

### Stage 1: Intent Extraction (`extractIntent`)
- **Input:** Raw natural language prompt (string)
- **Output:** `Intent` object — appType, primaryFeatures, userRoles, authRequired, paymentRequired, dataModels, complexities, assumptions, premiumFeatures, userFlows
- **LLM call:** Yes (temperature 0.2)
- **Fallback:** `buildFallbackIntent()` — keyword-based heuristic parser
- **Zod schema:** `IntentSchema` in `core.ts`

### Stage 2: System Design (`designSystem`)
- **Input:** `Intent` object
- **Output:** `SystemDesign` — architecture, pageStructure, apiEndpoints, dataEntities, accessControl (roles + permissions)
- **LLM call:** Yes (temperature 0.1)
- **Fallback:** `buildFallbackDesign()` — creates basic Home + Dashboard pages, GET/POST endpoints for each entity
- **Zod schema:** `SystemDesignSchema` in `core.ts`

### Stage 3: Schema Generation (`generateSchemas`)
- **Input:** `SystemDesign` + `Intent`
- **Output:** `SchemaOutput` — database.tables (columns + relationships), api.endpoints (path, method, request/response schemas), ui.pages (route, components, dataSource)
- **LLM call:** Yes (temperature 0)
- **Fallback:** `buildFallbackSchema()` — minimal tables with id/createdAt/updatedAt, basic endpoints
- **Zod schema:** `SchemaOutputSchema` in `core.ts`

### Stage 4: Refinement (`refineSchemas`)
- **Input:** `SchemaOutput` + `SystemDesign`
- **Output:** Refined `SchemaOutput` with cross-layer consistency
- **LLM call:** Yes (temperature 0)
- **Fallback:** `normalizeSchemaOutput()` — ensures id columns exist

### Stage 5: Validation & Repair (`validateAndRepair`)
- **Input:** `SchemaOutput`
- **Output:** `ValidationResult` — valid, errors[], warnings[], repairs[], score (0-100)
- **LLM call:** Only if rule-based repair can't fix errors (temperature 0)
- **What it checks:**
  - DB: every table has id + createdAt, valid column types, no duplicate names
  - API: endpoints start with /api/, valid HTTP methods, reference existing tables
  - UI: routes start with /, dataSource references real endpoints, non-empty components
  - Cross-layer: API fields exist in DB, page roles exist in auth
- **Auto-repair:** Adds missing id/createdAt columns, removes broken references
- **LLM repair:** Sends broken sections + errors to LLM for surgical fixes (max 2 cycles)

### Stage 6: Export (`buildImplementationPlan` + `buildPlanningDocs`)
- **Input:** `SchemaOutput` + `SystemDesign`
- **Output:** `ImplementationPlan` (prismaSchema, apiHandlers[], uiPages[], rbac, checklist) + 6 markdown docs
- **No LLM call** — pure code generation
- **Prisma generation:** `generatePrismaModel()` maps column types to Prisma types, handles relations
- **API generation:** `generateApiHandler()` creates GET/POST/PUT/DELETE handlers with Prisma queries
- **UI generation:** `generateUiPage()` creates React pages with fetch + table rendering
- **Runtime generation:** `generateSQL()`, `generateExpressServer()`, `generateReactApp()` in `lib/runtime/generators.ts`

### Post-Stage 6: Prompt Analysis Gate (pre-pipeline)
Before Stage 1 runs, `analyzePromptClarity()` in `lib/validation.ts` checks:
- Prompt length (< 20 chars = low confidence)
- Vague keywords ("something", "anything", "cool")
- Missing feature descriptions
- Missing user/role mentions
- Conflicting requirements ("simple" + "advanced AI", "offline" + "real-time")
- Scalability contradictions

If confidence < 0.6, returns `needs_clarification` with questions instead of compiling.

---

## 5. LLM Provider System (`lib/ai.ts`)

### Provider Registry
```typescript
type Provider = 'nvidia' | 'groq' | 'featherless'

// Each provider has: baseUrl, apiKey, defaultModel, fallbackModel
const PROVIDERS = {
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'mistralai/mistral-nemotron-super-49b-v1',
    fallbackModel: 'deepseek-ai/deepseek-v4-pro',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    fallbackModel: 'llama-3.1-8b-instant',
  },
  featherless: { ... },
}
```

### Selection Logic
- `LLM_PROVIDER` env var: `nvidia` | `groq` | `featherless`
- Default: NVIDIA first, Groq fallback
- On 429/timeout, auto-falls back to secondary provider

### Deterministic Mode
- `DETERMINISTIC_LLM=1` — skips all LLM calls
- Uses heuristic-based responses per stage (keyword matching)
- Useful for testing, CI, evaluation without API keys

### Key Functions
- `callLLM(options)` — raw LLM call with provider routing + fallback
- `callLLMText({ system, prompt, model })` — returns `{ text, inputTokens, outputTokens }`
- `extractJSON(text)` — parses JSON from LLM output (handles markdown fences, text wrapping)
- `STAGE_CONFIGS` — per-stage model, max_tokens, temperature settings
- `getConfigsByMode(mode)` — fast/balanced/precise token budgets
- `getActiveProviderInfo()` — returns current provider config for health checks

---

## 6. Database Schema (Prisma)

### User
- `id` (cuid), `clerkId` (unique), `email` (unique), `displayName`, `plan` (free/pro)
- Has many: `generations`, `evalRuns`

### Generation
- `id` (cuid), `userId` (FK → User), `prompt`, `mode` (fast/balanced/precise), `status` (pending/running/success/completed/failed)
- `config` (Json), `metadata` (Json), `totalLatencyMs`, `retryCount`
- Has one: `appConfig`, Has many: `pipelineStages`, `evalResults`

### PipelineStage
- `id` (cuid), `generationId` (FK → Generation), `stageName`, `stageOrder`, `status`
- `inputTokens`, `outputTokens`, `latencyMs`, `rawOutput` (Json), `errors` (Json)

### AppConfig
- `id` (cuid), `generationId` (unique FK → Generation)
- `config` (Json — the full normalized app config), `artifacts` (Json — file contents map)
- `validationPassed`, `repairsApplied` (Json), `schemaVersion`

### EvalRun / EvalResult
- `EvalRun`: groups evaluation results with name + description
- `EvalResult`: individual test result with success, latency, failureReason

---

## 7. API Endpoints

### `POST /api/compile` (Main)
- **Request:** `{ prompt: string, mode?: 'fast'|'balanced'|'precise' }`
- **Response:** Full compilation result with config, docs, implementationPlan, runtime (SQL/Express/React), validation, execution, metrics
- **Auth:** Dev mode bypasses Clerk; production requires auth
- **Prompt limit:** 5000 chars max
- **Special:** Snake game detection — hardcoded fallback for common test case

### `POST /api/generate` (Async)
- **Request:** `{ prompt: string, mode?: string }`
- **Response:** `{ jobId, status: 'pending', message }` — fires pipeline in background
- **Auth:** Requires Clerk auth
- **Pipeline:** Uses `lib/pipeline.ts` which also generates planning docs + persists artifacts

### `GET /api/evaluate`
- Runs 20-case evaluation suite, returns aggregated metrics
- **Response:** `{ success, report, summary }` with successRate, avgLatency, avgValidationScore, etc.

### `GET /api/health`
- **Response:** `{ status, pipeline: { llm: { active_provider, fallback_provider, model } }, database, uptime_seconds }`

### `GET/POST /api/generations`
- CRUD for generation records

### `GET /api/generations/[id]/export`
- Download generated artifacts as zip

---

## 8. Frontend Pages

### `/` (Landing)
- Marketing page with feature pills, CTA buttons
- Redirects to `/dashboard` if signed in

### `/compiler` (Compiler UI)
- Left panel: textarea + example prompts + compile button + stage progress
- Right panel: tabbed results (Config, SQL, Express, React, Validation, Docs, Metrics)
- Assumptions banner shows what the system assumed

### `/dashboard` (Dashboard)
- Metrics dashboard at top
- Generation form (main content)
- Generation history sidebar
- Selected generation detail view

### `/sign-in`, `/sign-up`
- Clerk authentication pages

---

## 9. Validation System (`lib/validation.ts`)

### `analyzePromptClarity(prompt)` → `PromptAnalysis`
- Returns: confidence (0-1), needsClarification, detectedIssues[], clarificationQuestions[]
- Checks: prompt length, vague keywords, missing features/roles, conflicting requirements

### `validateCrossLayerConsistency(config)` → `ConsistencyCheck`
- Checks: UI→API field mapping, API→DB field existence, auth role references, FK validity, page access roles

### `validateAppConfig(config)` → `AppConfigValidationResult`
- Full AppConfig validation against Zod schema

### `assessRepairDifficulty(errors)` → difficulty level + recommendation
- Easy/Moderate/Hard classification for repair feasibility

---

## 10. Evaluation Framework (`lib/compiler/evaluation.ts`)

### Test Cases (20 total)
**10 Real Products:** CRM, Marketplace, Blog, Project Tracker, Social Feed, E-Commerce, Analytics Dashboard, SaaS App, Health Tracker, Booking System

**10 Edge Cases:** Vague prompt, Conflicting requirements, Underspecified, Overly complex, Ambiguous roles, Technical constraints, Circular dependencies, Missing auth, Payment without model, Realtime + scalability

### Metrics per Test
- success, latency, errors, warnings, repairs, validationScore, executionScore
- retries, costEstimate, dbTableCount, apiEndpointCount, uiPageCount

### Report
- successRate, avgLatency, avgValidationScore, executionRate, averageRetries, totalCost

---

## 11. Runtime Generators (`lib/runtime/generators.ts`)

### `generateSQL(config)` → SQL string
- CREATE TABLE statements compatible with SQLite + PostgreSQL
- Maps column types: uuid→TEXT, integer→INTEGER, boolean→INTEGER, etc.

### `generateExpressServer(config)` → Express server string
- JWT auth middleware (requireAuth, requireRole)
- Route handlers for each API endpoint
- Auth login route with token signing

### `generateReactApp(config)` → Record<string, string>
- App.jsx with BrowserRouter + Routes
- Per-page components with useState/useEffect data fetching

---

## 12. Key Conventions

### Naming
- DB tables: lowercase plural (`users`, `generations`)
- Prisma models: PascalCase (`User`, `Generation`)
- API routes: `/api/{entity}` (kebab or singular)
- UI routes: `/{page-name}`

### Error Handling
- Pipeline stages catch LLM failures and fall back to deterministic parsers
- `callLLM()` throws proper `Error` instances (not plain objects)
- All API routes return `{ success: boolean, error?: string }` on failure

### Token Tracking
- `callLLMText()` returns `{ text, inputTokens, outputTokens }`
- `pipeline.ts` accumulates tokens across stages
- `totalTokens` is correctly summed (was hardcoded to 0 before fix)

### State Management
- No global state library — React hooks + server actions
- Generation state tracked in PostgreSQL via Prisma
- Compiler page uses local `useState` for prompt, result, loading

### Auth Flow
- Clerk middleware in `middleware.ts` protects non-public routes
- Dev mode bypasses auth for `/api/compile`
- `getOrCreateCurrentUserRecord()` syncs Clerk user to DB on demand

---

## 13. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LLM_PROVIDER` | No | `nvidia` (default) / `groq` / `featherless` |
| `NVIDIA_API_KEY` | Yes* | NVIDIA NIM API key (`nvapi-...`) — primary |
| `GROQ_API_KEY` | Yes* | Groq API key (`gsk_...`) — fallback |
| `FEATHERLESS_API_KEY` | Yes* | Featherless API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `LLM_MODEL` | No | Override provider default model (leave unset for correct default) |
| `DETERMINISTIC_LLM` | No | `1` for offline testing |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | Clerk auth |
| `CLERK_SECRET_KEY` | No | Clerk auth |

*At least one LLM key required, or `DETERMINISTIC_LLM=1`.*

**Important:** Do NOT set `LLM_MODEL` unless you need a specific override. The provider config already has the correct default model. Setting `LLM_MODEL=meta/llama-3.3-70b-instruct` will override the NVIDIA model and break compilation.

---

## 14. Known Gotchas & Things to Watch

1. **middleware.ts is now proxy.ts** — Next.js 16 renamed the convention. The file is `proxy.ts` at project root.

2. **Two compile endpoints exist** — `/api/compile` (synchronous, full response) and `/api/generate` (async, returns jobId). Both run the same pipeline.

3. **ZIP export** — `GET /api/generations/[id]/export?format=zip` returns organized folders (config, database, backend, frontend, docs, README).

4. **AppConfig.config** — The full normalized config is stored in `AppConfig.config`, not `Generation.config`. The export route reads from `AppConfig`.

3. **Deterministic mode** — When `DETERMINISTIC_LLM=1`, no LLM calls are made. The heuristic responses are basic and won't produce high-quality output. Use for CI/testing only.

4. **`lib/schemas.ts` vs `lib/compiler/core.ts`** — These define overlapping but different schema shapes. `core.ts` uses `SchemaOutput` (simpler), `schemas.ts` uses `AppConfig` (richer with auth, businessLogic). The pipeline uses `SchemaOutput`; the normalized config in the API response bridges both.

5. **Clerk auth in dev** — The compile endpoint bypasses auth in development. The generate endpoint does NOT — it requires Clerk. This is by design.

6. **Prisma adapter** — `lib/db.ts` uses `@prisma/adapter-pg` for the PostgreSQL adapter. The `DATABASE_URL` must point to a PostgreSQL instance (Supabase free tier works).

7. **Rate limiting** — There is no rate limiting on API endpoints. Production deployments should add middleware.

8. **Cost per compile** — ~6 LLM calls × ~800 tokens = ~$0.003 on Groq free tier. NVIDIA NIM free tier is ~40 req/min.

---

## 15. How to Work on This Project

### Adding a New Pipeline Stage
1. Add the stage function in `lib/compiler/core.ts`
2. Add a Zod schema for its input/output
3. Wire it into `lib/pipeline.ts` and `app/api/compile/route.ts`
4. Add a deterministic fallback in `lib/ai.ts`

### Adding a New API Endpoint
1. Create `app/api/{name}/route.ts`
2. Use `prisma` from `@/lib/db` for DB access
3. Use `auth()` from `@clerk/nextjs/server` for auth
4. Return `{ success, data/error }` format

### Modifying the Compiler Output
- The normalized config is built in `app/api/compile/route.ts` lines ~605-639
- The `normalizedConfig` object is what gets stored in `AppConfig.config` and returned to the frontend
- Runtime stubs (SQL/Express/React) are generated from this config in `lib/runtime/generators.ts`

### Running Evaluations
```bash
npm run eval:deterministic    # Offline mode
curl http://localhost:3000/api/evaluate  # Via API
```

### Testing Locally
```bash
npm run dev                   # Start dev server
# Compile endpoint available at http://localhost:3000/api/compile
# Auth is bypassed in dev mode for /api/compile
```
