# ClaudeInfo.md — AppForge Project Context

This is the complete reference for any AI assistant working on AppForge. It covers what the project is, how every piece fits together, the data flow, conventions, the design system, and gotchas.

---

## 1. What AppForge Is

AppForge is a **Natural Language to Application Compiler**. A user writes a plain English product description (e.g., "Build a CRM with login, contacts, dashboard, and analytics") and AppForge compiles it into:

- A validated JSON application config (database + API + UI + auth)
- A runnable Prisma schema with proper relations
- Express server stubs with JWT auth middleware
- React component stubs with data fetching
- Portable SQL, Express, and React runtime files
- 6 planning documents (PRD, TRD, App Flow, UI/UX Brief, Backend Schema, Implementation Plan)
- ZIP bundle with organized folders

The key differentiator: it's not a single LLM call. It's a **6-stage pipeline** with Zod validation at every stage, cross-layer consistency checks, and LLM-assisted auto-repair.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| Language | TypeScript | 5.7.3 |
| Database | PostgreSQL via Prisma | 7.8.0 |
| Auth | Clerk | 7.4.2 |
| LLM | Groq (primary) / NVIDIA NIM (fallback) | `llama-3.3-70b-versatile` |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui | Dark mode native |
| Validation | Zod | 3.24.1 |
| ZIP Export | JSZip | — |
| Fonts | Geist (sans) + Geist Mono (code) | — |
| Icons | Lucide React | 0.564.0 |

---

## 3. Design System

### 3.1 Color Palette

AppForge uses a custom dark-mode palette defined in `app/globals.css`. No hardcoded hex colors in components — everything references CSS variables or Tailwind theme tokens.

| Tailwind Token | CSS Variable | Hex | Usage |
|:---------------|:-------------|:----|:------|
| `forge-950` | `--surface-0` | `#08080c` | Page background |
| `forge-900` | `--surface-1` | `#0e0e14` | Primary surface |
| `forge-800` | `--surface-2` | `#16161e` | Elevated surface, cards, inputs |
| `forge-700` | `--surface-3` | `#1e1e28` | Panels, secondary surfaces |
| `forge-600` | `--border` | `rgba(255,255,255,0.06)` | Borders |
| `forge-500` | `--border-strong` | `rgba(255,255,255,0.12)` | Strong borders |
| `forge-400` | `--text-muted` | `#6e6e80` | Muted text, labels |
| `forge-300` | `--text-secondary` | `#9e9eb0` | Secondary text |
| `forge-200` | `--text-primary` | `#ccccdd` | Primary text |
| `forge-50` | — | `#eeeef4` | Bright text, headings |
| `accent` | `--fill-accent` | `#6366f1` | Primary CTA, active states |
| `accent-hover` | `--text-accent` | `#818cf8` | Links, code, hover states |
| `accent-pressed` | — | `#4f46e5` | Pressed states |
| `accent-subtle` | `--fill-accent-subtle` | `rgba(99,102,241,0.12)` | Subtle accent backgrounds |
| `secondary` | — | `#14b8a6` | Pipeline stages, secondary accent |
| `secondary-hover` | — | `#2dd4bf` | Secondary hover |
| `success` | `--text-success` | `#10b981` | Valid states, completions |
| `success-subtle` | `--bg-success` | `rgba(16,185,129,0.12)` | Success backgrounds |
| `danger` | `--text-danger` | `#f43f5e` | Errors, destructive actions |
| `danger-subtle` | `--bg-danger` | `rgba(244,63,94,0.12)` | Error backgrounds |
| `warning` | `--text-warning` | `#f59e0b` | Assumptions, rate limits |
| `warning-subtle` | `--bg-warning` | `rgba(245,158,11,0.12)` | Warning backgrounds |

### 3.2 Typography Scale

| Tailwind Class | Size | Weight | Usage |
|:---------------|:-----|:-------|:------|
| `text-xs` | 12px | 400 | Labels, meta, status badges |
| `text-sm` | 14px | 400 | Body, descriptions |
| `text-base` | 16px | 400 | Body emphasis |
| `text-lg` | 18px | 500 | Subheadings |
| `text-xl` | 20px | 600 | Section titles |
| `text-2xl` | 24px | 700 | Page titles |
| `text-3xl` | 30px | 700 | Hero subheading |
| `text-4xl` | 36px | 700 | Hero headline |

