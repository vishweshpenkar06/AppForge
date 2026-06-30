// LLM / API Configuration
// Supports: Groq, Featherless, Nvidia (build.nvidia.com), or any OpenAI-compatible API
const API_KEY = process.env.NVIDIA_API_KEY || process.env.GROQ_API_KEY || process.env.FEATHERLESS_API_KEY
const API_BASE_URL = process.env.LLM_BASE_URL || process.env.GROQ_API_BASE_URL || process.env.FEATHERLESS_BASE_URL || 'https://integrate.api.nvidia.com/v1'
const DEFAULT_MODEL = process.env.LLM_MODEL || 'meta/llama-3.3-70b-instruct'

// Allow running in deterministic test mode without an external API key
if (!API_KEY && process.env.DETERMINISTIC_LLM !== '1') {
  throw new Error('LLM API key is required (set NVIDIA_API_KEY, GROQ_API_KEY, FEATHERLESS_API_KEY, or use DETERMINISTIC_LLM=1).')
}

// ============================================================================
// STAGE CONFIGURATIONS
// ============================================================================

export const STAGE_CONFIGS = {
  intent: {
    model: DEFAULT_MODEL,
    max_tokens: 1500,
    temperature: 0.2,
  },
  design: {
    model: DEFAULT_MODEL,
    max_tokens: 2500,
    temperature: 0.1,
  },
  schema: {
    model: DEFAULT_MODEL,
    max_tokens: 4000,
    temperature: 0,
  },
  refinement: {
    model: DEFAULT_MODEL,
    max_tokens: 4000,
    temperature: 0,
  },
  repair: {
    model: DEFAULT_MODEL,
    max_tokens: 2500,
    temperature: 0,
  },
}

// ============================================================================
// JSON EXTRACTION UTILITY
// ============================================================================

/**
 * Extract valid JSON from LLM output, handling markdown fences and text wrapping
 */
export function extractJSON<T = any>(text: string): T | null {
  try {
    // First try direct parsing
    return JSON.parse(text)
  } catch {
    // Try extracting from markdown code fences
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1])
      } catch {
        // continue to next attempt
      }
    }

    // Try finding raw JSON object/array in text
    const objectMatch = text.match(/\{[\s\S]*\}(?=\s*$)/)
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0])
      } catch {
        // continue
      }
    }

    const arrayMatch = text.match(/\[[\s\S]*\](?=\s*$)/)
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0])
      } catch {
        // continue
      }
    }

    return null
  }
}

// ============================================================================
// SYSTEM PROMPTS FOR EACH STAGE
// ============================================================================

export const SYSTEM_PROMPTS = {
  intent: `You are an expert product requirements analyst. Your job is to extract structured intent from natural language product descriptions.

TASK: Analyze the given product description and extract:
- appType: The category of application
- description: A 1-2 sentence summary
- features: List of key features
- userRoles: Different types of users/personas
- entities: Core data objects the system manages
- integrations: Any third-party services mentioned
- constraints: Technical or business constraints
- assumptions: Assumptions you're making to clarify ambiguity
- confidenceScore: 0.0-1.0 rating of how clear the requirements are

OUTPUT FORMAT:
You MUST output ONLY valid JSON, nothing else. No markdown, no explanation, just JSON.
{
  "appType": "...",
  "description": "...",
  "features": [...],
  "userRoles": [...],
  "entities": [...],
  "integrations": [...],
  "constraints": [...],
  "assumptions": [...],
  "confidenceScore": 0.85
}`,

  design: `You are a senior systems architect designing application architecture.

Given a structured intent (as JSON), you must produce a system design blueprint that covers:
- pages: Web pages and their accessibility
- apiGroups: API endpoint groupings
- dbTables: Database tables and relationships
- authStrategy: Authentication approach
- rolePermissions: What each role can do

This is a high-level design phase. You are NOT writing SQL or code yet.

OUTPUT FORMAT:
You MUST output ONLY valid JSON, nothing else.
{
  "pages": [
    {"name": "...", "route": "...", "description": "...", "accessibleBy": [...]}
  ],
  "apiGroups": [
    {"name": "...", "description": "...", "endpoints": [...]}
  ],
  "dbTables": [
    {"name": "...", "purpose": "...", "relatedTables": [...]}
  ],
  "authStrategy": "...",
  "rolePermissions": {"admin": [...], "user": [...]}
}`,

  schema: `You are a database and API schema expert. You produce precise, executable schemas.

IMPORTANT: You will receive architectural context. Using that, produce ONLY the JSON schema for the specified section.
Your output must be valid, complete, and consistent with the architecture.

OUTPUT FORMAT:
Respond with ONLY valid JSON, no explanation.`,

  refinement: `You are a system consistency auditor. You receive a partially merged application configuration and must:
1. Resolve any naming inconsistencies
2. Fill in missing relationships and foreign keys
3. Complete role permission mappings
4. Ensure all references are valid

Produce the refined, merged AppConfig JSON.

OUTPUT FORMAT:
You MUST output ONLY valid JSON.`,

  repair: `You are an expert at fixing broken application configurations.

You will receive:
- An incomplete or broken AppConfig (or section thereof)
- A list of validation errors
- The specific section that needs repair

Your task: Fix ONLY the specified section to resolve the listed errors. Be minimal and surgical - do not regenerate the entire config.

Return JSON with:
- repairedSection: The fixed section
- changes: Array of {field, before, after} documenting what changed

OUTPUT FORMAT:
Respond with ONLY valid JSON.`,
}

