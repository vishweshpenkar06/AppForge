---
title: AppForge
emoji: ⚡
colorFrom: indigo
colorTo: cyan
license: mit
short_description: Natural Language to Application Compiler — convert product ideas into validated blueprints
---

# AppForge

## Natural Language → Application Compiler

> **Describe what you want to build. AppForge compiles it into a validated database schema, API layer, component tree, and auth config — ready to ship.**

AppForge is a **6-stage AI compiler** that transforms natural language product descriptions into structured, cross-validated application blueprints. Unlike simple code generators, AppForge runs a multi-stage pipeline with Zod validation at every step, cross-layer consistency checks, intelligent auto-repair, and plan-based quality tiers — producing output that is immediately usable for production development.

---

## Why AppForge

Modern app development has a gap between **idea** and **implementation**:

| Problem | AppForge Solution |
|:--------|:------------------|
| Product specs live in docs nobody reads | Structured JSON config, machine-readable |
| Database schemas are hand-drawn | Auto-generated Prisma with relations |
| API contracts are undocumented | Typed endpoints with request/response schemas |
| Auth and role logic is bolted on last | RBAC baked into every layer |
| Scaffolding tools produce empty shells | Execution-ready output with SQL, Express, React |

---

## How It Works

```
"Build a CRM with login, contacts, dashboard, and analytics"
                    ↓
┌───────────────────────────────────────────────────────┐
│  01  Intent      Parse the goal                       │
│  02  Design      Define entities                      │
│  03  Schemas     DB + API + UI                        │
│  04  Refine      Cross-validate                       │
│  05  Repair      Auto-fix errors                      │
│  06  Export      Ready to ship                        │
└───────────────────────────────────────────────────────┘
                    ↓
  Prisma schema · Express server · React components
  6 planning docs · ZIP bundle
```

Each stage is a separate module with its own Zod-validated input/output contract. No single-prompt generation.

---

## Core Capabilities

| Capability | What It Does |
|:-----------|:-------------|
| **6-Stage Pipeline** | Structured compilation with typed contracts between stages |
| **7 Cross-Layer Invariants** | DB fields exist in API, API routes map to UI, auth roles are defined |
| **Auto-Repair Engine** | Rule-based fix for missing FKs, broken types, orphaned references |
| **LLM-Assisted Repair** | When rules can't fix it, surgical LLM intervention fires |
| **Prompt Analysis Gate** | Detects vague/conflicting prompts before compilation, asks for clarification |
| **Output Quality Tiers** | Minimal (Free), Standard (Team), Maximum (Pro) |
| **Multi-Provider LLM** | Groq (fast) → NVIDIA NIM (fallback) → Featherless |
| **20-Case Eval Suite** | 10 real products + 10 edge cases for quality benchmarking |
| **Deterministic Offline Mode** | No API key needed — heuristic-based testing |

---

## Pipeline Stages

| Stage | Name | Input | Output | LLM Call |
|:------|:-----|:------|:-------|:---------|
| 01 | **Intent Extraction** | Natural language prompt | `Intent` — app type, features, roles, entities | Yes (temp 0.2) |
| 02 | **System Design** | `Intent` | `SystemDesign` — pages, endpoints, access control | Yes (temp 0.1) |
| 03 | **Schema Generation** | `SystemDesign` + `Intent` | `SchemaOutput` — DB tables, API endpoints, UI pages | Yes (temp 0) |
| 04 | **Cross-Layer Refinement** | `SchemaOutput` | Refined `SchemaOutput` with consistency fixes | Yes (temp 0) |
| 05 | **Validation & Repair** | `SchemaOutput` | `ValidationResult` — valid, errors, repairs, score | Only if needed |
| 06 | **Export** | `SchemaOutput` | Prisma + Express + React + SQL + 6 docs | No (code gen) |

---

## Example Compilations

