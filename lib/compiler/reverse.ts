/**
 * Reverse compiler: analyze a GitHub repo and produce an AppConfig-shaped summary.
 *
 * This is a one-way flow (repo → spec). It does NOT touch any forward-pipeline
 * stages in lib/compiler/core.ts.
 */

import { callLLMText, extractJSON } from '@/lib/ai'

export interface ReverseCompileResult {
  config: Record<string, unknown>
  inputTokens: number
  outputTokens: number
  latencyMs: number
}

const SYSTEM_PROMPT = `You are a senior software architect analyzing an existing codebase.
Given the file tree and contents of key files from a GitHub repository, produce a
JSON object describing the application's architecture in AppForge AppConfig format.

Return ONLY valid JSON (no markdown fences, no commentary). The shape must be:

{
  "metadata": {
    "name": "<app name derived from package.json name or repo>",
    "description": "<one-paragraph summary of what the app does>"
  },
  "intent": {
    "appType": "<crud|saas|ecommerce|marketplace|crm|content|analytics|social|other>",
    "primaryFeatures": ["<feature 1>", "<feature 2>", ...],
    "userRoles": ["<role 1>", "<role 2>", ...],
    "authRequired": <true|false>,
    "paymentRequired": <true|false>,
    "dataModels": ["<entity 1>", "<entity 2>", ...]
  },
  "database": {
    "tables": [
      {
        "name": "<TableName>",
        "columns": [
          { "name": "<column>", "type": "<uuid|text|integer|boolean|timestamptz|jsonb|decimal|date>", "required": <true|false> }
        ]
      }
    ]
  },
  "api": {
    "routes": [
      { "method": "<GET|POST|PUT|DELETE|PATCH>", "path": "</api/path>", "description": "<what it does>" }
    ]
  },
  "ui": {
    "pages": [
      { "route": "</page-route>", "name": "<PageName>", "components": ["<Component1>", "<Component2>"] }
    ]
  },
  "auth": {
    "provider": "<clerk|nextauth|custom|none>",
    "roles": [
      { "name": "<role>", "permissions": ["<read|create|update|delete>"] }
    ]
  }
}

Guidelines:
- Infer the app type from the overall structure and dependencies.
- List real database models/entities you find (Prisma models, TypeORM entities, Mongoose schemas, SQL files, etc.).
- List real API routes/endpoints you find in route files.
- List real pages/routes you find in the pages or app directory.
- Detect auth from middleware, auth config, or auth-related imports.
- Be accurate — only include what you can actually see in the provided files.
- If a field cannot be determined, use reasonable defaults (empty array, "other", etc.).`

export async function reverseCompile(repoUrl: string, fileTree: string, fileContents: string): Promise<ReverseCompileResult> {
  const startTime = Date.now()

  const prompt = `Repository: ${repoUrl}

## File Tree
${fileTree}

## Key File Contents
${fileContents}

Analyze this codebase and return the AppConfig JSON.`

  const result = await callLLMText({
    system: SYSTEM_PROMPT,
    prompt,
    model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
    maxTokens: 4096,
  })

  let config: Record<string, unknown>
  try {
    config = extractJSON<Record<string, unknown>>(result.text)
  } catch {
    // If LLM output is not valid JSON, wrap it in a minimal config
    config = {
      metadata: { name: 'Unknown Repo', description: 'Could not parse reverse-compile output.' },
      intent: { appType: 'other', primaryFeatures: [], userRoles: ['user'], authRequired: false, paymentRequired: false, dataModels: [] },
      database: { tables: [] },
      api: { routes: [] },
      ui: { pages: [] },
      auth: { provider: 'none', roles: [] },
    }
  }

  // Ensure required top-level keys exist
  config.metadata = config.metadata ?? { name: 'Unknown', description: '' }
  config.intent = config.intent ?? { appType: 'other', primaryFeatures: [], userRoles: [], authRequired: false, paymentRequired: false, dataModels: [] }
  config.database = config.database ?? { tables: [] }
  config.api = config.api ?? { routes: [] }
  config.ui = config.ui ?? { pages: [] }
  config.auth = config.auth ?? { provider: 'none', roles: [] }

  return {
    config,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: Date.now() - startTime,
  }
}