**Font usage**:
- `font-sans` (Geist) — All UI text
- `font-mono` (Geist Mono) — Code blocks, pipeline stage numbers, technical labels, status badges, section labels

### 3.3 Spacing Scale

All spacing values are multiples of 4px:
`1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px, 8=32px, 10=40px, 12=48px, 16=64px, 20=80px`

### 3.4 Button Hierarchy

- **Primary**: `bg-accent text-white` — indigo background, white text, shadow. One per screen.
- **Secondary**: `border border-forge-600 text-forge-200` — transparent with border.
- **Ghost**: `text-forge-400 hover:bg-forge-800` — no border, subtle hover.
- **Danger**: `bg-danger text-white` — rose background for destructive actions.

### 3.5 Focus States

All interactive elements: `focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-950`

### 3.6 Loading / Empty / Error States

- **Loading**: Skeleton shimmer (`.skeleton` class with `skeleton-pulse` animation)
- **Empty**: Directional text ("Describe your app above to get started"), not "No data"
- **Error**: `bg-danger-subtle border-danger/30` card with error message + retry action

### 3.7 Signature Element: Pipeline Visualization

The 6-stage pipeline is the visual centerpiece:
- **Desktop**: Horizontal strip with 56px numbered circles (teal accent), connecting line, animated beam
- **Mobile**: Vertical layout with left-aligned connecting line
- **Compiler**: Live stage indicators with pulse animation during compilation, current stage name shown

---

## 4. Project Structure

```
AppForge/
├── proxy.ts                        # Clerk auth proxy (Next.js 16)
├── app/
│   ├── globals.css                 # Design system variables + Tailwind @theme
│   ├── layout.tsx                  # Root layout (ClerkProvider + nav)
│   ├── page.tsx                    # Landing page
│   ├── api/
│   │   ├── compile/route.ts        # MAIN ENDPOINT — synchronous 6-stage compile
│   │   ├── generate/route.ts       # Async endpoint — fires pipeline in background
│   │   ├── evaluate/route.ts       # Runs 20-case evaluation suite
│   │   ├── health/route.ts         # System health check (DB + LLM provider)
│   │   ├── metrics/route.ts        # Metrics dashboard data
│   │   ├── plan/upgrade/route.ts   # Plan upgrade API (instant, no payment)
│   │   ├── plan/join-team/route.ts # Team join API (atomic seat transaction)
│   │   ├── generations/            # CRUD + ZIP/JSON/YAML export
│   │   └── webhooks/clerk/         # Clerk webhook handler
│   ├── compiler/page.tsx           # Two-panel compiler UI
│   ├── dashboard/page.tsx          # Stats + form + history
│   ├── demo/page.tsx               # Pre-compiled examples
│   ├── pricing/page.tsx            # 3-tier pricing
│   ├── generated/[gid]/page.tsx    # Artifact viewer
│   ├── builder/page.tsx            # Prompt editor
│   ├── sign-in/                    # Clerk sign-in
│   ├── sign-up/                    # Clerk sign-up
│   └── components/
│       └── auth-controls.tsx       # Sign in/up + UserButton
│
├── lib/                            # Core business logic
│   ├── compiler/
│   │   ├── core.ts                 # Pipeline stages 1–5 + validation (810 lines)
│   │   ├── export.ts               # Stage 6 — Prisma/API/UI generation + 6 docs
│   │   └── evaluation.ts           # 20-case test suite + report generation
│   ├── runtime/
│   │   └── generators.ts           # Portable SQL, Express server, React app generation
│   ├── ai.ts                       # LLM provider registry — Groq/NVIDIA/Featherless + fallback + 60s timeout
│   ├── plan-limits.ts              # Plan gating + detail levels + output quality tiers
│   ├── schemas.ts                  # Zod schemas for AppConfig, Intent, Auth, DB, API, UI
│   ├── validation.ts               # Cross-layer consistency checks + prompt clarity analysis
│   ├── pipeline.ts                 # Pipeline orchestrator — delegates to core.ts, persists to DB
│   ├── metrics.ts                  # Quality scoring + user/system metrics
│   ├── db.ts                       # Prisma client singleton + Clerk user sync
│   └── clerk-user.ts               # Clerk auth helper
│
├── prisma/
│   └── schema.prisma               # 6 models: User, Generation, PipelineStage, AppConfig, EvalRun/Result, TeamCode
│
├── components/                     # React UI components
│   ├── ui/                         # 57 shadcn/ui components (button, card, tabs, etc.)
│   ├── Hero.tsx                    # Landing hero with glow, badge, headline, video, CTAs
│   ├── ExamplePrompts.tsx          # Quick-start prompt chips
│   ├── GenerationStatus.tsx        # Error classification UI (rate-limit, provider-fallback, etc.)
│   ├── generation-form.tsx         # Generation input form with ExamplePrompts
│   ├── generation-detail.tsx       # Tabbed result viewer (Overview/Database/API/Components/Raw)
│   ├── generation-history.tsx      # Sidebar history list with skeleton loading
│   ├── loading-spinner.tsx         # Loading indicator
│   ├── metrics-dashboard.tsx       # Metrics display (4-card grid)
│   ├── upgrade-banner.tsx          # Upgrade CTA banner
│   ├── theme-provider.tsx          # next-themes wrapper
│   └── builder/
│       └── editor.tsx              # Prompt editor with autosave + history
│
├── styles/
│   └── globals.css                 # shadcn/ui oklch theme (aligned to forge palette)
│
├── hooks/                          # Custom React hooks (use-toast, use-mobile)
├── scripts/                        # Build/test scripts
├── eval/                           # Evaluation data (evaluation.json)
├── docs/                           # Documentation (tradeoffs.md)
├── UI_AUDIT.md                     # Design system documentation + audit
└── Changes IN this Project/        # Change log
```

