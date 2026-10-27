// LLM / API Configuration
// Supports: NVIDIA NIM (build.nvidia.com), Groq, Featherless, or any OpenAI-compatible API

// ============================================================================
// PROVIDER CONFIGURATION
// ============================================================================

type Provider = 'nvidia' | 'groq' | 'featherless'

interface ProviderConfig {
  baseUrl: string
  apiKey: string
  defaultModel: string
  fallbackModel: string
}

const PROVIDERS: Record<Provider, ProviderConfig> = {
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKey: process.env.NVIDIA_API_KEY || '',
    defaultModel: 'nvidia/llama-3.3-nemotron-super-49b-v1',
    fallbackModel: 'deepseek-ai/deepseek-v4-pro',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY || '',
    // llama-3.3-70b-versatile was retired by Groq; gpt-oss-120b is the current
    // long-context model and emits the large structured JSON these stages need.
    defaultModel: 'openai/gpt-oss-120b',
    fallbackModel: 'openai/gpt-oss-20b',
  },
  featherless: {
    baseUrl: 'https://api.featherless.ai/v1',
    apiKey: process.env.FEATHERLESS_API_KEY || '',
    defaultModel: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
    fallbackModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
  },
}

/**
 * Resolve the active provider from LLM_PROVIDER env var.
 * Default: try NVIDIA first, fall back to Groq.
 */
function resolveProvider(): { primary: Provider; fallback: Provider | null } {
  const requested = (process.env.LLM_PROVIDER || '').toLowerCase().trim()

  if (requested === 'nvidia' || requested === 'nim') return { primary: 'nvidia', fallback: 'groq' }
  if (requested === 'groq') return { primary: 'groq', fallback: 'nvidia' }
  if (requested === 'featherless') return { primary: 'featherless', fallback: null }

  // Default: NVIDIA first, Groq fallback
  return { primary: 'nvidia', fallback: 'groq' }
}

const { primary: ACTIVE_PROVIDER, fallback: FALLBACK_PROVIDER } = resolveProvider()

function getProviderConfig(provider: Provider): ProviderConfig {
  return PROVIDERS[provider]
}

// Allow running in deterministic test mode without an external API key.
// Missing keys are reported by /api/health and fail the individual LLM call,
// rather than crashing every route that imports this module.
const hasAnyKey = Object.values(PROVIDERS).some((p) => p.apiKey)
if (!hasAnyKey && process.env.DETERMINISTIC_LLM !== '1') {
  console.warn(
    '[ai] No LLM provider key set. Set at least one of: NVIDIA_API_KEY, GROQ_API_KEY, FEATHERLESS_API_KEY — or use DETERMINISTIC_LLM=1.'
  )
}

// ============================================================================
// STAGE CONFIGURATIONS
// ============================================================================

export const STAGE_CONFIGS = {
  // Budgets are sized to what each stage actually emits, not padded: Groq counts
  // prompt + max_tokens against the per-minute quota, so an oversized reservation
  // rate-limits the next stage and sends it into the keyword fallback.
  intent: {
    model: process.env.LLM_MODEL || getProviderConfig(ACTIVE_PROVIDER).defaultModel,
    max_tokens: 2500,
    temperature: 0.2,
  },
  design: {
    model: process.env.LLM_MODEL || getProviderConfig(ACTIVE_PROVIDER).defaultModel,
    max_tokens: 3000,
    temperature: 0.1,
  },
  schema: {
    model: process.env.LLM_MODEL || getProviderConfig(ACTIVE_PROVIDER).defaultModel,
    max_tokens: 4000,
    temperature: 0,
  },
  refinement: {
    model: process.env.LLM_MODEL || getProviderConfig(ACTIVE_PROVIDER).defaultModel,
    max_tokens: 4000,
    temperature: 0,
  },
  repair: {
    model: process.env.LLM_MODEL || getProviderConfig(ACTIVE_PROVIDER).defaultModel,
    max_tokens: 3000,
    temperature: 0,
  },
}

// ============================================================================
// JSON EXTRACTION UTILITY
// ============================================================================

/**
 * Recover JSON that was cut off mid-value by a token budget.
 * Drops the trailing incomplete pair and closes the containers left open, so a
 * truncated response still yields the fields the model did finish instead of
 * forcing the caller into its keyword fallback.
 */