| Prompt | Output |
|:-------|:-------|
| "Build a CRM with login, contacts, dashboard, role-based access, and analytics" | 5 DB tables, 12 API endpoints, 8 UI pages, 3 roles, validated config |
| "Create an LMS with courses, quizzes, and student progress" | 4 tables, 8 endpoints, 5 pages, instructor/student roles |
| "Build an app" | Needs clarification — confidence 0.35, returns clarification questions |
| "Build a simple app with advanced AI and blockchain" | Conflicting requirements detected, flagged in assumptions |

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Framework** | Next.js 16 (App Router) + TypeScript 5.7 |
| **AI Pipeline** | Groq (primary) / NVIDIA NIM (fallback) — OpenAI-compatible |
| **Default Model** | `llama-3.3-70b-versatile` (Groq) |
| **Database** | PostgreSQL via Prisma 7.8 |
| **Authentication** | Clerk with JWT + Role-Based Access Control |
| **UI** | React 19 + Tailwind CSS v4 + shadcn/ui |
| **Validation** | Zod schemas at every pipeline stage |
| **Export** | JSON, YAML, ZIP (via JSZip) |
| **Fonts** | Geist (sans) + Geist Mono (code/technical) |
| **Pricing** | 3-tier system (Free / Pro / Team) with plan gating |

---

## Design System

AppForge uses a custom dark-mode design system built on CSS variables and Tailwind CSS v4.

### Color Palette

| Token | Hex | Usage |
|:------|:----|:------|
| `forge-950` | `#08080c` | Page background |
| `forge-900` | `#0e0e14` | Primary surface |
| `forge-800` | `#16161e` | Elevated surface, cards |
| `forge-700` | `#1e1e28` | Inputs, panels |
| `accent` | `#6366f1` | Primary CTA, active states |
| `accent-hover` | `#818cf8` | Links, code, hover states |
| `secondary` | `#14b8a6` | Pipeline stages, secondary accent |
| `success` | `#10b981` | Valid states, completions |
| `danger` | `#f43f5e` | Errors, destructive actions |
| `warning` | `#f59e0b` | Assumptions, rate limits |

### Signature Element: Pipeline Visualization

The 6-stage pipeline is the visual centerpiece:

- **Desktop**: Horizontal strip with 56px numbered circles (teal accent), connecting line, animated beam
- **Mobile**: Vertical layout with left-aligned connecting line
- **Compiler**: Live stage indicators with pulse animation during compilation

### Typography

- **Geist Sans** — All UI text (12/14/16/18/20/24/30/36px scale)
- **Geist Mono** — Code blocks, pipeline numbers, status badges, technical labels

### Accessibility

- All interactive elements have visible keyboard focus states (`ring-2 ring-accent/40`)
- Skip-to-content link on every page
- WCAG AA contrast ratios on all text/background pairs
- Semantic HTML with proper heading hierarchy

---

## Pages

| Page | Route | Description |
|:-----|:------|:------------|
| **Landing** | `/` | Hero with pipeline strip, metrics, feature cards |
| **Compiler** | `/compiler` | Two-panel: prompt input + 7-tab results with export |
| **Dashboard** | `/dashboard` | Stats cards, compilation form, history sidebar |
| **Demo** | `/demo` | Pre-compiled outputs with split view |
| **Pricing** | `/pricing` | 3 cards, billing toggle, comparison table, team codes |
| **Generated** | `/generated/[gid]` | Artifact viewer with markdown preview |
| **Builder** | `/builder` | Prompt editor with autosave and history |
| **Sign In** | `/sign-in` | Clerk authentication |
| **Sign Up** | `/sign-up` | Clerk registration |

---

## API Endpoints

| Method | Endpoint | Purpose |
|:-------|:---------|:--------|
| `POST` | `/api/compile` | Main compile endpoint (synchronous) |
| `POST` | `/api/generate` | Async generation (returns jobId) |
| `GET` | `/api/evaluate` | Run 20-case evaluation suite |
| `GET` | `/api/health` | System health check |
| `GET` | `/api/metrics` | Dashboard metrics data |
| `POST` | `/api/plan/upgrade` | Instant plan upgrade |
| `POST` | `/api/plan/join-team` | Join team via code |
| `GET/POST` | `/api/generations` | CRUD for generation records |
| `GET` | `/api/generations/[id]` | Single generation detail |
| `GET` | `/api/generations/[id]/export` | Export as JSON/YAML/ZIP |
| `GET` | `/api/generated/[gid]/download` | Download artifact ZIP |

---

## Plan Tiers

| Feature | Free | Pro ($19/mo) | Team ($49/mo) |
|:--------|:-----|:-------------|:--------------|
| Compiles/month | 10 | 100 | Unlimited |
| Modes | Fast only | Fast + Balanced | All modes |
| Output detail | Minimal (3-5 cols) | Maximum (12-20+ cols) | Standard (8-12 cols) |
| JSON + YAML export | ✅ | ✅ | ✅ |
| SQL / Express / React | ❌ | ✅ | ✅ |
| ZIP bundle | ❌ | ✅ | ✅ |
| History | 7 days | 90 days | Unlimited |
| Seats | 1 | 1 | 5 |

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- PostgreSQL database (Supabase free tier works)
- At least one LLM API key (Groq or NVIDIA NIM)

