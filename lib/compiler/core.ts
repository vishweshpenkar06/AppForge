/**
 * AppForge Compiler Core
 * Multi-stage, deterministic system for generating validated app configs
 */

import { z } from 'zod'
import { callLLMText, extractJSON } from '@/lib/ai'

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

  try {
    const text = await callLLMText({ system: systemPrompt, prompt, model: 'Qwen/Qwen3.6-35B-A3B' })
    const parsed = extractJSON(text)

    if (parsed) {
      return IntentSchema.parse(parsed)
    }

    console.warn('[Compiler] Intent model output was not valid JSON, using fallback intent parser')
    return IntentSchema.parse(buildFallbackIntent(prompt))
  } catch (error) {
    console.warn('[Compiler] Intent extraction failed, using fallback intent parser:', error)
    return IntentSchema.parse(buildFallbackIntent(prompt))
  }
}

function buildFallbackIntent(prompt: string): Intent {
  const normalizedPrompt = prompt.toLowerCase()

  const appType = normalizedPrompt.includes('marketplace')
    ? 'marketplace'
    : normalizedPrompt.includes('crm') || normalizedPrompt.includes('customer')
      ? 'crm'
      : normalizedPrompt.includes('ecommerce') || normalizedPrompt.includes('store') || normalizedPrompt.includes('shop')
        ? 'ecommerce'
        : normalizedPrompt.includes('analytics') || normalizedPrompt.includes('dashboard')
          ? 'analytics'
          : normalizedPrompt.includes('social') || normalizedPrompt.includes('community')
            ? 'social'
            : normalizedPrompt.includes('blog') || normalizedPrompt.includes('content')
              ? 'content'
              : normalizedPrompt.includes('saas') || normalizedPrompt.includes('subscription')
                ? 'saas'
                : 'crud'

  const primaryFeatures = [
    normalizedPrompt.includes('auth') || normalizedPrompt.includes('login') ? 'authentication' : '',
    normalizedPrompt.includes('dashboard') ? 'dashboard' : '',
    normalizedPrompt.includes('analytics') ? 'analytics' : '',
    normalizedPrompt.includes('payment') || normalizedPrompt.includes('billing') ? 'payments' : '',
    normalizedPrompt.includes('admin') ? 'admin_panel' : '',
  ].filter(Boolean) as string[]

  const userRoles = [
    normalizedPrompt.includes('admin') ? 'admin' : '',
    normalizedPrompt.includes('manager') ? 'manager' : '',
    normalizedPrompt.includes('customer') || normalizedPrompt.includes('user') ? 'user' : '',
  ].filter(Boolean) as string[]

  const dataModels = [
    normalizedPrompt.includes('order') ? 'orders' : '',
    normalizedPrompt.includes('product') ? 'products' : '',
    normalizedPrompt.includes('task') ? 'tasks' : '',
    normalizedPrompt.includes('contact') ? 'contacts' : '',
    normalizedPrompt.includes('message') ? 'messages' : '',
  ].filter(Boolean) as string[]

  return {
    appType,
    primaryFeatures: primaryFeatures.length > 0 ? primaryFeatures : ['basic_crud'],
    userRoles: userRoles.length > 0 ? userRoles : ['user'],
    authRequired: normalizedPrompt.includes('auth') || normalizedPrompt.includes('login') || normalizedPrompt.includes('sign in'),
    paymentRequired: normalizedPrompt.includes('payment') || normalizedPrompt.includes('billing') || normalizedPrompt.includes('subscription'),
    dataModels: dataModels.length > 0 ? dataModels : ['items'],
    complexities: normalizedPrompt.includes('role') ? ['role-based access'] : [],
    assumptions: ['Fallback intent parser used because model output was not valid JSON'],
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

  const designPrompt = `App Type: ${intent.appType}
Features: ${intent.primaryFeatures.join(', ')}
Roles: ${intent.userRoles.join(', ')}
Key Entities: ${intent.dataModels.join(', ')}`

  try {
    const text = await callLLMText({ system: systemPrompt, prompt: designPrompt, model: 'Qwen/Qwen3.6-35B-A3B' })
    const parsed = extractJSON(text)

    if (parsed) {
      return SystemDesignSchema.parse(parsed)
    }

    console.warn('[Compiler] System design output was not valid JSON, using fallback design parser')
    return SystemDesignSchema.parse(buildFallbackDesign(intent))
  } catch (error) {
    console.warn('[Compiler] System design failed, using fallback design parser:', error)
    return SystemDesignSchema.parse(buildFallbackDesign(intent))
  }
}

function buildFallbackDesign(intent: Intent): SystemDesign {
  const primaryEntity = intent.dataModels[0] || 'items'
  const roles = intent.userRoles.length > 0 ? intent.userRoles : ['user']

  return {
    architecture: intent.appType === 'analytics' ? 'serverless' : 'monolith',
    pageStructure: [
      {
        name: 'Home',
        purpose: 'Landing page and overview',
        requiredData: ['session', 'branding'],
      },
      {
        name: 'Dashboard',
        purpose: 'Primary application workspace',
        requiredData: ['currentUser', primaryEntity],
      },
    ],
    apiEndpoints: [
      {
        path: `/api/${primaryEntity}`,
        method: 'GET',
        purpose: `List ${primaryEntity}`,
      },
      {
        path: `/api/${primaryEntity}`,
        method: 'POST',
        purpose: `Create ${primaryEntity}`,
      },
    ],
    dataEntities: intent.dataModels.length > 0
      ? intent.dataModels.map((name) => ({ name, relationships: intent.dataModels.filter((related) => related !== name) }))
      : [{ name: primaryEntity, relationships: [] }],
    accessControl: {
      roles,
      rolePermissions: roles.reduce<Record<string, string[]>>((permissions, role) => {
        permissions[role] = role === 'admin' ? ['read', 'write', 'manage'] : ['read', 'write']
        return permissions
      }, {}),
    },
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

  const schemaPrompt = `${JSON.stringify(design)}\n\nIntent context: ${JSON.stringify(intent)}`

  try {
    const text = await callLLMText({ system: systemPrompt, prompt: schemaPrompt, model: 'Qwen/Qwen3.6-35B-A3B' })
    const parsed = extractJSON(text)

    if (parsed) {
      return SchemaOutputSchema.parse(parsed)
    }

    console.warn('[Compiler] Schema output was not valid JSON, using fallback schema parser')
    return SchemaOutputSchema.parse(buildFallbackSchema(design, intent))
  } catch (error) {
    console.warn('[Compiler] Schema generation failed, using fallback schema parser:', error)
    return SchemaOutputSchema.parse(buildFallbackSchema(design, intent))
  }
}

function buildFallbackSchema(design: SystemDesign, intent: Intent): SchemaOutput {
  const entityNames = design.dataEntities.length > 0 ? design.dataEntities.map((entity) => entity.name) : intent.dataModels
  const primaryEntity = entityNames[0] || 'items'

  return {
    database: {
      tables: entityNames.map((name) => ({
        name,
        columns: [
          { name: 'id', type: 'uuid', required: true },
          { name: 'createdAt', type: 'datetime', required: true },
          { name: 'updatedAt', type: 'datetime', required: true },
        ],
        relationships: entityNames.filter((related) => related !== name),
      })),
    },
    api: {
      endpoints: design.apiEndpoints.map((endpoint) => ({
        path: endpoint.path,
        method: endpoint.method,
        requestSchema: {},
        responseSchema: { type: 'object' },
      })),
    },
    ui: {
      pages: design.pageStructure.map((page) => ({
        route: page.name.toLowerCase().includes('home') ? '/' : `/${page.name.toLowerCase().replace(/\s+/g, '-')}`,
        components: ['PageShell', 'Header', page.name.replace(/\s+/g, '') || 'Content'],
        dataSource: `GET /api/${primaryEntity}`,
      })),
    },
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

  try {
    const text = await callLLMText({ system: systemPrompt, prompt: schemasJson, model: 'Qwen/Qwen3.6-35B-A3B' })
    const parsed = extractJSON(text)

    if (parsed) {
      return SchemaOutputSchema.parse(parsed)
    }

    console.warn('[Compiler] Refinement output was not valid JSON, using normalized schema')
    return SchemaOutputSchema.parse(normalizeSchemaOutput(schemas))
  } catch (error) {
    console.warn('[Compiler] Refinement failed, using normalized schema:', error)
    return SchemaOutputSchema.parse(normalizeSchemaOutput(schemas))
  }
}

function normalizeSchemaOutput(schemas: SchemaOutput): SchemaOutput {
  return {
    database: {
      tables: schemas.database.tables.map((table) => ({
        ...table,
        columns: table.columns.some((column) => column.name === 'id')
          ? table.columns
          : [{ name: 'id', type: 'uuid', required: true }, ...table.columns],
      })),
    },
    api: {
      endpoints: schemas.api.endpoints,
    },
    ui: {
      pages: schemas.ui.pages,
    },
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