function salvageJSON(text: string): unknown | null {
  const root = text.search(/[{\[]/)
  if (root === -1) return null

  const stack: Array<{ open: string; start: number; lastComma: number }> = []
  let inString = false
  let escaped = false

  for (let i = root; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{' || ch === '[') stack.push({ open: ch, start: i, lastComma: -1 })
    else if (ch === '}' || ch === ']') {
      stack.pop()
      // Balanced back to the top level: the JSON was complete, prose simply followed it.
      if (!stack.length) {
        try {
          return JSON.parse(text.slice(root, i + 1))
        } catch {
          return null
        }
      }
    } else if (ch === ',' && stack.length) stack[stack.length - 1].lastComma = i
  }

  if (!stack.length) return null

  const closersAt = (depth: number) =>
    stack
      .slice(0, depth + 1)
      .reverse()
      .map((frame) => (frame.open === '{' ? '}' : ']'))
      .join('')

  // Truncation landed on a value boundary: only trailing punctuation is missing.
  const rough = text.slice(root).replace(/[\s,]+$/, '')
  try {
    return JSON.parse(rough + closersAt(stack.length - 1))
  } catch {
    // fall through to dropping the incomplete value
  }

  // Cut at the last comma of the deepest container that has one.
  for (let i = stack.length - 1; i >= 0; i--) {
    const frame = stack[i]
    if (frame.lastComma > frame.start) {
      try {
        return JSON.parse(text.slice(root, frame.lastComma) + closersAt(i))
      } catch {
        break
      }
    }
  }

  return null
}

function parseLenient<T>(candidate: string): T | null {
  for (const attempt of [candidate, candidate.replace(/,\s*([\]}])/g, '$1')]) {
    try {
      return JSON.parse(attempt) as T
    } catch {
      // fall through to salvage
    }
    const salvaged = salvageJSON(attempt)
    if (salvaged !== null) return salvaged as T
  }
  return null
}

/**
 * Extract valid JSON from LLM output, handling markdown fences, surrounding
 * prose, trailing commas and truncation.
 */
export function extractJSON<T = any>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const fromBracket = text.slice(Math.max(text.search(/[{\[]/), 0))
  const candidates = [text.trim(), fenced?.[1]?.trim(), fromBracket]

  for (const candidate of candidates) {
    if (!candidate) continue
    const parsed = parseLenient<T>(candidate)
    if (parsed !== null) return parsed
  }

  return null
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

/**
 * Check if an error indicates rate limiting or transient failure worth retrying.
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return msg.includes('429') || msg.includes('rate limit') || msg.includes('timeout') || msg.includes('econnreset')
}

/**
 * Rate limit errors carry the wait the server asked for, so retries land after
 * the quota window instead of burning attempts with a fixed backoff.
 */
class RateLimitError extends Error {
  constructor(
    message: string,
    readonly retryAfterMs: number
  ) {
    super(message)
  }
}

/**
 * Core LLM call with provider-aware routing, retry with backoff, and fallback.
 * Retries the primary provider up to 2 times with exponential backoff before
 * falling back to the secondary provider.
 */
export async function callLLM(options: LLMCallOptions) {
  const startTime = Date.now()
  console.log(`[LLM] Provider: ${ACTIVE_PROVIDER}, Model: ${options.model}`)

  async function callProvider(provider: Provider, modelOverride?: string) {
    const config = getProviderConfig(provider)
    if (!config.apiKey) throw new Error(`No API key configured for provider '${provider}'`)

    const model = modelOverride || options.model
    const messages = options.system
      ? [{ role: 'system' as const, content: options.system }, ...options.messages]
      : options.messages

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    let response: Response
    try {
      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options.max_tokens,
          temperature: options.temperature,
          top_p: options.top_p ?? 0.7,
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const errorText = await response.text()
      const message = `LLM API error [${provider}] (${response.status}): ${errorText}`
      if (response.status === 429) {
        const headerSeconds = Number(response.headers.get('retry-after'))
        const body = /try again in ([\d.]+)\s*(ms|s)/i.exec(errorText)
        const bodyMs = body ? Number(body[1]) * (body[2].toLowerCase() === 'ms' ? 1 : 1000) : 0
        throw new RateLimitError(message, headerSeconds > 0 ? headerSeconds * 1000 : bodyMs || 3000)
      }
      throw new Error(message)
    }

    const data = await response.json()
    const latencyMs = Date.now() - startTime

    const content = data.choices?.[0]?.message?.content
    if (content == null) {
      throw new Error(`LLM API returned empty choices [${provider}]`)
    }

    return {
      success: true,
      output: content,
      latencyMs,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      provider,
      model,
    }
  }

  const MAX_PRIMARY_RETRIES = 2

  // Try primary provider with retry + backoff
  let lastPrimaryError: unknown
  for (let attempt = 0; attempt <= MAX_PRIMARY_RETRIES; attempt++) {
    try {
      return await callProvider(ACTIVE_PROVIDER)
    } catch (err) {
      lastPrimaryError = err
      if (attempt < MAX_PRIMARY_RETRIES && isRetryableError(err)) {
        // Wait what the server asked for; a shorter guess just wastes an attempt.
        const delay =
          err instanceof RateLimitError
            ? Math.min(err.retryAfterMs + 250, 8000)
            : Math.min(1000 * 2 ** attempt, 8000)
        console.warn(`[LLM] Primary '${ACTIVE_PROVIDER}' attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
        await new Promise((r) => setTimeout(r, delay))
      } else {
        break
      }
    }
  }

  // Rate limits are often per model, so the lighter model has its own quota window.
  const primaryConfig = getProviderConfig(ACTIVE_PROVIDER)
  if (lastPrimaryError instanceof RateLimitError && primaryConfig.fallbackModel !== options.model) {
    try {
      console.warn(`[LLM] Rate limited on '${options.model}', trying '${primaryConfig.fallbackModel}'`)
      return await callProvider(ACTIVE_PROVIDER, primaryConfig.fallbackModel)
    } catch (err) {
      lastPrimaryError = err
    }
  }

  // Primary exhausted — try fallback if available
  if (FALLBACK_PROVIDER) {
    try {
      console.warn(`[LLM] Primary '${ACTIVE_PROVIDER}' exhausted, trying fallback '${FALLBACK_PROVIDER}'`)
      // Fallback providers use their own model names; the primary's model id is usually invalid there.
      return await callProvider(FALLBACK_PROVIDER, getProviderConfig(FALLBACK_PROVIDER).defaultModel)
    } catch (fallbackError) {
      const latencyMs = Date.now() - startTime
      const err = lastPrimaryError instanceof Error ? lastPrimaryError : new Error('Unknown error')
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      err.message = `LLM call failed (primary: ${ACTIVE_PROVIDER}, fallback: ${FALLBACK_PROVIDER} also failed): ${fallbackMessage}; primary error: ${err.message} (${latencyMs}ms)`
      throw err
    }
  }

  // No fallback — throw primary error
  const latencyMs = Date.now() - startTime
  const err = lastPrimaryError instanceof Error ? lastPrimaryError : new Error('Unknown error')
  err.message = `LLM call failed [${ACTIVE_PROVIDER}]: ${err.message} (${latencyMs}ms)`
  throw err
}

/**
 * Wrapper returning raw assistant text. Supports deterministic stub when
 * `DETERMINISTIC_LLM` env var is set to `1`.
 */
export interface LLMTextResult {
  text: string
  inputTokens: number
  outputTokens: number
}

export async function callLLMText({ system, prompt, model, maxTokens }: { system: string; prompt: string; model: string; maxTokens?: number }): Promise<LLMTextResult> {
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

      return { text: JSON.stringify(intent), inputTokens: 0, outputTokens: 0 }
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

      return { text: JSON.stringify(design), inputTokens: 0, outputTokens: 0 }
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
      return { text: JSON.stringify(out), inputTokens: 0, outputTokens: 0 }
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
        return { text: JSON.stringify(schemas), inputTokens: 0, outputTokens: 0 }
      } catch {
        return { text: JSON.stringify({ database: { tables: [] }, api: { endpoints: [] }, ui: { pages: [] } }), inputTokens: 0, outputTokens: 0 }
      }
    }

    // Repair stage
    if (sys.includes('fix') || sys.includes('repair')) {
      try {
        const req = JSON.parse(prompt)
        // naive repair: if errors mention missing endpoint, add it
        const repairedSection = req.config || {}
        return { text: JSON.stringify({ repairedSection, changes: [] }), inputTokens: 0, outputTokens: 0 }
      } catch {
        return { text: JSON.stringify({ repairedSection: {}, changes: [] }), inputTokens: 0, outputTokens: 0 }
      }
    }

    // Fallback deterministic empty JSON
    return { text: JSON.stringify({}), inputTokens: 0, outputTokens: 0 }
  }

  // Otherwise call real LLM
  const result = await callLLM({ model: model || getProviderConfig(ACTIVE_PROVIDER).defaultModel, max_tokens: maxTokens || 2000, temperature: 0.1, top_p: 0.7, messages: [{ role: 'user', content: prompt }], system })
  return { text: result.output, inputTokens: result.inputTokens, outputTokens: result.outputTokens }
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

// ============================================================================
// PROVIDER INFO (for health check / logging)
// ============================================================================

export function getActiveProviderInfo() {
  return {
    active: ACTIVE_PROVIDER,
    fallback: FALLBACK_PROVIDER,
    model: process.env.LLM_MODEL || getProviderConfig(ACTIVE_PROVIDER).defaultModel,
    baseUrl: getProviderConfig(ACTIVE_PROVIDER).baseUrl,
    deterministic: process.env.DETERMINISTIC_LLM === '1',
  }
}
