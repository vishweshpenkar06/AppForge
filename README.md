---
Title: AppForge
Emoji: ⚡
ColorFrom: indigo
ColorTo: cyan
License: mit
Short_description: Natural Language to Application Compiler — Convert product ideas into validated blueprints
---

# AppForge

## Natural Language to Application Compiler

> **Convert plain English product descriptions into complete, validated, executable application configurations — schemas, APIs, UI pages, and production-ready documentation.**

AppForge is a **6-stage AI compiler** that transforms natural language product descriptions into structured application blueprints. Unlike simple code generators, AppForge runs a multi-stage pipeline with Zod validation, cross-layer consistency checks, intelligent auto-repair, and plan-based quality tiers — producing output that is immediately usable for production development.

---

## Problem

Modern app development has a gap between **idea** and **implementation**:

- Product specs live in docs nobody reads
- Database schemas are hand-drawn and inconsistent
- API contracts are undocumented
- Auth and role logic is bolted on last
- Scaffolding tools produce empty shells

AppForge bridges this gap. You describe what you want in plain English, and AppForge compiles it into a validated, cross-referenced, export-ready application blueprint.

---

## Architecture

```text
User Prompt (Natural Language)
      ↓
┌─────────────────────────────────────────────────┐
│  Stage 1: Intent Extraction                      │
│  Parse natural language → structured intent      │
├─────────────────────────────────────────────────┤
│  Stage 2: System Design                          │
│  Architecture → pages, endpoints, entities       │
├─────────────────────────────────────────────────┤
│  Stage 3: Schema Generation                      │
│  DB tables + API endpoints + UI pages            │
├─────────────────────────────────────────────────┤
│  Stage 4: Refinement                             │
│  Merge schemas, resolve inconsistencies          │
├─────────────────────────────────────────────────┤
│  Stage 5: Validation & Repair                    │
│  7 invariants + auto-fix + LLM repair            │
├─────────────────────────────────────────────────┤
│  Stage 6: Export                                  │
│  Prisma + Express + React + 6 docs + ZIP bundle  │
└─────────────────────────────────────────────────┘
      ↓
Validated Application Blueprint
```

Each stage is a separate module with its own input/output contract. No single-prompt generation.

---

## Multi-Agent Pipeline

| Stage | Agent | Purpose |
| :--- | :--- | :--- |
| 1 | Intent Extraction | Parse NL into structured intent (app type, features, roles, entities) |
| 2 | System Design | Architecture blueprint (pages, endpoints, access control) |
| 3 | Schema Generator | DB tables (5+ cols each) + API endpoints + UI pages |
| 4 | Cross-Layer Refinement | Merge schemas, resolve DB/API/UI inconsistencies |
| 5 | Validation & Auto-Repair | 7 invariants + rule-based fix + LLM-assisted repair |
| 6 | Export & Runtime | Prisma schema + Express server + React components + ZIP bundle |

---

## Core Intelligence Modules

### 🧠 1. Intent Extraction Engine
Parses natural language into structured intent — app type, features, roles, data models, payment gates, and user flows. Handles vague, conflicting, and underspecified prompts with confidence scoring and clarification questions.

### 🏗️ 2. System Design Architect
Converts intent into a full architecture blueprint — page structure, API endpoints, data entities, access control model, and role-permission mappings. Automatically detects app complexity and selects the right architecture pattern.

### 🗄️ 3. Schema Generator
Produces concrete database tables (5+ domain-specific columns each), API endpoints with request/response schemas, and UI pages with data source bindings. The output depth scales by plan tier — minimal for Free, exhaustive for Pro.

### 🔍 4. Cross-Layer Refinement
Merges all schemas and resolves inconsistencies across DB, API, and UI layers. Ensures every API field exists in the database, every UI component maps to a valid endpoint, and every role reference is defined in auth.

### 🛠️ 5. Validation & Auto-Repair Engine
Enforces 7 cross-layer invariants on every compile. Automatically fixes missing `id` columns, broken FK references, orphaned endpoints, and missing role definitions. When rules can't fix it, LLM-assisted repair fires surgically.

