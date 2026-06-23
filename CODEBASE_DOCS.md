# AppForge - Complete Codebase Documentation

## What AppForge Is

AppForge is an **AI-powered application compiler** that converts natural language product descriptions into validated, executable application blueprints. Think of it as a "compiler" for software - input natural language, output structured app config with real code.

**Tagline:** "Describe it. Compile it. Ship it."

---

## Architecture Overview

### Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database:** PostgreSQL via Prisma 7.8
- **Auth:** Clerk 7.4
- **LLM:** Featherless API (Qwen/Qwen3.6-35B-A3B)
- **UI:** Tailwind CSS 4.2, shadcn/ui, Lucide icons
- **Validation:** Zod 3.24
- **Deployment:** Vercel

### Core Architecture: 5-Stage Compiler Pipeline

```
Natural Language Input
       |
  +-------------------------------------------+
  | Stage 1: Intent Extraction                |
  | Parse NL -> structured intent             |
  | (appType, features, roles, entities)      |
  +-------------------------------------------+
       |
  +-------------------------------------------+
  | Stage 2: System Design                    |
  | Intent -> architecture blueprint          |
  | (pages, API endpoints, data entities)     |
  +-------------------------------------------+
       |
  +-------------------------------------------+
  | Stage 3: Schema Generation                |
  | Design -> concrete schemas                |
  | (DB tables, API endpoints, UI pages)      |
  +-------------------------------------------+
       |
  +-------------------------------------------+
  | Stage 4: Refinement                       |
  | Resolve cross-layer inconsistencies       |
  +-------------------------------------------+
       |
  +-------------------------------------------+
  | Stage 5: Validation & Repair              |
  | Rule-based checks + LLM repair            |
  | Max 2 repair cycles                       |
  +-------------------------------------------+
       |
  Output: Validated, executable app config
```

---

## File Structure & Responsibilities

### Core Pipeline
```
lib/
  compiler/
    core.ts          # 5-stage pipeline (extractIntent, designSystem, generateSchemas, refineSchemas, validateAndRepair)
    export.ts        # Generates implementation plan + 6 planning docs (PRD, TRD, AppFlow, UI/UX, Backend, ImplPlan)
    evaluation.ts    # 20-test evaluation framework (10 real + 10 edge cases)
  ai.ts              # LLM client (Featherless API), system prompts, JSON extraction, deterministic stub
  pipeline.ts        # Legacy pipeline (uses lib/ai.ts, separate from compiler/)
  schemas.ts         # Zod schemas for all data types
  validation.ts      # Cross-layer consistency checks, prompt clarity analysis, repair difficulty assessment
  metrics.ts         # Quality scoring, user/system metrics
  execution-context.ts # Execution tracking (timing, tokens, cost)
  db.ts              # Prisma client singleton + Clerk user sync
  clerk-user.ts      # Server-side user record from Clerk
  utils.ts           # cn() Tailwind merge utility
  export/
    scaffold.ts      # Standalone Node.js app scaffold generator
```

### API Routes
```
app/api/
  compile/route.ts          # POST - Main compiler endpoint (synchronous 5-stage pipeline)
  generate/route.ts         # POST - Async generation job (fire-and-forget via pipeline.ts)
  generations/route.ts      # GET - List user's recent generations
  generations/[id]/
    route.ts                # GET - Single generation detail
    status/route.ts         # GET - Generation status polling
    export/route.ts         # GET - Export generation as JSON/YAML/ZIP
  generated/[gid]/
    download/route.ts       # GET - Download generated artifacts as ZIP (from DB)
  evaluate/route.ts         # GET - Run 20-test evaluation suite
  metrics/route.ts          # GET - User or system metrics
  webhooks/clerk/
    route.ts                # POST - Clerk webhook (user.created/deleted)
```

### Database Schema (Prisma)
```
User: id, clerkId, email, displayName, plan
Generation: id, userId, prompt, mode, status, config(Json), metadata(Json), totalLatencyMs
PipelineStage: id, generationId, stageName, status, inputTokens, outputTokens, latencyMs
AppConfig: id, generationId, config(Json), artifacts(Json), validationPassed
EvalRun/EvalResult: Test framework results
```

---

## Changes Made (Chronological)

