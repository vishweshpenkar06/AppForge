# AppForge System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AppForge Compiler System                        │
└─────────────────────────────────────────────────────────────────────┘

User Input (Natural Language)
         ↓
    [API Endpoint]
    POST /api/compile
         ↓
    ┌────────────────────────────────────────────────────────┐
    │              5-Stage Pipeline                          │
    ├────────────────────────────────────────────────────────┤
    │ 1. Intent Extraction                                   │
    │    ├─ Parse natural language                           │
    │    ├─ Identify app type, features, roles               │
    │    └─ Document assumptions                             │
    │                                                        │
    │ 2. System Design                                       │
    │    ├─ Create architecture blueprint                    │
    │    ├─ Define pages, API endpoints, data entities      │
    │    └─ Establish access control model                  │
    │                                                        │
    │ 3. Schema Generation                                   │
    │    ├─ Database schema (tables, relationships)         │
    │    ├─ API schema (endpoints, validation)              │
    │    └─ UI schema (pages, components)                   │
    │                                                        │
    │ 4. Refinement                                          │
    │    ├─ Merge all schemas                               │
    │    ├─ Resolve inconsistencies                         │
    │    └─ Ensure cross-layer consistency                  │
    │                                                        │
    │ 5. Validation & Repair                                │
    │    ├─ Validate structure and types                    │
    │    ├─ Check cross-layer consistency                   │
    │    ├─ Auto-repair common issues                       │
    │    └─ Assign quality score (0-100)                    │
    └────────────────────────────────────────────────────────┘
         ↓
    [Execution Check]
    ├─ Is output executable? (≥70 score)
    ├─ Ready for deployment? (≥85 score)
    └─ Document any issues
         ↓
    [Response]
    ├─ Compiled schemas (database, API, UI)
    ├─ Validation report (errors, warnings, score)
    ├─ Execution status
    └─ Performance metrics
```

---

## Core Files & Responsibilities

### 1. Compiler Core (`/lib/compiler/core.ts`) - 451 lines

**Exports**:
- `extractIntent(prompt)` → `Intent`
- `designSystem(intent)` → `SystemDesign`
- `generateSchemas(design, intent)` → `SchemaOutput`
- `refineSchemas(schemas, design)` → `SchemaOutput`
- `validateAndRepair(schemas)` → `ValidationResult`
- `checkExecutability(schemas, validation)` → `ExecutionCheck`

**Schemas**:
- `IntentSchema`: Structured intent representation
- `SystemDesignSchema`: System architecture
- `SchemaOutputSchema`: Final compiled config (database + API + UI)

**Key Features**:
- ✅ Zod-based validation
- ✅ Low temperature (0.1) for determinism
- ✅ Structured prompts for consistency
- ✅ Auto-repair for common issues
- ✅ Cross-layer consistency checks

### 2. Evaluation Framework (`/lib/compiler/evaluation.ts`) - 335 lines

**Exports**:
- `TEST_CASES`: 20 test prompts (10 real + 10 edge cases)
- `runEvaluation()` → `EvaluationReport`
- `formatReport(report)` → Formatted string

**Metrics Tracked**:
- Success rate (%)
- Average latency (ms)
- Average validation score (0-100)
- Execution readiness (%)
- Retry count
- Cost estimation ($)

**Test Coverage**:
- Real products: CRM, Marketplace, Blog, Project Tracker, etc.
- Edge cases: Vague prompts, conflicts, underspecified inputs, etc.

### 3. API Endpoints

#### `POST /api/compile`
```typescript
Request: {
  prompt: string
  mode?: 'fast' | 'balanced' | 'precise'
}