---

## 5. The Compilation Pipeline

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

### Pre-Pipeline: Prompt Analysis Gate
Before Stage 1 runs, `analyzePromptClarity()` in `lib/validation.ts` checks:
- Prompt length (< 20 chars = low confidence)
- Vague keywords ("something", "anything", "cool")
- Missing feature descriptions
- Missing user/role mentions
- Conflicting requirements ("simple" + "advanced AI", "offline" + "real-time")
- Scalability contradictions

If confidence < 0.6, returns `needs_clarification` with questions instead of compiling.

---

## 6. LLM Provider System (`lib/ai.ts`)

### Provider Registry
```typescript
type Provider = 'nvidia' | 'groq' | 'featherless'

const PROVIDERS = {
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'nvidia/llama-3.3-nemotron-super-49b-v1',
    fallbackModel: 'deepseek-ai/deepseek-v4-pro',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    fallbackModel: 'llama-3.1-8b-instruct',
  },
  featherless: { ... },
}
```

### Selection Logic
- `LLM_PROVIDER` env var: `nvidia` | `groq` | `featherless`
- Default: Groq (fast), NVIDIA fallback (slow but capable)
- On 429/timeout, auto-falls back to secondary provider
- 60-second timeout per LLM call prevents indefinite hangs

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

## 7. Database Schema (Prisma)

### User
- `id` (cuid), `clerkId` (unique), `email` (unique), `displayName`, `plan` (PlanTier enum: free/pro/team)
- `planStartedAt`, `compilesThisMonth`, `compilesResetAt` — plan gating fields
- `ownedTeamCode` (optional FK → TeamCode), `memberOfTeamId` (optional FK → TeamCode)
- Has many: `generations`, `evalRuns`

### TeamCode
- `id` (cuid), `code` (unique, format: TEAM-XXXXXXXX), `ownerId` (unique FK → User)
- `seatsUsed` (default 1), `maxSeats` (default 5), `createdAt`
- Has many: `members` (User[])
- Atomic seat transaction via `$transaction` prevents race conditions

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

## 8. API Endpoints

### `POST /api/compile` (Main)
- **Request:** `{ prompt: string, mode?: 'fast'|'balanced'|'precise' }`
- **Response:** Full compilation result with config, docs, implementationPlan, runtime (SQL/Express/React), validation, execution, metrics
- **Auth:** Dev mode bypasses Clerk; production requires auth
- **Prompt limit:** 5000 chars max

