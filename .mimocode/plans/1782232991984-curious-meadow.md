# AppForge: Complete Implementation Plan

## Requirements Gap Analysis

| # | Requirement | Current State | What's Missing | Priority |
|---|---|---|---|---|
| 1 | Multi-Stage Pipeline | 5 stages exist in `compiler/core.ts` | Pipeline is functional | ✅ Done |
| 2 | Schema Enforcement | Zod schemas exist | Cross-layer validation in `core.ts` is minimal | ⚠️ Medium |
| 3 | Validation + Repair | Only adds 'id' columns | **No LLM repair, no hallucination detection, no logical consistency** | 🔴 CRITICAL |
| 4 | Deterministic Behavior | Deterministic stub exists | Temperature already 0 for most stages | ✅ Mostly Done |
| 5 | Execution Awareness | API handlers return `{ok:true}`, UI is one-liner | **Output is NOT directly usable to generate a working app** | 🔴 CRITICAL |
| 6 | Failure Handling | `analyzePromptClarity()` exists but NEVER called | **No clarification flow, assumptions not surfaced** | 🔴 CRITICAL |
| 7 | Evaluation Framework | 20 test cases exist | Missing token/cost tracking per test | ⚠️ Medium |
| 8 | Cost vs Quality | No cost tracking | **No token counting, no cost breakdown, no quality scoring** | 🔴 CRITICAL |

---

## Implementation Plan

### Phase 1: Intelligent Validation + Repair Engine
**Files:** `lib/compiler/core.ts`, `lib/validation.ts`

The task says: *"This is the most important part of the task"*

**Current `validateAndRepair()` (lines 472-529 of core.ts):**
- Only checks if arrays are empty
- Only repair: adds 'id' columns to tables
- No hallucination detection, no logical consistency, no LLM repair

**What to build:**

1. **Comprehensive Rule-Based Validation** - Run BEFORE any LLM call:
   ```
   DB Layer:
   - Every table has 'id' column (uuid type)
   - Every table has 'createdAt' timestamp
   - Column types are valid (uuid/text/integer/boolean/datetime/decimal/json)
   - FK references point to existing tables
   - No duplicate table names
   
   API Layer:
   - Every endpoint path starts with /api/
   - HTTP method is valid (GET/POST/PUT/DELETE/PATCH)
   - Every endpoint references at least one DB table
   - Request/response schemas are non-empty objects
   
   UI Layer:
   - Every page route starts with /
   - Every page dataSource references an existing API endpoint
   - Every component name is non-empty
   
   Auth Layer:
   - Every role referenced in API auth is defined
   - Every role referenced in page access is defined
   - No duplicate role names
   ```

2. **LLM-Based Intelligent Repair** - When rule-based validation fails:
   ```
   if (errors.length > 0) {
     // Send ONLY the broken section + errors to LLM
     repairPrompt = `Fix these specific issues in the ${section}:
       Errors: ${errors}
       Current: ${JSON.stringify(brokenSection)}
       Return ONLY the fixed section as valid JSON.`
     
     repaired = callLLM(repairPrompt)
     re-validate(repaired)
     // Max 2 repair cycles
   }
   ```

3. **Hallucination Detection:**
   - Check if API endpoints reference tables that don't exist in the DB schema
   - Check if UI components reference API routes that aren't defined
   - Check if auth roles reference permissions that aren't defined

4. **Conflict Detection:**
   - "Simple" + "advanced features" = flag conflict
   - "Offline" + "real-time" = flag conflict
   - "Single database" + "1M concurrent" = flag conflict

### Phase 2: Full Runtime Integration
**Files:** `lib/compiler/core.ts`, `lib/compiler/export.ts`

The task says: *"Your output must be directly usable to generate a working app (no manual fixes)"*

**Current output:**
- API handlers: `return NextResponse.json({ ok: true })`
- UI pages: `<h1>Page (stub)</h1>`
- Prisma schema: Only has id/createdAt/updatedAt columns

**What to build:**

1. **Rich Schema Generation** - Enhance LLM prompts to produce:
   ```
   Table "users":
     id: uuid (PK, default cuid)
     email: text (unique, required)
     name: text (required)
     role: text (default 'user')
     createdAt: datetime (default now)
     updatedAt: datetime (updatedAt)
   
   Table "contacts":
     id: uuid (PK, default cuid)
     name: text (required)
     email: text
     phone: text
     userId: uuid (FK -> users.id)
     createdAt: datetime (default now)
   ```

2. **Runnable Prisma Schema** (`export.ts`):
   ```prisma
   generator client {
     provider = "prisma-client-js"
   }
   datasource db {
     provider = "postgresql"
     url = env("DATABASE_URL")
   }
   model User {
     id        String   @id @default(cuid())
     email     String   @unique
     name      String
     role      String   @default("user")
     contacts  Contact[]
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   model Contact {
     id        String   @id @default(cuid())
     name      String
     email     String?
     phone     String?
     userId    String
     user      User     @relation(fields: [userId], references: [id])
     createdAt DateTime @default(now())
   }
   ```

