# AppForge - Quick Start Guide

## What is AppForge?

AppForge is an AI-powered application compiler that transforms natural language descriptions into production-ready application configurations. It breaks down the compilation process into 5 stages to ensure reliability, consistency, and quality.

**Think of it like: Prompt → Compiler → Executable App Config**

---

## Getting Started (2 minutes)

### 1. Access the Home Page
```
http://localhost:3000
```
You'll see the AppForge landing page with "Get Started" button.

### 2. Access the Compiler
```
http://localhost:3000/compiler
```
This is where you interact with the compiler directly.

### 3. Try a Compilation

**Input Prompt**:
```
Build a project management app with user authentication, 
team collaboration features, task tracking, and real-time notifications.
```

**Click "Compile"** → Watch the system process through 5 stages

**Output**: You'll get:
- ✅ Generated database schema (tables, relationships)
- ✅ Generated API schema (endpoints, validation)
- ✅ Generated UI schema (pages, components)
- ✅ Validation report (errors, warnings, quality score)
- ✅ Execution status (is it production-ready?)
- ✅ Performance metrics (latency, stage times)

---

## API Usage

### Compile an App

```bash
curl -X POST http://localhost:3000/api/compile \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Build a CRM with contacts, deals, and analytics",
    "mode": "balanced"
  }'
```

**Modes**:
- `fast`: 1-2 seconds, lower quality, cheaper
- `balanced`: 2-4 seconds, good quality (recommended)
- `precise`: 5-10 seconds, highest quality, more expensive

**Response Format**:
```json
{
  "success": true,
  "config": {
    "database": { "tables": [...] },
    "api": { "endpoints": [...] },
    "ui": { "pages": [...] }
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "score": 87
  },
  "execution": {
    "executable": true,
    "issues": [],
    "readyForDeployment": true
  },
  "metrics": {
    "latency": 2850,
    "stageTimes": {
      "intent-extraction": 450,
      "system-design": 520,
      "schema-generation": 650,
      "refinement": 450,
      "validation-repair": 380
    }
  }
}
```

### Run Evaluation

Test the system across 20 test cases (10 real products + 10 edge cases):

```bash
curl http://localhost:3000/api/evaluate
```

**Response**: Metrics for all 20 tests:
- Success rate
- Average quality score
- Average latency
- Execution readiness percentage
- Cost analysis
- Detailed results per test

---

## How It Works (5 Stages)

### Stage 1: Intent Extraction
Takes your natural language prompt and extracts structured intent:
- App type (CRM, marketplace, SaaS, etc.)
- Primary features
- User roles
- Authentication requirements
- **Documents assumptions** about vague requirements

### Stage 2: System Design
Creates the system architecture:
- Pages/routes structure
- API endpoints
- Data entities and relationships
- Access control model

### Stage 3: Schema Generation
Generates concrete schemas:
- **Database**: Tables, columns, relationships
- **API**: Endpoints, request/response types
- **UI**: Pages, components, data sources

### Stage 4: Refinement
Ensures consistency across layers:
- API endpoints must reference DB tables
- UI pages must call API endpoints
- No circular dependencies
- All required fields present

### Stage 5: Validation & Repair
Validates and automatically fixes issues:
- Presence checks (all parts present)
- Type checking
- Cross-layer consistency
- Auto-repair (e.g., add missing ID columns)
- Quality scoring (0-100)

---

## Examples

### Example 1: Simple Todo App

**Prompt**:
```
Build a todo app where users can add, edit, and delete tasks.
```

**Result** (Relevant parts):
```json
{
  "database": {
    "tables": [
      {
        "name": "tasks",
        "columns": [
          { "name": "id", "type": "uuid" },
          { "name": "title", "type": "string" },
          { "name": "completed", "type": "boolean" },
          { "name": "userId", "type": "uuid" }
        ]
      }
    ]
  },
  "api": {
    "endpoints": [
      {
        "path": "/api/tasks",
        "method": "GET",
        "responseSchema": { "type": "array", "items": {...} }
      },
      {
        "path": "/api/tasks",
        "method": "POST",
        "requestSchema": { "title": "string" }
      }
    ]
  },
  "validation": {
    "valid": true,
    "score": 92
  }
}
```