### 📦 6. Export & Runtime Generator
Produces Prisma schemas, Express servers with JWT auth, React component trees, portable SQL, 6 planning documents (PRD, TRD, App Flow, UI/UX Brief, Backend Schema, Implementation Plan), and ZIP bundles with organized folders.

---

## Example Decisions

| Input Prompt | Output |
| :--- | :--- |
| "Build a CRM with login, contacts, dashboard, role-based access, and analytics" | ✅ 5 DB tables, 12 API endpoints, 8 UI pages, 3 roles, validated config |
| "Create an LMS with courses, quizzes, and student progress" | ✅ 4 tables, 8 endpoints, 5 pages, instructor/student roles |
| "Build an app" | ⚠️ Needs clarification — confidence 0.35, returns clarification questions |
| "Build a simple app with advanced AI and blockchain" | ⚠️ Conflicting requirements detected, flagged in assumptions |

---

## Features

✅ 6-Stage AI Pipeline with Zod Validation

✅ Cross-Layer Consistency Enforcement (7 invariants)

✅ Intelligent Auto-Repair (rule-based + LLM-assisted)

✅ Prompt Analysis & Clarification Gate

✅ Output Quality Tiers (Minimal / Standard / Maximum)

✅ 3-Tier Pricing System (Free / Pro / Team)

✅ Team Code Sharing with Seat Limits

✅ ZIP Bundle Export with Organized Folders

✅ 20-Case Evaluation Framework

✅ Deterministic Offline Mode

✅ Multi-Provider LLM Support (Groq, NVIDIA NIM, Featherless)

✅ Premium Dark-Mode UI with CSS Variables

---

## Technical Ecosystem

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) + TypeScript 5.7 |
| **AI Pipeline** | Groq (primary) / NVIDIA NIM (fallback) — OpenAI-compatible |
| **Default Model** | `llama-3.3-70b-versatile` (Groq) |
| **Database** | PostgreSQL via Prisma 7.8 |
| **Authentication** | Clerk with JWT + Role-Based Access Control |
| **UI** | React 19 + CSS Variables (dark mode native) |
| **Validation** | Zod schemas at every pipeline stage |
| **Export** | JSON, YAML, ZIP (via JSZip) |
| **Pricing** | 3-tier system (Free / Pro / Team) with plan gating |

---

## LLM Provider Comparison

| Provider | Model | Rate Limit | Latency | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Groq** (default) | `llama-3.3-70b-versatile` | ~30 req/min | ~7s/compile | Low latency |
| **NVIDIA NIM** | `nvidia/llama-3.3-nemotron-super-49b-v1` | ~40 req/min | ~165s/compile | Structured JSON |
| **Featherless** | `meta-llama/Meta-Llama-3.3-70B-Instruct` | Varies | ~2-5s | Model variety |

See [docs/tradeoffs.md](docs/tradeoffs.md) for detailed comparison.

---

## Plan Tiers & Output Quality

| Feature | Free | Pro ($19/mo) | Team ($49/mo) |
| :--- | :--- | :--- | :--- |
| **Compiles/month** | 10 | 100 | Unlimited |
| **Modes** | Fast only | Fast + Balanced | All modes |
| **Output Detail** | Minimal (3-5 cols/table) | Maximum (12-20+ cols) | Standard (8-12 cols) |
| **Export: JSON + YAML** | ✅ | ✅ | ✅ |
| **Export: SQL/Express/React** | ❌ | ✅ | ✅ |
| **Export: ZIP bundle** | ❌ | ✅ | ✅ |
| **History** | 7 days | 90 days | Unlimited |
| **Seats** | 1 | 1 | 5 |

AppForge enforces the same premium-gating pattern on itself that it generates for every app it compiles.

---

## Evaluation Framework

20-case test suite covering:

- **10 Real Products:** CRM, Marketplace, Blog, Project Tracker, Social Feed, E-Commerce, Analytics Dashboard, SaaS App, Health Tracker, Booking System
- **10 Edge Cases:** Vague prompts, conflicting requirements, underspecified inputs, overly complex specs, ambiguous roles, technical constraints, circular dependencies, missing auth, payment without model, realtime + scalability conflicts

```bash
# Deterministic mode (no API key needed)
npm run eval:deterministic

# Via API
curl http://localhost:3000/api/evaluate
```

---