3. **Real API Route Handlers** (`export.ts`):
   ```typescript
   import { NextResponse } from 'next/server'
   import { prisma } from '@/lib/db'
   
   export async function GET() {
     const contacts = await prisma.contact.findMany({
       include: { user: true },
       orderBy: { createdAt: 'desc' },
     })
     return NextResponse.json(contacts)
   }
   
   export async function POST(request: Request) {
     const body = await request.json()
     if (!body.name) {
       return NextResponse.json({ error: 'name is required' }, { status: 400 })
     }
     const contact = await prisma.contact.create({ data: body })
     return NextResponse.json(contact, { status: 201 })
   }
   ```

4. **Real UI Pages** (`export.ts`):
   ```tsx
   'use client'
   import { useEffect, useState } from 'react'
   
   export default function ContactsPage() {
     const [contacts, setContacts] = useState([])
     const [loading, setLoading] = useState(true)
   
     useEffect(() => {
       fetch('/api/contacts')
         .then(r => r.json())
         .then(data => { setContacts(data); setLoading(false) })
     }, [])
   
     if (loading) return <div>Loading...</div>
   
     return (
       <main>
         <h1>Contacts</h1>
         <table>
           <thead><tr><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
           <tbody>
             {contacts.map(c => (
               <tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.phone}</td></tr>
             ))}
           </tbody>
         </table>
       </main>
     )
   }
   ```

### Phase 3: Failure Handling + Prompt Analysis
**Files:** `app/api/compile/route.ts`, `lib/validation.ts`

The task says: *"Handle vague prompts, conflicting requirements, underspecified inputs"*

**What to build:**

1. **Prompt Analysis Gate** - Call at START of compile:
   ```typescript
   const analysis = analyzePromptClarity(prompt)
   if (analysis.needsClarification) {
     return NextResponse.json({
       success: false,
       status: 'needs_clarification',
       confidence: analysis.confidence,
       detectedIssues: analysis.detectedIssues,
       clarificationQuestions: analysis.clarificationQuestions,
     })
   }
   ```

2. **Assumption Surfacing** - Include in every response:
   ```typescript
   return NextResponse.json({
     success: true,
     assumptions: intent.assumptions,  // From intent extraction
     // ... rest of response
   })
   ```

3. **Conflict Detection** - Enhance intent extraction to flag:
   - "simple" vs "advanced" requirements
   - Contradictory technical constraints
   - Missing essential information

### Phase 4: Cost Tracking + Quality Metrics
**Files:** `lib/ai.ts`, `lib/compiler/core.ts`

The task says: *"Demonstrate how you balance latency, cost, output quality"*

**What to build:**

1. **Token Counting** in `callLLM()`:
   ```typescript
   const result = await callLLM(options)
   return {
     ...result,
     inputTokens: data.usage?.prompt_tokens || 0,
     outputTokens: data.usage?.completion_tokens || 0,
   }
   ```

2. **Cost Estimation** per stage:
   ```typescript
   const costPerStage = stages.map(s => ({
     stage: s.stage,
     tokens: s.inputTokens + s.outputTokens,
     cost: (s.inputTokens * 0.000003 + s.outputTokens * 0.000015),  // Qwen pricing
   }))
   ```

3. **Quality Scoring**:
   ```typescript
   const qualityScore = {
     schemaCompleteness: calculateCompleteness(schemas),
     crossLayerConsistency: calculateConsistency(schemas),
     executability: checkExecutability(schemas, validation).executable ? 100 : 0,
   }
   ```

4. **Mode Tradeoff Analysis**:
   | Mode | Latency | Cost | Quality | Use When |
   |------|---------|------|---------|----------|
   | Fast | ~1.5s | ~$0.002 | 70/100 | Prototyping |
   | Balanced | ~3s | ~$0.006 | 85/100 | Default |
   | Precise | ~8s | ~$0.018 | 95/100 | Production |

---

## Files to Modify (in order)

| Order | File | Changes |
|---|---|---|
| 1 | `lib/compiler/core.ts` | Rewrite `validateAndRepair()`, add repair loop, hallucination detection, conflict detection |
| 2 | `lib/compiler/export.ts` | Generate real Prisma schemas, real API handlers, real UI pages |
| 3 | `app/api/compile/route.ts` | Add prompt analysis gate, surface assumptions, add clarification response |
| 4 | `lib/ai.ts` | Add token counting, cost tracking to `callLLM()` |
| 5 | `lib/validation.ts` | Enhance `analyzePromptClarity()` with conflict detection |
| 6 | `lib/compiler/evaluation.ts` | Add token/cost tracking to test results |

---

## Verification Checklist

1. ✅ `npx next build` passes with no TypeScript errors
2. ✅ POST `/api/compile` with "Build a CRM with login, contacts, dashboard" returns:
   - Structured intent, design, schemas (all valid JSON)
   - Real Prisma schema with proper field types and relations
   - Real API handlers with Prisma queries
   - Real UI pages with data fetching
   - Validation score and repair log
   - Cost breakdown per stage
   - Assumptions documented
3. ✅ POST `/api/compile` with "Build an app" returns:
   - `needs_clarification` status
   - Clarification questions
   - Detected issues
4. ✅ Generated Prisma schema is syntactically valid
5. ✅ Generated API routes reference existing DB models
6. ✅ Generated UI pages reference existing API routes
7. ✅ `npm run eval:deterministic` produces 20-test report with metrics
8. ✅ Compile response includes `costBreakdown` with per-stage costs
