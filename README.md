<div align="center">

# AppForge

### Natural Language to Application Compiler

Convert plain English product descriptions into complete, validated, executable application configurations — schemas, APIs, UI pages, and production-ready documentation.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## What is AppForge?

AppForge is a **6-stage AI compiler** that transforms natural language product descriptions into structured application blueprints. Unlike simple code generators, AppForge runs a multi-stage pipeline with Zod validation, cross-layer consistency checks, and intelligent auto-repair — producing output that is immediately usable for production development.

**Input:**
> "Build a CRM with login, contacts, dashboard, role-based access, and premium analytics."

**Output:**
- Validated JSON application config (DB + API + UI + Auth)
- Prisma schema with proper relations and types
- Express server with JWT auth middleware
- React component tree with routing
- 6 planning documents (PRD, TRD, App Flow, UI/UX Brief, Backend Schema, Implementation Plan)
- ZIP bundle with all artifacts organized in folders
- Portable SQL, Express, and React runtime stubs

---

## How It Works

```
User Prompt
    │
    ▼
┌─────────────────────────────────────────────────┐
│  Stage 1: Intent Extraction                      │
│  Parse natural language → structured intent      │
│  (app type, features, roles, entities, flows)    │
├─────────────────────────────────────────────────┤
│  Stage 2: System Design                          │
│  Architecture blueprint → pages, endpoints,      │
│  data entities, access control model             │
├─────────────────────────────────────────────────┤
│  Stage 3: Schema Generation                      │
│  DB tables (5+ columns each) + API endpoints +   │
│  UI pages with data sources                      │
├─────────────────────────────────────────────────┤
│  Stage 4: Refinement                             │
│  Merge schemas, resolve inconsistencies          │
├─────────────────────────────────────────────────┤
│  Stage 5: Validation & Repair                    │
│  Rule-based checks + LLM-assisted repair         │
│  Cross-layer invariants enforced                 │
├─────────────────────────────────────────────────┤
│  Stage 6: Export                                  │
│  Prisma schema + API handlers + UI pages +       │
│  6 planning documents + runtime stubs + ZIP      │
└─────────────────────────────────────────────────┘
    │
    ▼
Validated Application Blueprint
```

Each stage is a separate module with its own input/output contract. No single-prompt generation.

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/AppForge.git
cd AppForge

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys (see Environment Variables below)

