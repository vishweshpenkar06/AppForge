/**
 * AppForge Compiler Core
 * Multi-stage, deterministic system for generating validated app configs
 */

import { z } from 'zod'
import { callLLMText, extractJSON, STAGE_CONFIGS } from '@/lib/ai'

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
  premiumFeatures: z.array(z.string()).default([]),
  userFlows: z.array(z.object({
    role: z.string(),
    flow_name: z.string(),
    steps: z.array(z.string()),
  })).default([]),
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
  "assumptions": ["list of assumptions made about vague requirements"],
  "premiumFeatures": ["list of features gated behind payment/subscription"],
  "userFlows": [{"role": "role name", "flow_name": "name", "steps": ["step1", "step2"]}]
}

Detection rules:
- If the prompt mentions "premium", "paid", "subscription", "pro plan", "upgrade", or "payment" → set paymentRequired: true AND list specific premium-gated features in premiumFeatures[]
- If the prompt mentions roles (admin, user, guest, manager, etc.) → populate userRoles[] with all detected roles
- Always generate at least one user_flow per detected role. Example for "admin": ["Login → Dashboard → View Analytics → Export Report"]

Be concise. Document assumptions about ambiguous requirements.`

  try {
    const llmResult = await callLLMText({ system: systemPrompt, prompt, model: STAGE_CONFIGS.intent.model })
    const parsed = extractJSON(llmResult.text)

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

  const hasPayment = normalizedPrompt.includes('payment') || normalizedPrompt.includes('billing') || normalizedPrompt.includes('subscription') || normalizedPrompt.includes('premium')

  const premiumFeatures = hasPayment
    ? [
        normalizedPrompt.includes('analytics') ? 'advanced_analytics' : '',
        normalizedPrompt.includes('export') ? 'export' : '',
        normalizedPrompt.includes('report') ? 'reports' : '',
      ].filter(Boolean) as string[]
    : []

  const userFlows = userRoles.map(role => ({
    role,
    flow_name: `${role}_main_flow`,
    steps: role === 'admin'
      ? ['Login', 'Dashboard', 'View Analytics', 'Manage Users', 'Export Reports']
      : ['Login', 'Dashboard', 'View Data', 'Create Record', 'Edit Profile'],
  }))

  return {
    appType,
    primaryFeatures: primaryFeatures.length > 0 ? primaryFeatures : ['basic_crud'],
    userRoles: userRoles.length > 0 ? userRoles : ['user'],
    authRequired: normalizedPrompt.includes('auth') || normalizedPrompt.includes('login') || normalizedPrompt.includes('sign in'),
    paymentRequired: hasPayment,
    dataModels: dataModels.length > 0 ? dataModels : ['items'],
    complexities: normalizedPrompt.includes('role') ? ['role-based access'] : [],
    assumptions: ['Fallback intent parser used because model output was not valid JSON'],
    premiumFeatures,
    userFlows,
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
    const llmResult = await callLLMText({ system: systemPrompt, prompt: designPrompt, model: STAGE_CONFIGS.design.model })
    const parsed = extractJSON(llmResult.text)

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
    const llmResult = await callLLMText({ system: systemPrompt, prompt: schemaPrompt, model: STAGE_CONFIGS.schema.model })
    const parsed = extractJSON(llmResult.text)

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
    const llmResult = await callLLMText({ system: systemPrompt, prompt: schemasJson, model: STAGE_CONFIGS.refinement.model })
    const parsed = extractJSON(llmResult.text)

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

const VALID_DB_TYPES = ['uuid', 'text', 'string', 'integer', 'int', 'number', 'boolean', 'bool', 'datetime', 'date', 'timestamp', 'timestamptz', 'decimal', 'float', 'json', 'jsonb']
const VALID_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  repairs: string[]
  score: number
}

/**
 * Stage 5: Comprehensive validation with intelligent auto-repair.
 *
 * Steps:
 * 1. Rule-based checks across DB, API, UI, and Auth layers
 * 2. Auto-repair what we can fix deterministically (missing columns, broken references)
 * 3. LLM-assisted repair for issues that need semantic understanding
 * 4. Re-validate after repairs and compute final score
 */
export async function validateAndRepair(schemas: SchemaOutput): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const repairs: string[] = []

  // ── DB Layer Validation ──────────────────────────────────────────────
  if (!schemas.database.tables.length) {
    errors.push('No database tables defined')
  }

  const tableNames = new Set<string>()
  for (const table of schemas.database.tables) {
    if (!table.name) {
      errors.push('Database table has no name')
      continue
    }
    const lower = table.name.toLowerCase()
    if (tableNames.has(lower)) {
      errors.push(`Duplicate table name: '${table.name}'`)
    }
    tableNames.add(lower)

    if (!table.columns.length) {
      errors.push(`Table '${table.name}' has no columns`)
      continue
    }

    // Every table must have an id column
    const hasId = table.columns.some((c) => c.name === 'id')
    if (!hasId) {
      repairs.push(`Added 'id' column to table '${table.name}'`)
      table.columns.unshift({ name: 'id', type: 'uuid', required: true })
    }

    // Every table should have createdAt
    const hasCreatedAt = table.columns.some((c) => c.name === 'createdAt' || c.name === 'created_at')
    if (!hasCreatedAt) {
      repairs.push(`Added 'createdAt' column to table '${table.name}'`)
      table.columns.push({ name: 'createdAt', type: 'datetime', required: true })
    }

    // Validate column types
    for (const col of table.columns) {
      if (col.type && !VALID_DB_TYPES.includes(col.type.toLowerCase())) {
        warnings.push(`Table '${table.name}' column '${col.name}' has unusual type '${col.type}'`)
      }
    }
  }

  // ── API Layer Validation ─────────────────────────────────────────────
  if (!schemas.api.endpoints.length) {
    errors.push('No API endpoints defined')
  }

  const endpointPaths = new Set<string>()
  for (const endpoint of schemas.api.endpoints) {
    if (!endpoint.path) {
      errors.push('API endpoint has no path')
      continue
    }
    if (!endpoint.path.startsWith('/api/')) {
      warnings.push(`API endpoint '${endpoint.path}' does not start with /api/`)
    }

    const method = (endpoint.method || 'GET').toUpperCase()
    if (!VALID_HTTP_METHODS.includes(method)) {
      errors.push(`API endpoint '${endpoint.path}' has invalid method '${endpoint.method}'`)
    }

    const dedupKey = `${method} ${endpoint.path}`
    if (endpointPaths.has(dedupKey)) {
      warnings.push(`Duplicate API endpoint: ${dedupKey}`)
    }
    endpointPaths.add(dedupKey)

    // Check if endpoint references any table
    const endpointTableMatch = Array.from(tableNames).find(
      (t) => endpoint.path.toLowerCase().includes(t)
    )
    if (!endpointTableMatch) {
      warnings.push(`Endpoint '${endpoint.path}' may not reference any database table`)
    }
  }

  // ── UI Layer Validation ──────────────────────────────────────────────
  if (!schemas.ui.pages.length) {
    warnings.push('No UI pages defined')
  }

  const apiRouteSet = new Set(schemas.api.endpoints.map((e) => e.path))
  for (const page of schemas.ui.pages) {
    if (!page.route) {
      errors.push('UI page has no route')
      continue
    }
    if (!page.route.startsWith('/')) {
      errors.push(`UI page route '${page.route}' does not start with /`)
    }

    // Check dataSource references a real API endpoint
    if (page.dataSource) {
      const dsParts = page.dataSource.trim().split(/\s+/)
      const dsMethod = dsParts[0] // e.g. "GET"
      const dsPath = dsParts[1] || dsParts[0] // e.g. "/api/contacts"

      const matchingEndpoint = schemas.api.endpoints.find(
        (e) => e.path === dsPath || e.path === dsPath?.replace(/^\//, '/api/')
      )
      if (!matchingEndpoint && dsPath) {
        warnings.push(`Page '${page.route}' dataSource '${page.dataSource}' references undefined API endpoint`)
      }
    }

    // Check component names are non-empty
    for (const comp of page.components) {
      if (!comp || !comp.trim()) {
        warnings.push(`Page '${page.route}' has empty component name`)
      }
    }
  }

  // ── Cross-Layer Consistency ──────────────────────────────────────────

  // DB columns referenced by API endpoints must exist
  for (const endpoint of schemas.api.endpoints) {
    if (endpoint.requestSchema && typeof endpoint.requestSchema === 'object') {
      for (const fieldName of Object.keys(endpoint.requestSchema)) {
        const fieldExists = schemas.database.tables.some((t) =>
          t.columns.some((c) => c.name.toLowerCase() === fieldName.toLowerCase())
        )
        if (!fieldExists && fieldName !== 'id' && fieldName !== 'userId') {
          warnings.push(`API endpoint '${endpoint.path}' references field '${fieldName}' not found in any database table`)
        }
      }
    }
  }

  // ── LLM-Assisted Repair ─────────────────────────────────────────────
  // If we have errors that rule-based repair couldn't fix, try LLM repair
  if (errors.length > 0) {
    try {
      const repairPrompt = `You are fixing a broken application schema. Here are the validation errors that need to be fixed:

