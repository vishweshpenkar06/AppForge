<div align="center">

# AppForge

### Natural Language to Application Compiler

Convert plain English product descriptions into complete, validated, executable application configurations — schemas, APIs, UI pages, and production-ready documentation.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)

[Live Demo](https://your-url.vercel.app) · [API Health](https://your-url.vercel.app/api/health) · [Compiler](https://your-url.vercel.app/compiler)

</div>

---

## What is AppForge?

AppForge is a **multi-stage AI compiler** that transforms natural language product descriptions into structured application blueprints. Unlike simple code generators, AppForge runs a 5-stage pipeline with validation, cross-layer consistency checks, and intelligent auto-repair — producing output that is immediately usable for production development.

**Input:**
> "Build a CRM with login, contacts, dashboard, role-based access, and premium analytics."

**Output:**
- Validated JSON application config (DB + API + UI + Auth)
- Prisma schema with proper relations and types
- Express server with JWT auth middleware
- React component tree with routing
- 6 planning documents (PRD, TRD, App Flow, UI/UX Brief, Backend Schema, Implementation Plan)
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
│  DB tables + API endpoints + UI pages            │
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
│  6 planning documents + runtime stubs            │
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
| `NVIDIA_API_KEY` | Yes* | NVIDIA build.nvidia.com API key |
| `GROQ_API_KEY` | Yes* | Groq API key (free at [console.groq.com](https://console.groq.com)) |
| `FEATHERLESS_API_KEY` | Yes* | Featherless API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g., Supabase) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | Clerk auth publishable key |
| `CLERK_SECRET_KEY` | No | Clerk auth secret key |
| `DETERMINISTIC_LLM` | No | Set to `1` for offline testing without API keys |
| `LLM_BASE_URL` | No | Override LLM API base URL |
| `LLM_MODEL` | No | Override LLM model (default: `meta/llama-3.3-70b-instruct`) |

*\*At least one LLM API key is required, or set `DETERMINISTIC_LLM=1` for offline mode.*

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
│   │   └── generations/              # Generation CRUD + export
│   ├── compiler/page.tsx             # Compiler UI (tabs: Config, SQL, Express, React, Validation, Docs, Metrics)
│   ├── dashboard/page.tsx            # Dashboard with form, history, metrics
│   └── page.tsx                      # Landing page
├── lib/
│   ├── compiler/
│   │   ├── core.ts                   # Pipeline stages 1–5 + validation
│   │   ├── export.ts                 # Stage 6: Prisma/API/UI generation + 6 docs
│   │   └── evaluation.ts             # 20-case test suite
│   ├── runtime/
│   │   └── generators.ts             # Portable SQL, Express, React generation
│   ├── ai.ts                         # LLM abstraction (Groq/Nvidia/Featherless) + deterministic stub
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
├── scripts/                          # Build/test scripts
└── eval/                             # Evaluation data
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
  "docs": {
    "prd": "# Product Requirements Document\n...",
    "trd": "# Technical Requirements Document\n...",
    "appFlow": "# Application Flow\n...",
    "uiUxBrief": "# UI/UX Brief\n...",
    "backendSchema": "# Backend Schema\n...",
    "implementationPlan": "# Implementation Plan\n..."
  },
  "implementationPlan": {
    "prismaSchema": "...",
    "apiHandlers": [...],
    "uiPages": [...],
    "checklist": [...]
  },
  "runtime": {
    "sql": "CREATE TABLE ...",
    "express": "const express = require('express'); ...",
    "react": { "App.jsx": "...", "pages/Dashboard.jsx": "..." }
  },
  "validation": {
    "valid": true,
    "score": 88,
    "errors": [],
    "warnings": [],
    "repairs": ["Added 'id' column to table 'contacts'"]
  },
  "execution": {
    "executable": true,
    "readyForDeployment": true
  },
  "metrics": {
    "latency": 2450,
    "stageTimes": {
      "intent-extraction": 420,
      "system-design": 510,
      "schema-generation": 630,
      "refinement": 440,
      "validation-repair": 380,
      "export": 70
    }
  }
}
```

### `GET /api/health`

Returns system health status including database connectivity and LLM provider detection.

### `GET /api/evaluate`

Runs the 20-case evaluation suite and returns aggregated metrics.

---

## Validation & Repair

AppForge enforces cross-layer consistency automatically:

### Rule-Based Checks (Stage 5)

- **DB Layer:** Every table has `id` (uuid), `createdAt` timestamp; valid column types; no duplicate table names; FK references point to existing tables
- **API Layer:** Endpoints start with `/api/`; valid HTTP methods; each endpoint references at least one DB table
- **UI Layer:** Page routes start with `/`; `dataSource` references real API endpoints; component names are non-empty
- **Cross-Layer:** API request fields exist in DB tables; page access roles exist in auth schema; endpoint roles exist in auth schema

### Auto-Repair

When issues are detected, the system automatically:

1. Adds missing `id` columns (uuid type)
2. Adds missing `createdAt` timestamps
3. Removes API fields not present in DB schema (with warning)
4. Remaps UI fields pointing to non-existent endpoints
5. Injects missing role definitions with defaults
6. Adds `Subscription` table when premium features require it

### LLM-Assisted Repair

For issues beyond rule-based repair, the system sends broken sections to the LLM with specific error descriptions and receives surgically repaired output. Max 2 repair cycles.

### Prompt Analysis

Before compilation begins, the system analyzes prompt clarity:

- Detects vague language and short prompts
- Identifies conflicting requirements ("simple" + "advanced AI")
- Flags scalability contradictions
- Returns clarification questions when confidence < 0.6

---

## Cross-Layer Invariants

These rules are always enforced:

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

## Runtime Output

Each compilation produces three portable runtime stubs:

### SQL Schema
```sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Express Server
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

// JWT Auth Middleware
function requireAuth(req, res, next) { ... }

// Generated Routes
app.get('/api/v1/users', requireAuth, async (req, res) => { ... });
app.post('/api/v1/users', requireAuth, async (req, res) => { ... });
```

### React App
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Evaluation Framework

AppForge includes a 20-case evaluation suite covering:

- **10 Real Products:** CRM, Marketplace, Blog, Project Tracker, Social Feed, E-Commerce, Analytics Dashboard, SaaS App, Health Tracker, Booking System
- **10 Edge Cases:** Vague prompts, conflicting requirements, underspecified inputs, overly complex specs, ambiguous roles, technical constraints, circular dependencies, missing auth, payment without model, realtime + scalability conflicts

### Run Evaluations

```bash
# Deterministic mode (no API key needed)
npm run eval:deterministic

# Or via API endpoint
curl http://localhost:3000/api/evaluate
```

**Metrics Tracked:**
- Success rate (%)
- Average latency (ms)
- Average validation score (0–100)
- Execution readiness (%)
- Retry count
- Cost estimation ($)
- Average DB tables, API endpoints, UI pages per generation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) + TypeScript 5.7 |
| **AI Pipeline** | Groq / Nvidia / Featherless (OpenAI-compatible API) |
| **Default Model** | `meta/llama-3.3-70b-instruct` |
| **Database** | PostgreSQL via Prisma 7.8 (Supabase free tier compatible) |
| **Auth** | Clerk with JWT + role-based access control |
| **UI** | React 19 + Tailwind CSS 4.2 + Radix UI |
| **Validation** | Zod schemas (type-safe at every pipeline stage) |
| **Components** | shadcn/ui pattern with Radix primitives |
| **Charts** | Recharts |
| **State** | React hooks + server actions |

---

## Cost Analysis

| Mode | Avg Tokens | Latency | Est. Cost | Quality |
|------|-----------|---------|-----------|---------|
| Fast | ~4,000 | ~1.5s | $0.002 | 70/100 |
| Balanced | ~8,000 | ~3s | $0.006 | 85/100 |
| Precise | ~12,000 | ~8s | $0.018 | 95/100 |

*Based on Groq free tier pricing. Costs scale with model provider.*

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
# Install dependencies
npm install

# Start dev server
npm run dev

# Run TypeScript checks
npx tsc --noEmit

# Run linter
npm run lint

# Build for production
npm run build

# Run evaluation suite
npm run eval:deterministic
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Set environment variables
4. Deploy

### Environment Setup

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# LLM Provider (at least one)
NVIDIA_API_KEY=nvapi-...
# or
GROQ_API_KEY=gsk_...

# Auth (optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with care by the AppForge team**

*Turn product ideas into production-ready blueprints.*

</div>
