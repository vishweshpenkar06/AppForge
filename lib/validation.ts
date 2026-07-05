import { AppConfig, ValidationError, ConsistencyCheck } from './schemas'

// ============================================================================
// CONSISTENCY CHECKS
// ============================================================================

export function validateCrossLayerConsistency(config: Partial<AppConfig>): ConsistencyCheck {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Check 1: Every UI form field that maps to an API must reference a real endpoint
  if (config.ui?.pages) {
    config.ui.pages.forEach((page) => {
      page.components.forEach((component) => {
        component.fields?.forEach((field) => {
          if (field.maps_to_api) {
            const endpoint = config.api?.endpoints.find(
              (e) => e.route === field.maps_to_api
            )
            if (!endpoint) {
              errors.push({
                type: 'consistency_error',
                field: `ui.pages.${page.name}.components.fields.${field.name}`,
                message: `Field maps to API route '${field.maps_to_api}' which does not exist`,
              })
            }
          }
        })
      })
    })
  }

  // Check 2: Every API endpoint.requestBody field must exist in some database table
  if (config.api?.endpoints) {
    config.api.endpoints.forEach((endpoint) => {
      if (endpoint.requestBody) {
        Object.keys(endpoint.requestBody).forEach((fieldName) => {
          const found = config.database?.tables.some((table) =>
            table.columns.some((col) => col.name === fieldName)
          )
          if (!found && fieldName !== 'id' && fieldName !== 'userId') {
            warnings.push(
              `API endpoint ${endpoint.route} references field '${fieldName}' not found in database tables`
            )
          }
        })
      }
    })
  }

  // Check 3: Every auth role referenced in businessLogic must be defined
  if (config.businessLogic && config.auth) {
    const definedRoles = config.auth.roles.map((r) => r.name)
    config.businessLogic.forEach((rule) => {
      rule.affected_roles.forEach((role) => {
        if (!definedRoles.includes(role)) {
          errors.push({
            type: 'consistency_error',
            field: `businessLogic.rules.affected_roles`,
            message: `Role '${role}' in business logic is not defined in auth.roles`,
          })
        }
      })
    })
  }

  // Check 4: Every foreign key table reference must exist
  if (config.database?.tables) {
    config.database.tables.forEach((table) => {
      table.columns.forEach((col) => {
        if (col.foreign_key) {
          const refTable = config.database?.tables.find((t) => t.name === col.foreign_key!.table)
          if (!refTable) {
            errors.push({
              type: 'consistency_error',
              field: `database.tables.${table.name}.columns.${col.name}`,
              message: `Foreign key references non-existent table '${col.foreign_key.table}'`,
            })
          }
        }
      })
    })
  }

  // Check 5: Every UI page access role must be defined
  if (config.ui?.pages && config.auth) {
    const definedRoles = config.auth.roles.map((r) => r.name)
    config.ui.pages.forEach((page) => {
      page.access.forEach((role) => {
        if (!definedRoles.includes(role)) {
          errors.push({
            type: 'consistency_error',
            field: `ui.pages.${page.name}.access`,
            message: `Page access role '${role}' is not defined in auth.roles`,
          })
        }
      })
    })
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

// ============================================================================
// DETECT COMMON ISSUES
// ============================================================================

export interface PromptAnalysis {
  confidence: number
  needsClarification: boolean
  clarificationQuestions?: string[]
  detectedIssues: string[]
}

export function analyzePromptClarity(prompt: string): PromptAnalysis {
  const issues: string[] = []
  let confidence = 1.0
  const lower = prompt.toLowerCase()

  // Check length — only penalize very short prompts
  if (prompt.length < 10) {
    issues.push('Prompt is very short and may lack detail')
    confidence -= 0.3
  }

  // Check for vague keywords (only penalize if multiple vague words)
  const vagueKeywords = ['something', 'anything', 'cool', 'nice', 'good']
  const vagueMatches = vagueKeywords.filter((kw) => lower.includes(kw))
  if (vagueMatches.length >= 2) {
    issues.push('Prompt uses vague language')
    confidence -= 0.2
  }

  // Check for app-type keywords — if present, the prompt is clear enough
  const hasAppType = /\b(crm|erp|lms|blog|marketplace|ecommerce|saas|dashboard|tracker|portal|app|platform|system|tool|manager)\b/.test(lower)
  const hasActionWord = /\b(build|create|make|develop|design|need|want)\b/.test(lower)

  // Only penalize for missing features if there's no app type keyword
  if (!hasAppType && !hasActionWord) {
    issues.push('Prompt does not clearly describe what to build')
    confidence -= 0.15
  }

  // Only penalize for missing roles if no app type keyword
  if (!hasAppType && !/(user|role|admin|customer|team|group)/i.test(lower)) {
    issues.push('Prompt does not mention user types or roles')
    confidence -= 0.1
  }

  // ── Conflict Detection ──────────────────────────────────────────────

  // Simple vs Advanced conflict
  const hasSimple = /\b(simple|minimal|basic|easy|lightweight)\b/.test(lower)
  const hasAdvanced = /\b(advanced|complex|sophisticated|intelligent|AI|ML|machine learning|blockchain|IoT|real-time)\b/.test(lower)
  if (hasSimple && hasAdvanced) {
    issues.push('Conflicting requirements: "simple/minimal" vs "advanced/complex" features')
    confidence -= 0.25
  }

  // Offline vs Real-time conflict
  const hasOffline = /\b(offline|no internet|without connection)\b/.test(lower)
  const hasRealtime = /\b(real-time|realtime|live|websocket|streaming)\b/.test(lower)
  if (hasOffline && hasRealtime) {
    issues.push('Conflicting requirements: "offline" vs "real-time" capabilities')
    confidence -= 0.2
  }

  // Scalability conflict
  const hasScale = /\b(1M|million|millions|massive|scale|high traffic)\b/.test(lower)
  const hasSimpleInfra = /\b(single|one) (database|server|instance|db)\b/.test(lower)
  if (hasScale && hasSimpleInfra) {
    issues.push('Conflicting requirements: high scalability with single database instance')
    confidence -= 0.15
  }

  // Missing essential info
  if (prompt.length < 50 && !/(build|create|make|develop)/i.test(prompt)) {
    issues.push('Prompt may not be a build request')
    confidence -= 0.1
  }

  const needsClarification = confidence < 0.4
  const clarificationQuestions = needsClarification
    ? [
        'What is the primary purpose of this application?',
        'Who are the main users and what are their key needs?',
        'What are the 3-5 most important features?',
        'What data needs to be stored and managed?',
      ]
    : undefined

  return {
    confidence: Math.max(0, Math.min(1, confidence)),
    needsClarification,
    clarificationQuestions,
    detectedIssues: issues,
  }
}

// ============================================================================
// ERROR CATEGORIZATION
// ============================================================================

export type ErrorCategory = 'json_parse_error' | 'schema_validation_error' | 'consistency_error'

export function categorizeError(error: any): ErrorCategory {
  const message = String(error.message || error)

  if (message.includes('JSON') || message.includes('parse')) {
    return 'json_parse_error'
  }
  if (message.includes('validation') || message.includes('required')) {
    return 'schema_validation_error'
  }
  return 'consistency_error'
}

// ============================================================================
// REPAIR DIFFICULTY ASSESSMENT
// ============================================================================

export function assessRepairDifficulty(errors: ValidationError[]): {
  difficulty: 'easy' | 'moderate' | 'hard'
  recommendedApproach: string
  isAutoRepairFeasible: boolean
} {
  const errorTypes = new Set(errors.map((e) => e.type))
  const errorCount = errors.length

  let difficulty: 'easy' | 'moderate' | 'hard' = 'easy'
  let isAutoRepairFeasible = true
  let recommendedApproach = ''

  if (errorCount === 0) {
    recommendedApproach = 'No repairs needed'
  } else if (errorCount <= 2 && errorTypes.has('consistency_error')) {
    recommendedApproach = 'Minor reference fix - update field names or add missing references'
  } else if (errorCount <= 3) {
    recommendedApproach = 'Multiple issues found - repair targeted sections'
  } else {
    difficulty = 'hard'
    isAutoRepairFeasible = false
    recommendedApproach = 'Too many errors - consider regenerating from intent stage'
  }

  // Consistency errors in complex relationships are hard to auto-fix
  const complexConsistencyErrors = errors.filter((e) =>
    e.field?.includes('foreignKey') || e.field?.includes('relationship')
  )
  if (complexConsistencyErrors.length > 1) {
    difficulty = 'hard'
    isAutoRepairFeasible = false
  }

  return {
    difficulty,
    recommendedApproach,
    isAutoRepairFeasible,
  }
}

// ============================================================================
// APP CONFIG VALIDATION
// ============================================================================

export interface AppConfigValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
}

export function validateAppConfig(config: any): AppConfigValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  if (!config) {
    errors.push({ type: 'schema_error', message: 'Config is null or undefined' })
    return { valid: false, errors, warnings }
  }

  if (!config.meta && !config.metadata) {
    warnings.push('Config is missing metadata')
  }

  if (!config.database?.tables || config.database.tables.length === 0) {
    errors.push({ type: 'schema_error', field: 'database.tables', message: 'No database tables defined' })
  }

  if (!config.api?.endpoints && !config.api?.routes) {
    errors.push({ type: 'schema_error', field: 'api.endpoints', message: 'No API endpoints defined' })
  }

  if (!config.ui?.pages || config.ui.pages.length === 0) {
    warnings.push('No UI pages defined')
  }

  const crossLayer = validateCrossLayerConsistency(config)
  errors.push(...crossLayer.errors)
  if (crossLayer.warnings) {
    warnings.push(...crossLayer.warnings)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function repairAppConfig(
  config: any,
  errors: ValidationError[]
): { repairedConfig: any; changes: Array<{ field: string; before: any; after: any }> } {
  const changes: Array<{ field: string; before: any; after: any }> = []
  const repaired = JSON.parse(JSON.stringify(config))

  for (const error of errors) {
    if (error.field?.includes('foreign_key') || error.field?.includes('foreignKey')) {
      const match = error.field.match(/tables\.(\w+)\.columns\.(\w+)/)
      if (match) {
        const [, tableName, colName] = match
        const table = repaired.database?.tables?.find((t: any) => t.name === tableName)
        const col = table?.columns?.find((c: any) => c.name === colName)
        if (col?.foreign_key) {
          changes.push({ field: error.field, before: col.foreign_key, after: null })
          delete col.foreign_key
        }
      }
    }
  }

  return { repairedConfig: repaired, changes }
}