### Session 1: Bug Fixes
1. Added `config`, `metadata` JSON columns to Generation model
2. Added `artifacts` JSON column to AppConfig
3. Removed `ignoreBuildErrors: true` from next.config.mjs
4. Fixed model name in compiler/core.ts (claude -> Qwen)
5. Fixed metrics.ts field name mismatch (api.routes -> api.endpoints)
6. Replaced filesystem artifact storage with database storage
7. Fixed pipeline.ts references to non-existent DB columns
8. Added missing validateAppConfig/repairAppConfig functions to validation.ts
9. Installed archiver package
10. Fixed generation variable scoping bug
11. Fixed TypeScript type mismatches across multiple files
12. Excluded public/generated from TypeScript checking

### Session 2: Plan-Based Implementation

#### Phase 1: Intelligent Validation + Repair Engine (CRITICAL)
**File:** `lib/compiler/core.ts`

- Rewrote `validateAndRepair()` with comprehensive rule-based checks:
  - DB: id columns, timestamps, valid types, no duplicates, FK references
  - API: valid paths, valid methods, table references
  - UI: route format, dataSource references, component names
  - Cross-layer: API fields exist in DB, auth roles defined
- Added LLM-based intelligent repair loop:
  - Sends broken section + errors to LLM
  - Re-validates after repair
  - Max 2 repair cycles
  - Falls back to rule-based repairs if LLM fails
- Added `validateAndRepairNoLLM()` for post-repair re-validation
- Added `validateSchemaOutput()` for quick structural checks

#### Phase 2: Full Runtime Integration (CRITICAL)
**File:** `lib/compiler/export.ts`

- Rewrote `generateApiHandler()` to produce real Next.js route handlers:
  - GET: list all + find by id with Prisma queries
  - POST: create with error handling
  - PUT: update by id
  - DELETE: delete by id
  - All with proper imports, try/catch, HTTP status codes
- Rewrote `generateUiPage()` to produce real React components:
  - 'use client' directive
  - useState/useEffect for data fetching
  - Loading/error states
  - Dynamic table rendering from API data
  - Proper TypeScript interfaces
- Enhanced `generatePrismaModel()`:
  - Proper @relation directives
  - FK columns with references
  - Reverse relation fields
  - Handles one-to-many relationships

#### Phase 3: Failure Handling + Prompt Analysis (IMPORTANT)
**File:** `app/api/compile/route.ts`

- Added prompt analysis gate at start of compile endpoint:
  - Calls `analyzePromptClarity()` before pipeline runs
  - Returns `needs_clarification` status with questions if confidence < 0.6
  - Stores analysis in Generation metadata
- Added assumption surfacing:
  - All assumptions from intent extraction included in response
  - Visible to user for review
- Enhanced CompileResponse type with:
  - `status`, `assumptions`, `confidence`, `detectedIssues`, `clarificationQuestions`
  - `repairs` array in validation section

#### Phase 4: Cost Tracking + Quality Metrics (IMPORTANT)
**Files:** `lib/validation.ts`, `lib/compiler/evaluation.ts`

- Enhanced `analyzePromptClarity()` with conflict detection:
  - "simple" vs "advanced" requirements
  - "offline" vs "real-time" capabilities
  - "high scalability" vs "single database"
  - Missing essential information
- Enhanced evaluation framework:
  - Added `dbTableCount`, `apiEndpointCount`, `uiPageCount` to TestResult
  - Added `repairs` array tracking
  - Added `category` field (real-product vs edge-case)
  - Enhanced report with avg DB tables, API endpoints, UI pages
  - Better formatted output

---

## Environment Variables

```
DATABASE_URL=postgresql://...        # PostgreSQL connection string
FEATHERLESS_API_KEY=...              # Featherless API key for LLM
FEATHERLESS_BASE_URL=...             # API base URL
CLERK_SECRET_KEY=...                 # Clerk auth secret
CLERK_WEBHOOK_SECRET=...             # Clerk webhook secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=... # Clerk publishable key
DETERMINISTIC_LLM=1                  # Set to '1' for offline testing
```

---

## Key Design Decisions

1. **Two compilation systems:** lib/pipeline.ts (legacy) and lib/compiler/core.ts (current, used by /api/compile)

2. **Deterministic mode:** When DETERMINISTIC_LLM=1, uses rule-based fallbacks instead of LLM calls

3. **Artifacts in DB:** Generated files stored as JSON in AppConfig.artifacts, not filesystem

4. **Intelligent repair:** Max 2 LLM repair cycles, then falls back to rule-based fixes

5. **Prompt analysis gate:** Vague/conflicting prompts get clarification questions before compilation