## API Endpoints

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| POST | `/api/compile` | Main compile endpoint (synchronous) |
| POST | `/api/generate` | Async generation (returns jobId) |
| GET | `/api/evaluate` | Run 20-case evaluation suite |
| GET | `/api/health` | System health check |
| GET | `/api/metrics` | Dashboard metrics data |
| POST | `/api/plan/upgrade` | Instant plan upgrade |
| POST | `/api/plan/join-team` | Join team via code |
| GET | `/api/generations/[id]/export` | Export as JSON/YAML/ZIP |

---

## Getting Started

### Prerequisites
- Node.js 18+ (recommended: 20+)
- PostgreSQL database (Supabase free tier works)
- At least one LLM API key (Groq or NVIDIA NIM)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/AppForge.git
   cd AppForge
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (see Environment Variables below)
   ```

4. **Push Database Schema**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
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

```text
AppForge/
├── proxy.ts                        # Clerk auth (Next.js 16)
├── app/
│   ├── api/
│   │   ├── compile/route.ts        # Main compile endpoint
│   │   ├── generate/route.ts       # Async generation
│   │   ├── evaluate/route.ts       # 20-case evaluation suite
│   │   ├── health/route.ts         # System health check
│   │   ├── metrics/route.ts        # Dashboard metrics
│   │   ├── plan/upgrade/route.ts   # Plan upgrade API
│   │   ├── plan/join-team/route.ts # Team join API
│   │   └── generations/            # CRUD + ZIP/JSON/YAML export
│   ├── compiler/page.tsx           # Two-panel compiler UI
│   ├── dashboard/page.tsx          # Stats, form, history
│   ├── demo/page.tsx               # Pre-compiled examples
│   ├── pricing/page.tsx            # 3-tier pricing cards
│   └── page.tsx                    # Landing with pipeline strip
├── lib/
│   ├── compiler/
│   │   ├── core.ts                 # 5-stage pipeline + validation
│   │   ├── export.ts               # Prisma/API/UI generation + docs
│   │   └── evaluation.ts           # 20-case test suite
│   ├── runtime/generators.ts       # SQL, Express, React generation
│   ├── ai.ts                       # LLM provider registry + fallback
│   ├── plan-limits.ts              # Plan gating + detail levels
│   ├── schemas.ts                  # Zod schemas
│   ├── validation.ts               # Prompt analysis + consistency
│   ├── pipeline.ts                 # Orchestrator + DB persistence
│   └── db.ts                       # Prisma client
├── prisma/schema.prisma            # Database models
├── components/                     # UI components
├── docs/tradeoffs.md               # LLM provider comparison
└── Changes IN this Project/        # Change log
```

---

## Design Aesthetics

Built with a **premium dark-mode design system** using CSS variables:

- **Frosted Glass Nav** — Fixed 48px nav with backdrop blur
- **Pipeline Strip** — Animated beam connecting 6 compiler stages
- **Two-Panel Compiler** — Sidebar + tabbed results (7 views)
- **Plan Gating** — Real-time limits with upgrade prompts
- **Zero Hardcoded Colors** — All via CSS variable system

---

## Pages

| Page | Description |
| :--- | :--- |
| **Landing** (`/`) | Hero with pipeline strip, metrics, feature cards |
| **Compiler** (`/compiler`) | Two-panel: prompt input + 7-tab results with export |
| **Dashboard** (`/dashboard`) | Stats cards, compilation form, history sidebar |
| **Demo** (`/demo`) | Pre-compiled outputs with split view |
| **Pricing** (`/pricing`) | 3 cards, billing toggle, comparison table, team codes |

---

## Project Status

- ✅ 6-Stage AI Pipeline
- ✅ Cross-Layer Validation (7 invariants)
- ✅ Auto-Repair Engine (rule-based + LLM)
- ✅ Prompt Analysis & Clarification
- ✅ Output Quality Tiers
- ✅ 3-Tier Pricing with Plan Gating
- ✅ Team Code System with Seat Limits
- ✅ ZIP Bundle Export
- ✅ 20-Case Evaluation Framework
- ✅ Multi-Provider LLM Support
- ✅ Premium Dark-Mode UI
- ✅ Deterministic Offline Mode

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
