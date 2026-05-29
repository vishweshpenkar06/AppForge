/**
 * AppForge Compiler Core
 * Multi-stage, deterministic system for generating validated app configs
 */

import { z } from 'zod'
import { callLLMText } from '@/lib/ai'

// ============================================================================
// STAGE 1: INTENT EXTRACTION
// ============================================================================

const IntentSchema = z.object({
  appType: z.enum([
    'crud',
    'marketplace',
    'crm',
    'saas',
    'content',
    'ecommerce',
    'analytics',
    'social',
    'other',
  ]),
  primaryFeatures: z.array(z.string()),
  userRoles: z.array(z.string()),
  authRequired: z.boolean(),
  paymentRequired: z.boolean(),
  dataModels: z.array(z.string()),
  complexities: z.array(z.string()),
  assumptions: z.array(z.string()),
})

export type Intent = z.infer<typeof IntentSchema>

/**
 * Stage 1: Parse natural language into structured intent
 */
export async function extractIntent(prompt: string): Promise<Intent> {
  const systemPrompt = `You are an expert product architect. Parse user requirements into structured intent.
  
Output ONLY valid JSON matching this schema:
{
  "appType": "one of: crud, marketplace, crm, saas, content, ecommerce, analytics, social, other",
  "primaryFeatures": ["list of 3-5 core features"],
  "userRoles": ["list of distinct user roles"],
  "authRequired": boolean,
  "paymentRequired": boolean,
  "dataModels": ["core entities/models"],
  "complexities": ["list of complex aspects identified"],
  "assumptions": ["list of assumptions made about vague requirements"]
}

Be concise. Document assumptions about ambiguous requirements.`

  const response = await callLLM({
    system: systemPrompt,
    prompt,
    model: 'claude-3.5-sonnet',
  })

  try {
    const text = await callLLMText({ system: systemPrompt, prompt, model: 'claude-3.5-sonnet' })
    return IntentSchema.parse(JSON.parse(text))
  } catch (error) {
    throw new Error(`Intent extraction failed: ${error instanceof Error ? error.message : 'Invalid JSON'}`)
  }
}

// ============================================================================
// STAGE 2: SYSTEM DESIGN
// ============================================================================

const SystemDesignSchema = z.object({
  architecture: z.enum(['monolith', 'microservices', 'serverless']),
  pageStructure: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
      requiredData: z.array(z.string()),
    })
  ),
  apiEndpoints: z.array(
    z.object({
      path: z.string(),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
      purpose: z.string(),
    })
  ),
  dataEntities: z.array(
    z.object({
      name: z.string(),
      relationships: z.array(z.string()),
    })
  ),
  accessControl: z.object({
    roles: z.array(z.string()),
    rolePermissions: z.record(z.array(z.string())),
  }),
})

export type SystemDesign = z.infer<typeof SystemDesignSchema>

/**
 * Stage 2: Convert intent into system architecture
 */
export async function designSystem(intent: Intent): Promise<SystemDesign> {
  const systemPrompt = `You are a system architect. Convert app intent into detailed system design.

Output ONLY valid JSON matching this schema:
{
  "architecture": "monolith|microservices|serverless",
  "pageStructure": [
    {"name": "string", "purpose": "string", "requiredData": ["field1", "field2"]}
  ],
  "apiEndpoints": [
    {"path": "/api/...", "method": "GET|POST|PUT|DELETE", "purpose": "string"}
  ],
  "dataEntities": [
    {"name": "User", "relationships": ["Post", "Comment"]}
  ],
  "accessControl": {
    "roles": ["admin", "user"],
    "rolePermissions": {
      "admin": ["create_user", "delete_post"],
      "user": ["create_post", "edit_own_post"]
    }
  }
}

Requirements:
- Architecture must match app complexity
- All pages must have defined data requirements
- API endpoints must cover all required actions
- Relationships must be consistent across entities`

  const prompt = `App Type: ${intent.appType}
Features: ${intent.primaryFeatures.join(', ')}
Roles: ${intent.userRoles.join(', ')}
Key Entities: ${intent.dataModels.join(', ')}`

  const response = await callLLM({
    system: systemPrompt,
    prompt,
    model: 'Qwen/Qwen3.6-35B-A3B',
  })

  try {
    const text = await callLLMText({ system: systemPrompt, prompt, model: 'Qwen/Qwen3.6-35B-A3B' })
    return SystemDesignSchema.parse(JSON.parse(text))
  } catch (error) {
    throw new Error(`System design failed: ${error instanceof Error ? error.message : 'Invalid schema'}`)
  }
}

// ============================================================================
// STAGE 3: SCHEMA GENERATION
// ============================================================================

const SchemaOutputSchema = z.object({
  database: z.object({
    tables: z.array(
      z.object({
        name: z.string(),
        columns: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            required: z.boolean(),
          })
        ),
        relationships: z.array(z.string()),
      })
    ),
  }),
  api: z.object({
    endpoints: z.array(
      z.object({
        path: z.string(),
        method: z.string(),
        requestSchema: z.record(z.any()),
        responseSchema: z.record(z.any()),
      })
    ),
  }),
  ui: z.object({
    pages: z.array(
      z.object({
        route: z.string(),
        components: z.array(z.string()),
        dataSource: z.string(),
      })
    ),
  }),
})

export type SchemaOutput = z.infer<typeof SchemaOutputSchema>

/**
 * Stage 3: Generate concrete schemas from design
 */