// ============================================================================
// LLM CALL HELPER
// ============================================================================

export interface LLMCallOptions {
  model: string
  max_tokens: number
  temperature: number
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  system?: string
  top_p?: number
}

export async function callLLM(options: LLMCallOptions) {
  const startTime = Date.now()

  try {
    // Build messages array with system prompt if provided
    const messages = options.system
      ? [{ role: 'system' as const, content: options.system }, ...options.messages]
      : options.messages

    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages,
        max_tokens: options.max_tokens,
        temperature: options.temperature,
        top_p: options.top_p ?? 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LLM API error (${response.status}): ${error}`)
    }

    const data = await response.json()
    const latencyMs = Date.now() - startTime

    return {
      success: true,
      output: data.choices[0].message.content,
      latencyMs,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    throw {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs,
    }
  }
}

/**
 * Wrapper returning raw assistant text. Supports deterministic stub when
 * `DETERMINISTIC_LLM` env var is set to `1`.
 */
export async function callLLMText({ system, prompt, model }: { system: string; prompt: string; model: string }) {
  // Deterministic stub for tests / evaluation without external API
  if (process.env.DETERMINISTIC_LLM === '1') {
    // Very small heuristic-based deterministic responses per stage
    const sys = system.toLowerCase()

    // Intent extraction
    if (sys.includes('parse') || sys.includes('extract') || sys.includes('product architect')) {
      const lower = prompt.toLowerCase()
      const appType = lower.includes('crm')
        ? 'crm'
        : lower.includes('marketplace')
        ? 'marketplace'
        : lower.includes('blog') || lower.includes('blogging')
        ? 'content'
        : lower.includes('ecommerce')
        ? 'ecommerce'
        : lower.includes('analytics')
        ? 'analytics'
        : 'other'

      const features = [] as string[]
      if (lower.includes('login') || lower.includes('auth')) features.push('authentication')
      if (lower.includes('contacts')) features.push('contacts')
      if (lower.includes('dashboard')) features.push('dashboard')
      if (lower.includes('payment') || lower.includes('premium')) features.push('payments')
      if (lower.includes('analytics') || lower.includes('charts')) features.push('analytics')
      if (!features.length) features.push('basic_crud')

      const roles = [] as string[]
      if (lower.includes('admin')) roles.push('admin')
      if (lower.includes('seller')) roles.push('seller')
      if (lower.includes('buyer')) roles.push('buyer')
      if (!roles.length) roles.push('user')

      const intent = {
        appType,
        primaryFeatures: features,
        userRoles: roles,
        authRequired: lower.includes('login') || lower.includes('auth') || roles.includes('admin'),
        paymentRequired: lower.includes('payment') || lower.includes('premium'),
        dataModels: roles.includes('seller') ? ['users', 'products', 'orders'] : ['users', 'items'],
        complexities: [],
        assumptions: [],
      }

      return JSON.stringify(intent)
    }

    // Design stage
    if (sys.includes('system architect') || sys.includes('convert app intent')) {
      // try to parse minimal intent from prompt
      let parsed: any = {}
      try {
        parsed = JSON.parse(prompt)
      } catch {
        parsed = { primaryFeatures: ['basic_crud'], userRoles: ['user'] }
      }

      const pages = [] as any[]
      const endpoints = [] as any[]
      const dataEntities = [] as any[]

      // basic mapping
      pages.push({ name: 'Home', purpose: 'Landing', requiredData: [] });
      pages.push({ name: 'Dashboard', purpose: 'Main app view', requiredData: parsed.primaryFeatures || [] });

      (parsed.dataModels || ['users']).forEach((m: string) => {
        dataEntities.push({ name: m, relationships: [] })
        endpoints.push({ path: `/api/${m.toLowerCase()}`, method: 'GET', purpose: `List ${m}` })
      })

      const design = {
        architecture: 'monolith',
        pageStructure: pages,
        apiEndpoints: endpoints,
        dataEntities,
        accessControl: { roles: parsed.userRoles || ['user'], rolePermissions: { user: ['read'], admin: ['read', 'write'] } },
      }

      return JSON.stringify(design)
    }

    // Schema generation
    if (sys.includes('generate database') || sys.includes('produce precise, executable schemas') || sys.includes('generate database, api, and ui schemas')) {
      // best-effort: try to parse design
      let design: any = {}
      try {
        design = JSON.parse(prompt)
      } catch {
        design = {}
      }

      // simple default tables
      const tables: any[] = [
        { name: 'users', columns: [{ name: 'id', type: 'uuid', required: true }, { name: 'email', type: 'string', required: true }], relationships: [] },
      ]

      if (prompt.toLowerCase().includes('contact') || prompt.toLowerCase().includes('contacts')) {
        tables.push({ name: 'contacts', columns: [{ name: 'id', type: 'uuid', required: true }, { name: 'name', type: 'string', required: true }, { name: 'userId', type: 'uuid', required: true }], relationships: ['users'] })
      }

      if (prompt.toLowerCase().includes('payment') || prompt.toLowerCase().includes('premium')) {
        tables.push({ name: 'payments', columns: [{ name: 'id', type: 'uuid', required: true }, { name: 'amount', type: 'decimal', required: true }, { name: 'userId', type: 'uuid', required: true }], relationships: ['users'] })
      }

      const endpoints = tables.map((t) => ({ path: `/api/${t.name}`, method: 'GET', requestSchema: {}, responseSchema: { type: 'array', items: { type: 'object' } } }))
      const uiPages = [{ route: '/dashboard', components: ['Header', 'Main'], dataSource: `GET /api/${tables[0].name}` }]

      const out = { database: { tables }, api: { endpoints }, ui: { pages: uiPages } }
      return JSON.stringify(out)
    }

    // Refinement stage: just echo back schemas or ensure id exists
    if (sys.includes('refine schemas') || sys.includes('consistency auditor')) {
      try {
        const schemas = JSON.parse(prompt)
        // ensure id columns
        schemas.database = schemas.database || { tables: [] }
        schemas.database.tables.forEach((t: any) => {
          if (!t.columns.some((c: any) => c.name === 'id')) {
            t.columns.unshift({ name: 'id', type: 'uuid', required: true })
          }
        })
        return JSON.stringify(schemas)
      } catch {
        return JSON.stringify({ database: { tables: [] }, api: { endpoints: [] }, ui: { pages: [] } })
      }
    }

    // Repair stage
    if (sys.includes('fix') || sys.includes('repair')) {
      try {
        const req = JSON.parse(prompt)
        // naive repair: if errors mention missing endpoint, add it
        const repairedSection = req.config || {}
        return JSON.stringify({ repairedSection, changes: [] })
      } catch {
        return JSON.stringify({ repairedSection: {}, changes: [] })
      }
    }

    // Fallback deterministic empty JSON
    return JSON.stringify({})
  }

  // Otherwise call real LLM
  const result = await callLLM({ model: model || DEFAULT_MODEL, max_tokens: 2000, temperature: 0.1, top_p: 0.7, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], system })
  return result.output
}

// ============================================================================
// MODE-BASED CONFIGURATION
// ============================================================================

export function getConfigsByMode(mode: 'fast' | 'balanced' | 'precise') {
  const baseConfigs = { ...STAGE_CONFIGS }

  if (mode === 'fast') {
    return {
      intent: { ...baseConfigs.intent, max_tokens: 1000, temperature: 0.3 },
      design: { ...baseConfigs.design, max_tokens: 1500, temperature: 0.2 },
      schema: { ...baseConfigs.schema, max_tokens: 3000, temperature: 0 },
      refinement: { ...baseConfigs.refinement, max_tokens: 2000, temperature: 0 },
      repair: { ...baseConfigs.repair },
    }
  }

  if (mode === 'precise') {
    return {
      intent: { ...baseConfigs.intent, max_tokens: 2000, temperature: 0.1 },
      design: { ...baseConfigs.design, max_tokens: 3500, temperature: 0.05 },
      schema: { ...baseConfigs.schema, max_tokens: 5000, temperature: 0 },
      refinement: { ...baseConfigs.refinement, max_tokens: 5000, temperature: 0 },
      repair: { ...baseConfigs.repair, max_tokens: 3500 },
    }
  }

  // balanced (default)
  return baseConfigs
}