### Example 2: Vague Prompt (Handled Gracefully)

**Prompt**:
```
Build an app
```

**Result**:
- ✅ System makes reasonable assumptions
- ✅ Documents them in output
- ✅ Still generates working schema
- ✅ Validation score: 75/100 (warns about ambiguity)

---

## Understanding the Output

### Validation Score (0-100)

- **85-100**: Production-ready, deploy with confidence
- **70-84**: Good quality, minor issues (easily fixable)
- **50-69**: Issues present, needs review
- **<50**: Significant problems, needs redesign

### Execution Status

- **Executable**: Can use this to generate code
- **Ready for Deployment**: Passes all quality checks
- **Issues**: List of problems (if any)

### Metrics

- **Latency**: Total time from prompt to result
- **Stage Times**: Breakdown of each pipeline stage
- **Quality Score**: How good the generated config is
- **Retries**: How many times stages had to retry

---

## Common Patterns

### Pattern 1: CRUD App
```
"Build a contact management app with create, read, update, delete operations"
```
→ Generates database tables, REST API endpoints, form UI

### Pattern 2: SaaS with Auth
```
"Build a subscription service for task management with user accounts and different pricing tiers"
```
→ Generates user authentication, role-based access, payment flows

### Pattern 3: Real-time Social
```
"Build a chat app with real-time messaging, user profiles, and notifications"
```
→ Generates WebSocket endpoints, message queuing, notification system

### Pattern 4: Analytics Dashboard
```
"Create an analytics dashboard that tracks metrics and generates reports"
```
→ Generates data aggregation endpoints, chart data structures, export formats

---

## Troubleshooting

### Issue: "Unauthorized" Error
**Solution**: Make sure you're authenticated with Clerk. Click "Get Started" → Sign in

### Issue: Slow Compilation
**Solution**: Try `mode: "fast"` instead of `balanced`
```bash
curl -X POST http://localhost:3000/api/compile \
  -d '{"prompt": "...", "mode": "fast"}'
```

### Issue: Low Quality Score (<70)
**Solutions**:
1. Be more specific in your prompt (less vague)
2. Use `mode: "precise"` for better quality
3. Break complex requirements into smaller prompts
4. Check warnings in validation output for hints

### Issue: Validation Errors
**Solution**: Look at the error messages in `validation.errors` array. The system often can auto-repair these, but you can:
1. Refine your prompt to be clearer
2. Run again with `mode: "precise"`
3. Check `validation.repairs` for what was automatically fixed

---

## Cost Examples

### Scenario 1: Prototyping (10 prompts)
- Mode: `fast`
- Avg cost per request: $0.002
- Total cost: **$0.02**

### Scenario 2: Production (100 apps)
- Mode: `balanced`
- Avg cost per request: $0.006
- Total cost: **$0.60**

### Scenario 3: High Quality (10 mission-critical apps)
- Mode: `precise`
- Avg cost per request: $0.018
- Total cost: **$0.18**

---

## Next Steps

1. **Try the Compiler**: Visit `/compiler` and experiment
2. **Run Evaluation**: Click "Run Evaluation" to see how the system handles diverse cases
3. **Check the Docs**: Read `REQUIREMENTS_VERIFICATION.md` for technical details
4. **View Architecture**: Read `SYSTEM_ARCHITECTURE.md` for deep dive
5. **Integrate**: Use the API endpoint in your app

---

## Key Takeaways

✅ **Multi-stage pipeline** ensures reliability
✅ **Automatic repair** fixes common issues
✅ **Quality scoring** shows confidence
✅ **Deterministic** same input → consistent output
✅ **Fast** 2-4 seconds for production configs
✅ **Cheap** ~$0.006 per request
✅ **Executable** Output maps directly to code

---

*AppForge Quick Start v1.0 - Start building in 2 minutes*