Response: {
  success: boolean
  config?: SchemaOutput
  validation?: ValidationResult
  execution?: ExecutionCheck
  metrics?: { latency, stageTimes, ... }
  error?: string
}
```

**Modes**:
- **fast**: 1-2s latency, $0.002/req, ~70/100 quality
- **balanced** (default): 2-4s, $0.006/req, ~85/100 quality
- **precise**: 5-10s, $0.018/req, ~95/100 quality

#### `GET /api/evaluate`
```typescript
Response: {
  success: boolean
  report: EvaluationReport
  summary: {
    successRate: string
    avgLatency: string
    avgValidationScore: string
    executionRate: string
    averageRetries: string
    totalCost: string
  }
}
```

### 4. Frontend

**Compiler Page** (`/app/compiler/page.tsx`):
- Interactive prompt input
- Real-time compilation results
- Result visualization (tabs: Validation, Schema, Metrics, Execution)
- Evaluation runner
- Metrics dashboard

**Key Components**:
- Form input with mode selection
- Validation score display with progress bar
- Schema browser (formatted JSON)
- Stage timing breakdown
- Execution status
- Test results table

---

## Data Flow Examples

### Example 1: Simple App

**Input Prompt**:
```
"Build a todo app with user authentication and task management."
```

**Stage 1 - Intent Extraction**:
```json
{
  "appType": "crud",
  "primaryFeatures": [
    "User authentication",
    "Task creation/editing",
    "Task list view",
    "Task deletion"
  ],
  "userRoles": ["user"],
  "authRequired": true,
  "paymentRequired": false,
  "dataModels": ["User", "Task"],
  "assumptions": [
    "Single user per session",
    "Tasks are per-user (private)",
    "Email+password authentication"
  ]
}
```

**Stage 2 - System Design**:
```json
{
  "architecture": "monolith",
  "pageStructure": [
    {
      "name": "login",
      "purpose": "User authentication",
      "requiredData": ["email", "password"]
    },
    {
      "name": "dashboard",
      "purpose": "Task management",
      "requiredData": ["tasks", "user"]
    }
  ],
  "apiEndpoints": [
    { "path": "/api/auth/login", "method": "POST", "purpose": "Login" },
    { "path": "/api/tasks", "method": "GET", "purpose": "List tasks" },
    { "path": "/api/tasks", "method": "POST", "purpose": "Create task" }
  ],
  "accessControl": {
    "roles": ["user"],
    "rolePermissions": {
      "user": ["create_task", "edit_own_task", "delete_own_task"]
    }
  }
}
```

**Stage 3 - Schema Generation**:
```json
{
  "database": {
    "tables": [
      {
        "name": "users",
        "columns": [
          { "name": "id", "type": "uuid", "required": true },
          { "name": "email", "type": "string", "required": true },
          { "name": "hashedPassword", "type": "string", "required": true }
        ],
        "relationships": ["tasks"]
      },
      {
        "name": "tasks",
        "columns": [
          { "name": "id", "type": "uuid", "required": true },
          { "name": "userId", "type": "uuid", "required": true },
          { "name": "title", "type": "string", "required": true },
          { "name": "completed", "type": "boolean", "required": false }
        ],
        "relationships": ["users"]
      }
    ]
  },
  "api": {
    "endpoints": [
      {
        "path": "/api/tasks",
        "method": "GET",
        "requestSchema": { "userId": "string (from session)" },
        "responseSchema": {
          "type": "array",
          "items": { "id": "uuid", "title": "string", "completed": "boolean" }
        }
      }
    ]
  },
  "ui": {
    "pages": [
      {
        "route": "/dashboard",
        "components": ["TaskList", "TaskForm", "Header"],
        "dataSource": "GET /api/tasks"
      }
    ]
  }
}
```

**Stage 4 - Refinement**:
- Validates all relationships are consistent
- Confirms API endpoints match database tables
- Ensures UI pages map to API endpoints
- Verifies access control rules apply

**Stage 5 - Validation & Repair**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "repairs": [],
  "score": 88
}
```

**Execution Check**:
```json
{
  "executable": true,
  "issues": [],
  "readyForDeployment": true
}
```

---

## Error Handling Examples

### Example 1: Vague Prompt

**Input**:
```
"Build an app"
```

**Intent Output**:
```json
{
  "appType": "other",
  "primaryFeatures": ["basic functionality"],
  "complexities": ["Too vague to determine specific requirements"],
  "assumptions": [
    "Assuming single-user app",
    "Assuming basic CRUD operations",
    "Assuming no authentication needed (can be added)"
  ]
}
```

### Example 2: Conflicting Requirements

**Input**:
```
"Build a simple app with minimal code, but also with advanced AI, real-time collaboration, and blockchain integration."
```

**Intent Output**:
```json
{
  "appType": "other",
  "complexities": [
    "Conflicting requirements: 'simple' vs 'advanced features'",
    "Real-time + Blockchain typically requires specialized infrastructure"
  ],
  "assumptions": [
    "Choosing balanced complexity",
    "Implementing basic real-time (WebSocket ready)",
    "Documenting blockchain integration points (not implementing)"
  ]
}
```

### Example 3: Auto-Repair

**Input Schema** (missing ID):
```json
{
  "database": {
    "tables": [
      {
        "name": "users",
        "columns": [
          { "name": "email", "type": "string" }
        ]
      }
    ]
  }
}
```

**After Repair**:
```json
{
  "database": {
    "tables": [
      {
        "name": "users",
        "columns": [
          { "name": "id", "type": "uuid", "required": true },  // ADDED
          { "name": "email", "type": "string" }
        ]
      }
    ]
  },
  "repairs": ["Added 'id' column to table 'users'"]
}
```

---

## Performance Characteristics

### Latency Breakdown (Balanced Mode)

| Stage | Latency | % of Total |
|-------|---------|-----------|
| Intent Extraction | 450ms | 18% |
| System Design | 520ms | 21% |
| Schema Generation | 650ms | 26% |
| Refinement | 450ms | 18% |
| Validation & Repair | 380ms | 15% |
| **Total** | **~2500ms** | **100%** |

### Cost Analysis

| Mode | Avg Tokens | Estimated Cost | Quality |
|------|-----------|-----------------|---------|
| Fast | 4,000 | $0.002 | 70/100 |
| Balanced | 8,000 | $0.006 | 85/100 |
| Precise | 12,000 | $0.018 | 95/100 |

---

## Monitoring & Observability

### Logging

Every stage logs:
- Stage name and start time
- Input summary
- Output summary
- Duration
- Any warnings/errors

```typescript
console.log(`[${userId}] Starting Intent Extraction`)
console.log(`[${userId}] Intent extracted: ${intent.appType}`)
console.log(`[${userId}] Duration: ${duration}ms`)
```

### Metrics Collection

Tracked per request:
- User ID
- Prompt length
- App type
- Success/failure
- Validation score
- Execution status
- Total latency
- Stage durations
- Cost estimate

---

## Next Steps / Future Enhancements

1. **Runtime Integration**: Execute generated configs to create working code
2. **Caching**: Cache similar prompts and refined schemas
3. **A/B Testing**: Test different LLM models and prompts
4. **User Feedback**: Collect feedback on generated configs
5. **Fine-tuning**: Fine-tune models on successful generations
6. **Cost Optimization**: Batch requests, use cheaper models for fast mode
7. **Advanced Repair**: ML-based repair suggestions
8. **Schema Templates**: Pre-built patterns for common app types

---

*AppForge System Architecture v1.0*
