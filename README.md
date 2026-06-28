# AppForge — Natural Language → Application Compiler

> Convert plain English product descriptions into complete, validated, executable application configurations.

## Links

- **Live Demo:** [your-url.vercel.app](https://your-url.vercel.app)
- **Demo Examples:** [your-url.vercel.app/demo](https://your-url.vercel.app/demo)
- **Health Check:** [your-url.vercel.app/api/health](https://your-url.vercel.app/api/health)

## System Architecture

```
User Prompt → [Stage 1: Intent] → [Stage 2: Design] → [Stage 3: Schemas×4]
           → [Stage 4: Refinement] → [Stage 5: Validation+Repair] → [Stage 6: Export]
           → Final Config + SQL + Express + React stubs
```

Each stage is a separate module with its own input/output contract. No single-prompt generation.

## Quick Start

```bash
git clone <repo>
cd appforge
npm install
cp .env.example .env   # Add your Groq API key
npx prisma db push
npm run dev
# Open http://localhost:3000
```

## Environment Variables

```env
GROQ_API_KEY=                          # Free at console.groq.com
DATABASE_URL=                           # SQLite: file:./dev.db
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=     # Optional: Clerk auth
CLERK_SECRET_KEY=                      # Optional: Clerk auth
DETERMINISTIC_LLM=0                    # Set to 1 for offline testing
```

## Pipeline Structure

| File | Stage | Purpose |
|------|-------|---------|
| `lib/compiler/core.ts` | 1–5 | Intent → Design → Schemas → Refinement → Validation |
| `lib/compiler/export.ts` | 6 | Config export + 6 markdown docs + Prisma/API/UI stubs |
| `lib/runtime/generators.ts` | 6b | SQL + Express + React portable stub generation |
| `lib/schemas.ts` | — | Zod schemas for all pipeline outputs |
| `lib/validation.ts` | — | Cross-layer invariant checker |
| `lib/ai.ts` | — | LLM abstraction (Groq/Featherless) with deterministic stub |
| `eval/run_evals.ts` | — | 20-case evaluation suite |
| `app/api/compile/route.ts` | — | Main compile endpoint orchestrating all 6 stages |

## Run Evaluations

```bash
# Start server first, then:
npx ts-node eval/run_evals.ts
# Results written to eval/evaluation.json
```

## Validation + Repair

The system automatically detects and repairs:

- Missing required DB columns (`id`, `created_at`, `updated_at`)
- API fields not present in DB schema → removed with warning
- UI fields pointing to non-existent API endpoints → remapped
- Role references not in auth schema → injected with defaults
- Premium features with no Subscription table → table injected

## Cross-Layer Invariants (Always Enforced)

1. Every API request field exists in its DB table
2. Every UI form field maps to a valid API field
3. Every page access role exists in auth schema
4. Every endpoint role exists in auth schema
5. Premium features require Subscription table in DB
6. Every entity has at least one API endpoint
7. Auth-required endpoints have JWT middleware in generated code

## Runtime Output

Each compilation produces:

- **SQL** — CREATE TABLE statements (SQLite + PostgreSQL compatible)
- **Express** — Server with JWT auth middleware + all endpoints stubbed
- **React** — Component tree with routing + per-page stubs
- **Config** — Complete validated JSON with DB, API, UI, Auth, and business logic

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 + TypeScript |
| AI Pipeline | Groq (llama-3.3-70b-versatile) or Featherless |
| Database | PostgreSQL via Prisma (Supabase free tier) |
| Auth | Clerk with JWT |
| UI | React 19 + Tailwind CSS + Radix UI |
| Validation | Zod |
| Evaluation | Custom 20-case test suite |

## Cost

Typical compile: ~6 LLM calls × ~800 tokens = ~$0.003 on Groq free tier.