### `POST /api/generate` (Async)
- **Request:** `{ prompt: string, mode?: string }`
- **Response:** `{ jobId, status: 'pending', message }` — fires pipeline in background
- **Auth:** Requires Clerk auth
- **Pipeline:** Uses `lib/pipeline.ts` which also generates planning docs + persists artifacts

### `GET /api/evaluate`
- Runs 20-case evaluation suite, returns aggregated metrics

### `GET /api/health`
- **Response:** `{ status, pipeline: { llm: { active_provider, fallback_provider, model } }, database, uptime_seconds }`

### `GET/POST /api/generations`
- CRUD for generation records

### `GET /api/generations/[id]/export`
- Export as JSON, YAML, or ZIP

---

## 9. Frontend Pages

### `/` (Landing)
- Hero with pipeline strip (6 stages, animated beam)
- Metrics section (6 stages, 7 invariants, 20 eval cases)
- Feature cards (multi-stage pipeline, auto-repair, execution-ready output)
- Redirects to `/dashboard` if signed in

### `/compiler` (Compiler UI)
- Left panel: textarea + example prompts + mode selector + compile button + pipeline progress
- Right panel: tabbed results (Config, SQL, Express, React, Validation, Docs, Metrics)
- Export buttons: JSON, YAML, ZIP
- Assumptions banner shows what the system assumed

### `/dashboard` (Dashboard)
- 4 stat cards (Total Compilations, Success Rate, Avg Latency, Repairs Made)
- New Compilation form (textarea + mode selector)
- Generation detail view (when selected)
- History sidebar with status badges

### `/demo` (Demo)
- 3 pre-compiled examples (CRM, LMS, Edge: Vague)
- Tab switching between examples
- Split view: prompt input | JSON output

### `/pricing` (Pricing)
- 3-tier cards (Free, Pro, Team)
- Monthly/yearly toggle with savings badge
- Feature comparison table
- Team code input

### `/generated/[gid]` (Generated Artifacts)
- Server-rendered artifact viewer
- 6 markdown docs with preview
- Download ZIP button
- Available files grid

### `/builder` (Builder)
- Prompt editor with autosave
- History panel with restore/delete
- Compile result viewer

---

## 10. Components

### `components/Hero.tsx`
- Landing page hero with indigo glow, badge, headline, video embed, CTAs
- Uses CSS custom properties for glow gradient

### `components/ExamplePrompts.tsx`
- 3 quick-start prompt chips as buttons
- Props: `onSelect(prompt)`, `disabled`

### `components/GenerationStatus.tsx`
- Error classification: rate-limit, provider-fallback, all-providers-failed, generic
- Each error kind has distinct UI (icon, message, retry button)
- Props: `status`, `errorMessage`, `onRetry`

### `components/generation-form.tsx`
- Full generation form with ExamplePrompts, textarea, mode selector
- Calls `/api/compile` and opens artifact window
- Props: `onGenerationCreated(jobId)`

### `components/generation-detail.tsx`
- Tabbed detail viewer (Overview, Database, API, Components, Raw)
- Auto-polls while generation is pending
- Props: `generationId`

### `components/generation-history.tsx`
- Scrollable list of past generations
- Skeleton loading, empty state, error state with retry
- Props: `onSelect(id)`, `selectedId`

### `components/metrics-dashboard.tsx`
- 4-card grid: Total Compilations, Success Rate, Avg Latency, Avg Tokens
- Fetches from `/api/metrics`

### `components/upgrade-banner.tsx`
- Inline upgrade CTA with plan info
- Props: `message`, `currentPlan`

### `components/builder/editor.tsx`
- Prompt editor with localStorage autosave
- History panel with save/restore/delete
- Compile button with result viewer

---

## 11. Validation System (`lib/validation.ts`)

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

## 12. Evaluation Framework (`lib/compiler/evaluation.ts`)

### Test Cases (20 total)
**10 Real Products:** CRM, Marketplace, Blog, Project Tracker, Social Feed, E-Commerce, Analytics Dashboard, SaaS App, Health Tracker, Booking System

**10 Edge Cases:** Vague prompt, Conflicting requirements, Underspecified, Overly complex, Ambiguous roles, Technical constraints, Circular dependencies, Missing auth, Payment without model, Realtime + scalability