# Push database schema
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LLM_PROVIDER` | No | `nvidia` (default) / `groq` / `featherless` |
| `NVIDIA_API_KEY` | Yes* | NVIDIA NIM API key (`nvapi-...`) — primary provider |
| `GROQ_API_KEY` | Yes* | Groq API key (`gsk_...`) — fallback provider |
| `FEATHERLESS_API_KEY` | Yes* | Featherless API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | Clerk auth publishable key |
| `CLERK_SECRET_KEY` | No | Clerk auth secret key |
| `DETERMINISTIC_LLM` | No | Set to `1` for offline testing |
| `LLM_MODEL` | No | Override default model (uses provider default if unset) |

*\*At least one LLM API key is required, or set `DETERMINISTIC_LLM=1` for offline mode.*

**Provider selection:** Default is NVIDIA NIM (`mistralai/mistral-nemotron-super-49b-v1`) with automatic Groq fallback on 429/timeout. The `LLM_MODEL` env var overrides the provider default — leave it unset to use the correct model.

---

## Project Structure

```
AppForge/
├── app/
│   ├── api/
│   │   ├── compile/route.ts          # Main compile endpoint (synchronous)
│   │   ├── generate/route.ts         # Async generation endpoint
│   │   ├── evaluate/route.ts         # Evaluation framework runner
│   │   ├── health/route.ts           # System health check
│   │   ├── metrics/route.ts          # Metrics dashboard data
│   │   └── generations/              # Generation CRUD + ZIP/JSON/YAML export
│   ├── compiler/page.tsx             # Compiler UI (two-panel, 7 tabs + export)
│   ├── dashboard/page.tsx            # Dashboard with stats, form, history
│   ├── demo/page.tsx                 # Pre-compiled examples with split view
│   └── page.tsx                      # Landing page with pipeline strip
├── lib/
│   ├── compiler/
│   │   ├── core.ts                   # Pipeline stages 1–5 + validation
│   │   ├── export.ts                 # Stage 6: Prisma/API/UI generation + 6 docs
│   │   └── evaluation.ts             # 20-case test suite
│   ├── runtime/
│   │   └── generators.ts             # Portable SQL, Express, React generation
│   ├── ai.ts                         # LLM provider registry (NVIDIA/Groq/Featherless) + fallback
│   ├── schemas.ts                    # Zod schemas for all pipeline outputs
│   ├── validation.ts                 # Cross-layer consistency checks + prompt analysis
│   ├── pipeline.ts                   # Pipeline orchestrator with DB persistence
│   ├── metrics.ts                    # Quality scoring + metrics
│   ├── db.ts                         # Prisma client singleton
│   └── clerk-user.ts                 # Clerk auth user sync
├── prisma/
│   └── schema.prisma                 # Database models (User, Generation, PipelineStage, AppConfig, EvalRun)
├── components/                       # React UI components
├── hooks/                            # Custom React hooks
├── docs/                             # Documentation (tradeoffs.md)
├── scripts/                          # Build/test scripts
├── eval/                             # Evaluation data
└── Changes IN this Project/          # Change log
```

---

## API Reference

### `POST /api/compile`

The primary endpoint. Accepts a natural language prompt and returns a complete application blueprint.

**Request:**
```json
{
  "prompt": "Build a CRM with login, contacts, dashboard, and analytics",
  "mode": "balanced"
}
```

**Modes:**

| Mode | Latency | Cost | Quality | Use Case |
|------|---------|------|---------|----------|
| `fast` | ~1.5s | ~$0.002 | 70/100 | Prototyping |
| `balanced` | ~3s | ~$0.006 | 85/100 | Default |
| `precise` | ~8s | ~$0.018 | 95/100 | Production |

**Response:**
```json
{
  "success": true,
  "jobId": "clx...",
  "config": { ... },
  "docs": { "prd": "...", "trd": "...", "appFlow": "...", "uiUxBrief": "...", "backendSchema": "...", "implementationPlan": "..." },
  "implementationPlan": { "prismaSchema": "...", "apiHandlers": [...], "uiPages": [...], "checklist": [...] },
  "runtime": { "sql": "...", "express": "...", "react": { "App.jsx": "..." } },
  "validation": { "valid": true, "score": 88, "errors": [], "repairs": [...] },
  "execution": { "executable": true, "readyForDeployment": true },
  "metrics": { "latency": 2450, "stageTimes": { ... } }
}
```

### `GET /api/generations/[id]/export?format=json|yaml|zip`

Export a completed generation. The `zip` format includes organized folders:
```
config/appforge-config.json
database/schema.sql + schema.prisma
backend/server.js + API route handlers
frontend/App.jsx + page components
docs/ (6 planning documents)
README.md with usage instructions
```

### `GET /api/health`

Returns system health with database connectivity and active LLM provider info.

### `GET /api/evaluate`

Runs the 20-case evaluation suite and returns aggregated metrics.

---

## LLM Provider System

AppForge supports multiple providers with automatic fallback:

| Provider | Model | Rate Limit | Best For |
|----------|-------|------------|----------|
| **NVIDIA NIM** (default) | `mistralai/mistral-nemotron-super-49b-v1` | ~40 req/min | Structured JSON generation |
| **Groq** (fallback) | `llama-3.3-70b-versatile` | ~30 req/min | Low-latency inference |
| **Featherless** | `meta-llama/Meta-Llama-3.3-70B-Instruct` | Varies | Model variety |

**Fallback logic:** On 429 (rate limit) or timeout, automatically tries the secondary provider before failing.

**Deterministic mode:** Set `DETERMINISTIC_LLM=1` to skip all LLM calls and use heuristic-based responses for testing/CI.

See [docs/tradeoffs.md](docs/tradeoffs.md) for detailed provider comparison.

---

## Validation & Repair

### Rule-Based Checks (Stage 5)

- **DB Layer:** Every table has `id` (uuid) + `createdAt`; valid column types; no duplicate names; FK references valid
- **API Layer:** Endpoints start with `/api/`; valid HTTP methods; reference existing DB tables
- **UI Layer:** Routes start with `/`; `dataSource` maps to real API endpoints
- **Cross-Layer:** API fields exist in DB; page roles exist in auth; endpoint roles exist in auth

### Auto-Repair

1. Adds missing `id` columns (uuid type)
2. Adds missing `createdAt` timestamps
3. Removes broken API field references
4. Remaps invalid UI data sources
5. Injects missing role definitions
6. Adds `Subscription` table for premium features

### LLM-Assisted Repair

When rule-based repair can't fix issues, the system sends broken sections to the LLM with specific error descriptions. Max 2 repair cycles.

### Prompt Analysis Gate

Before compilation, analyzes prompt clarity:
- Detects vague language and short prompts
- Identifies conflicting requirements ("simple" + "advanced AI")
- Returns clarification questions when confidence < 0.6

---

## Cross-Layer Invariants

| # | Invariant | Enforced By |
|---|-----------|-------------|
| 1 | Every API request field exists in its DB table | `validateAndRepair()` |
| 2 | Every UI form field maps to a valid API field | `validateCrossLayerConsistency()` |
| 3 | Every page access role exists in auth schema | `validateAndRepair()` |
| 4 | Every endpoint role exists in auth schema | `validateAndRepair()` |
| 5 | Premium features require Subscription table | `validateAndRepair()` |
| 6 | Every entity has at least one API endpoint | `validateAndRepair()` |
| 7 | Auth-required endpoints have JWT middleware | `generateExpressServer()` |

---

## UI Pages

### Landing (`/`)
- Fixed nav with frosted glass effect
- Hero with radial glow, headline, CTAs
- Pipeline strip with animated beam connecting 6 stages
- Metrics row (6 stages, 7 invariants, 20 test cases)
- Feature cards

### Compiler (`/compiler`)
- Two-panel layout: 260px left sidebar + flexible right panel
- Left: textarea, example prompts, mode selector, compile button, pipeline progress, assumptions
- Right: 7 tabbed views (Config, SQL, Express, React, Validation, Docs, Metrics)
- Export buttons: JSON, YAML, ZIP bundle

### Dashboard (`/dashboard`)
- 4 stat cards (compilations, success rate, latency, repairs)
- Compilation form with mode selector
- History sidebar with status badges

### Demo (`/demo`)
- Pre-compiled outputs from 3 test cases
- Split view: prompt on left, JSON output on right

---

## Evaluation Framework

20-case test suite covering:

- **10 Real Products:** CRM, Marketplace, Blog, Project Tracker, Social Feed, E-Commerce, Analytics Dashboard, SaaS App, Health Tracker, Booking System
- **10 Edge Cases:** Vague prompts, conflicting requirements, underspecified inputs, overly complex specs, ambiguous roles, technical constraints, circular dependencies, missing auth, payment without model, realtime + scalability conflicts

```bash
npm run eval:deterministic    # Offline mode
curl http://localhost:3000/api/evaluate  # Via API
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) + TypeScript 5.7 |
| **AI Pipeline** | NVIDIA NIM (primary) / Groq (fallback) — OpenAI-compatible |
| **Default Model** | `mistralai/mistral-nemotron-super-49b-v1` |
| **Database** | PostgreSQL via Prisma 7.8 |
| **Auth** | Clerk with JWT + RBAC |
| **UI** | React 19 + CSS variables (dark mode native) |
| **Validation** | Zod schemas at every pipeline stage |
| **Export** | JSON, YAML, ZIP (via JSZip) |

---

## Database Schema

```prisma
model User {
  id            String   @id @default(cuid())
  clerkId       String   @unique
  email         String   @unique
  displayName   String?
  plan          String   @default("free")
  generations   Generation[]
}

model Generation {
  id              String   @id @default(cuid())
  userId          String
  prompt          String
  mode            String   @default("balanced")
  status          String   @default("pending")
  config          Json?
  metadata        Json?
  totalLatencyMs  Int?
  pipelineStages  PipelineStage[]
  appConfig       AppConfig?
}

model AppConfig {
  id              String   @id @default(cuid())
  generationId    String   @unique
  config          Json     @default("{}")
  artifacts       Json?
  validationPassed Boolean
}
```

---

## Development

```bash
npm install              # Install dependencies
npm run dev              # Start dev server
npx tsc --noEmit         # TypeScript checks
npm run lint             # Linter
npm run build            # Production build
npm run eval:deterministic  # Run evaluation suite
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Set environment variables (see above)
4. Deploy

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with care by the AppForge team**

*Turn product ideas into production-ready blueprints.*

</div>