${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Current schema (JSON):
${JSON.stringify(schemas, null, 2)}

Fix ONLY the specific issues listed above. Return the corrected full schema as valid JSON.
Output ONLY valid JSON, nothing else.`

      const llmResult = await callLLMText({
        system: 'You are a schema repair expert. Fix validation errors surgically. Output ONLY valid JSON.',
        prompt: repairPrompt,
        model: STAGE_CONFIGS.repair.model,
      })

      const repaired = extractJSON(llmResult.text)
      if (repaired && repaired.database && repaired.api && repaired.ui) {
        // Re-validate the repaired schema
        const repairedResult = validateSchemaOutput(repaired as SchemaOutput)
        if (repairedResult.errors.length < errors.length) {
          // LLM repair was helpful - merge the fix
          const fixedCount = errors.length - repairedResult.errors.length
          repairs.push(`LLM repair fixed ${fixedCount} issue(s)`)
          Object.assign(schemas, repaired)

          // Clear errors and re-run rule-based checks on the repaired schema
          errors.length = 0
          warnings.length = 0
          return validateAndRepairNoLLM(schemas, errors, warnings, repairs)
        }
      }
    } catch (err) {
      console.warn('[Compiler] LLM repair failed, using rule-based repairs only:', err)
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

/**
 * Run only rule-based validation (no LLM calls) - used after LLM repair
 */
function validateAndRepairNoLLM(
  schemas: SchemaOutput,
  errors: string[],
  warnings: string[],
  repairs: string[]
): ValidationResult {
  const tableNames = new Set(schemas.database.tables.map((t) => t.name.toLowerCase()))

  if (!schemas.database.tables.length) errors.push('No database tables defined')
  if (!schemas.api.endpoints.length) errors.push('No API endpoints defined')

  for (const table of schemas.database.tables) {
    if (!table.columns.some((c) => c.name === 'id')) {
      repairs.push(`Added 'id' column to table '${table.name}'`)
      table.columns.unshift({ name: 'id', type: 'uuid', required: true })
    }
    if (!table.columns.some((c) => c.name === 'createdAt' || c.name === 'created_at')) {
      repairs.push(`Added 'createdAt' column to table '${table.name}'`)
      table.columns.push({ name: 'createdAt', type: 'datetime', required: true })
    }
  }

  for (const endpoint of schemas.api.endpoints) {
    if (!endpoint.path?.startsWith('/api/')) {
      warnings.push(`API endpoint '${endpoint.path}' does not start with /api/`)
    }
  }

  for (const page of schemas.ui.pages) {
    if (!page.route?.startsWith('/')) {
      errors.push(`UI page route '${page.route}' does not start with /`)
    }
  }

  const score = Math.max(0, 100 - errors.length * 20 - warnings.length * 5)
  return { valid: errors.length === 0, errors, warnings, repairs, score }
}

/**
 * Quick structural validation of a SchemaOutput (no side effects)
 */
function validateSchemaOutput(schemas: SchemaOutput): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (!schemas.database?.tables?.length) errors.push('No database tables defined')
  if (!schemas.api?.endpoints?.length) errors.push('No API endpoints defined')

  for (const table of schemas.database?.tables || []) {
    if (!table.columns?.some((c) => c.name === 'id')) {
      errors.push(`Table '${table.name}' missing id column`)
    }
  }

  return { errors, warnings }
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