### Metrics per Test
- success, latency, errors, warnings, repairs, validationScore, executionScore
- retries, costEstimate, dbTableCount, apiEndpointCount, uiPageCount

### Report
- successRate, avgLatency, avgValidationScore, executionRate, averageRetries, totalCost

---

## 13. Runtime Generators (`lib/runtime/generators.ts`)

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

## 14. Key Conventions

### Naming
- DB tables: lowercase plural (`users`, `generations`)
- Prisma models: PascalCase (`User`, `Generation`)
- API routes: `/api/{entity}` (kebab or singular)
- UI routes: `/{page-name}`

### Styling
- All components use Tailwind classes with the forge palette tokens
- No inline `style={}` in new code — use Tailwind classes
- CSS variables in `app/globals.css` for legacy inline styles (SVGs, gradients)
- `cn()` utility from `@/lib/utils` for conditional classes
- shadcn/ui components in `components/ui/` use their own design tokens

### Error Handling
- Pipeline stages catch LLM failures and fall back to deterministic parsers
- `callLLM()` throws proper `Error` instances (not plain objects)
- All API routes return `{ success: boolean, error?: string }` on failure

### Token Tracking
- `callLLMText()` returns `{ text, inputTokens, outputTokens }`
- `pipeline.ts` accumulates tokens across stages
- `totalTokens` is correctly summed

### State Management
- No global state library — React hooks + server actions
- Generation state tracked in PostgreSQL via Prisma
- Compiler page uses local `useState` for prompt, result, loading

### Auth Flow
- Clerk middleware in `proxy.ts` protects non-public routes
- Dev mode bypasses auth for all `/api/*` routes (not just `/api/compile`)
- `getOrCreateCurrentUserRecord()` syncs Clerk user to DB on demand

---

## 15. Environment Variables

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

**Important:** Do NOT set `LLM_MODEL` unless you need a specific override. The provider config already has the correct default model.

---

## 16. Known Gotchas

1. **proxy.ts handles auth** — Next.js 16 renamed middleware to proxy. Dev mode bypasses ALL `/api/*` routes.

2. **Two compile endpoints** — `/api/compile` (synchronous) and `/api/generate` (async). Both run the same pipeline.

3. **ZIP export** — `GET /api/generations/[id]/export?format=zip` returns organized folders (config, database, backend, frontend, docs, README).

4. **AppConfig.config** — Full normalized config is in `AppConfig.config`, not `Generation.config`. Export reads from AppConfig.

5. **YAML export is free** — YAML is just a format conversion of JSON. Only ZIP requires Pro/Team.

6. **Plan gating** — Free: 10 compiles, fast mode, JSON+YAML export. Pro: 100 compiles, balanced mode, all exports. Team: unlimited, all modes, ZIP + team sharing.

7. **Output quality tiers** — Free generates minimal output (3-5 cols/table), Pro generates maximum (12-20+), Team generates standard (8-12).

8. **NVIDIA NIM is slow** — ~30s per LLM call. Groq is ~1-2s. Use Groq for development.

9. **60s timeout** — Each LLM call has a 60-second timeout to prevent indefinite hangs.

10. **Prompt analysis threshold** — Confidence < 0.4 triggers clarification. Short prompts with app-type keywords (CRM, LMS, etc.) pass through.

11. **Two CSS files** — `app/globals.css` (design system + Tailwind @theme) and `styles/globals.css` (shadcn/ui oklch tokens). Both are imported by different parts of the app.

12. **Tailwind v4** — No `tailwind.config.ts` file. Configuration is CSS-first via `@theme inline` in `styles/globals.css` and `@theme` in `app/globals.css`.

---

## 17. How to Work on This Project

### Modifying the UI
1. Check `UI_AUDIT.md` for the design system (colors, type scale, spacing)
2. All new components use Tailwind classes with forge palette tokens
3. Only one primary action per screen (indigo accent button)
4. Pipeline visualization uses teal accent (`secondary` token)
5. Run `npx tsc --noEmit` to verify no type errors

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
# Compile endpoint: http://localhost:3000/api/compile
# Auth is bypassed in dev mode for /api/*
```