### Installation

```bash
# 1. Clone
git clone https://github.com/yourusername/AppForge.git
cd AppForge

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Edit .env with your API keys (see Environment Variables below)

# 4. Database
npx prisma db push
npx prisma generate

# 5. Start
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

### Environment Variables

| Variable | Required | Description |
|:---------|:---------|:------------|
| `LLM_PROVIDER` | No | `groq` (default) / `nvidia` / `featherless` |
| `GROQ_API_KEY` | Yes* | Groq API key (`gsk_...`) |
| `NVIDIA_API_KEY` | Yes* | NVIDIA NIM API key (`nvapi-...`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | Clerk auth publishable key |
| `CLERK_SECRET_KEY` | No | Clerk auth secret key |
| `DETERMINISTIC_LLM` | No | Set to `1` for offline testing |

*\*At least one LLM API key is required, or set `DETERMINISTIC_LLM=1` for offline mode.*

**Dev mode:** All `/api/*` routes bypass Clerk auth automatically. No browser sign-in needed for local development.

---

## Project Architecture

```
AppForge/
├── proxy.ts                        # Clerk auth (Next.js 16)
├── app/
│   ├── globals.css                 # Design system variables + Tailwind
│   ├── layout.tsx                  # Root layout (ClerkProvider + nav)
│   ├── page.tsx                    # Landing page
│   ├── api/
│   │   ├── compile/route.ts        # Main compile endpoint (624 lines)
│   │   ├── generate/route.ts       # Async generation
│   │   ├── evaluate/route.ts       # 20-case evaluation suite
│   │   ├── health/route.ts         # System health check
│   │   ├── metrics/route.ts        # Dashboard metrics
│   │   ├── plan/upgrade/route.ts   # Plan upgrade API
│   │   ├── plan/join-team/route.ts # Team join API
│   │   ├── generations/            # CRUD + export
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
├── components/
│   ├── Hero.tsx                    # Landing hero section
│   ├── ExamplePrompts.tsx          # Quick-start prompt chips
│   ├── GenerationStatus.tsx        # Error classification UI
│   ├── generation-form.tsx         # Generation input form
│   ├── generation-detail.tsx       # Tabbed result viewer
│   ├── generation-history.tsx      # Sidebar history list
│   ├── loading-spinner.tsx         # Loading indicator
│   ├── metrics-dashboard.tsx       # Metrics display
│   ├── upgrade-banner.tsx          # Upgrade CTA
│   ├── theme-provider.tsx          # next-themes wrapper
│   ├── builder/
│   │   └── editor.tsx              # Prompt editor with autosave
│   └── ui/                         # 57 shadcn/ui components
├── lib/
│   ├── compiler/
│   │   ├── core.ts                 # 5-stage pipeline + validation
│   │   ├── export.ts               # Stage 6 + planning docs
│   │   └── evaluation.ts           # 20-case test suite
│   ├── runtime/
│   │   └── generators.ts           # SQL, Express, React generation
│   ├── ai.ts                       # LLM provider registry + fallback
│   ├── plan-limits.ts              # Plan gating + detail levels
│   ├── schemas.ts                  # Zod schemas
│   ├── validation.ts               # Prompt analysis + consistency
│   ├── pipeline.ts                 # Orchestrator + DB persistence
│   ├── metrics.ts                  # Quality scoring + metrics
│   ├── db.ts                       # Prisma client singleton
│   └── clerk-user.ts               # Clerk auth helper
├── prisma/schema.prisma            # 6 models
├── styles/globals.css              # shadcn/ui oklch theme
├── hooks/                          # Custom React hooks
├── docs/                           # Documentation
├── eval/                           # Evaluation data
└── UI_AUDIT.md                     # Design system documentation
```

---

## Evaluation

```bash
# Deterministic mode (no API key needed)
npm run eval:deterministic

# Via API
curl http://localhost:3000/api/evaluate
```

20-case test suite: 10 real products (CRM, Marketplace, Blog, etc.) + 10 edge cases (vague prompts, conflicting requirements, circular dependencies).

---

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Author

**Vishwesh Penkar**

B.Tech Artificial Intelligence & Machine Learning

Mumbai University, India