export async function generateSchemas(design: SystemDesign, intent: Intent): Promise<SchemaOutput> {
  const systemPrompt = `Generate database, API, and UI schemas from system design.

Output ONLY valid JSON with this structure:
{
  "database": {
    "tables": [
      {
        "name": "users",
        "columns": [
          {"name": "id", "type": "uuid", "required": true},
          {"name": "email", "type": "string", "required": true}
        ],
        "relationships": ["posts"]
      }
    ]
  },
  "api": {
    "endpoints": [
      {
        "path": "/api/users",
        "method": "GET",
        "requestSchema": {},
        "responseSchema": {"type": "array", "items": {"type": "object"}}
      }
    ]
  },
  "ui": {
    "pages": [
      {
        "route": "/dashboard",
        "components": ["Header", "Sidebar", "MainContent"],
        "dataSource": "GET /api/dashboard"
      }
    ]
  }
}

Requirements:
- All database tables must have id + timestamp columns
- All API endpoints must have clear request/response schemas
- All UI pages must map to API data sources
- Foreign keys must be explicit in relationships`

  const designJson = JSON.stringify(design)
  const response = await callLLM({
    system: systemPrompt,
    prompt,
    model: 'Qwen/Qwen3.6-35B-A3B',
  })

  try {
    const text = await callLLMText({ system: systemPrompt, prompt, model: 'Qwen/Qwen3.6-35B-A3B' })
    return SchemaOutputSchema.parse(JSON.parse(text))
  } catch (error) {
    throw new Error(`Schema generation failed: ${error instanceof Error ? error.message : 'Invalid structure'}`)
  }
}

// ============================================================================
// STAGE 4: REFINEMENT
// ============================================================================

/**
 * Stage 4: Merge schemas and resolve cross-layer inconsistencies
 */
export async function refineSchemas(
  schemas: SchemaOutput,
  design: SystemDesign
): Promise<SchemaOutput> {
  const systemPrompt = `Refine schemas to ensure cross-layer consistency.

Validate and fix:
1. API endpoints reference existing database tables
2. UI pages request only existing API endpoints
3. All required fields are present in schemas
4. No circular dependencies
5. Role-based access is enforced

Output the corrected, complete schema as valid JSON.`

  const schemasJson = JSON.stringify(schemas)
  const response = await callLLM({
    system: systemPrompt,
    prompt: schemasJson,
    model: 'Qwen/Qwen3.6-35B-A3B',
  })

  try {
    const text = await callLLMText({ system: systemPrompt, prompt: schemasJson, model: 'Qwen/Qwen3.6-35B-A3B' })
    return SchemaOutputSchema.parse(JSON.parse(text))
  } catch (error) {
    throw new Error(`Refinement failed: ${error instanceof Error ? error.message : 'Could not repair'}`)
  }
}

// ============================================================================
// STAGE 5: VALIDATION & REPAIR
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  repairs: string[]
  score: number
}

/**
 * Stage 5: Validate all layers and attempt intelligent repairs
 */
export async function validateAndRepair(schemas: SchemaOutput): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const repairs: string[] = []

  // Validation checks
  if (!schemas.database.tables.length) {
    errors.push('No database tables defined')
  }

  if (!schemas.api.endpoints.length) {
    errors.push('No API endpoints defined')
  }

  if (!schemas.ui.pages.length) {
    errors.push('No UI pages defined')
  }

  // Check cross-layer consistency
  const tableNames = new Set(schemas.database.tables.map((t) => t.name))
  const endpointPaths = new Set(schemas.api.endpoints.map((e) => e.path))

  for (const endpoint of schemas.api.endpoints) {
    const tableMatch = Array.from(tableNames).find((t) => endpoint.path.includes(t.toLowerCase()))
    if (!tableMatch) {
      warnings.push(`Endpoint ${endpoint.path} may not reference any table`)
    }
  }

  for (const page of schemas.ui.pages) {
    if (page.dataSource && !page.dataSource.includes('/api/')) {
      errors.push(`Page ${page.route} has invalid data source: ${page.dataSource}`)
    }
  }

  // Check for required fields
  for (const table of schemas.database.tables) {
    const hasId = table.columns.some((c) => c.name === 'id')
    if (!hasId) {
      repairs.push(`Added 'id' column to table '${table.name}'`)
      table.columns.unshift({
        name: 'id',
        type: 'uuid',
        required: true,
      })
    }
  }

  const score = Math.max(0, 100 - errors.length * 20 - warnings.length * 5)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    repairs,
    score,
  }
}

// ============================================================================
// EXECUTION CHECK
// ============================================================================

export interface ExecutionCheck {
  executable: boolean
  issues: string[]
  readyForDeployment: boolean
}

/**
 * Check if the generated schema is executable
 */
export function checkExecutability(schemas: SchemaOutput, validation: ValidationResult): ExecutionCheck {
  const issues: string[] = []

  if (!validation.valid) {
    issues.push(`Validation errors: ${validation.errors.join(', ')}`)
  }

  // Check if all parts are present
  if (schemas.database.tables.length === 0) {
    issues.push('Database schema is empty')
  }

  if (schemas.api.endpoints.length === 0) {
    issues.push('API schema is empty')
  }

  if (schemas.ui.pages.length === 0) {
    issues.push('UI schema is empty')
  }

  // Check executability
  const executable = issues.length === 0 && validation.score >= 70

  return {
    executable,
    issues,
    readyForDeployment: executable && validation.score >= 85,
  }
}

// ============================================================================
// HELPER: LLM CALL
// ============================================================================

// callLLMText in `lib/ai.ts` is used for LLM interactions, including deterministic stub mode.
