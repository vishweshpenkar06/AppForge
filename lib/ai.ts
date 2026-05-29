// Featherless API Configuration
const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY
const FEATHERLESS_BASE_URL = process.env.FEATHERLESS_BASE_URL || 'https://api.featherless.ai/v1'

if (!FEATHERLESS_API_KEY) {
  throw new Error('FEATHERLESS_API_KEY environment variable is required')
}

// ============================================================================
// STAGE CONFIGURATIONS
// ============================================================================

export const STAGE_CONFIGS = {
  intent: {
    model: 'Qwen/Qwen3.6-35B-A3B',
    max_tokens: 1500,
    temperature: 0.2,
  },
  design: {
    model: 'Qwen/Qwen3.6-35B-A3B',
    max_tokens: 2500,
    temperature: 0.1,
  },
  schema: {
    model: 'Qwen/Qwen3.6-35B-A3B',
    max_tokens: 4000,
    temperature: 0,
  },
  refinement: {
    model: 'Qwen/Qwen3.6-35B-A3B',
    max_tokens: 4000,
    temperature: 0,
  },
  repair: {
    model: 'Qwen/Qwen3.6-35B-A3B',
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
}

export async function callLLM(options: LLMCallOptions) {
  const startTime = Date.now()

  try {
    // Build messages array with system prompt if provided
    const messages = options.system
      ? [{ role: 'system' as const, content: options.system }, ...options.messages]
      : options.messages

    const response = await fetch(`${FEATHERLESS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FEATHERLESS_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages,
        max_tokens: options.max_tokens,
        temperature: options.temperature,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Featherless API error: ${response.status} - ${error}`)
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
