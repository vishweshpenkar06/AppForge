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

  // Check length
  if (prompt.length < 20) {
    issues.push('Prompt is very short and may lack detail')
    confidence -= 0.3
  }

  // Check for vague keywords
  const vagueKeywords = ['something', 'anything', 'cool', 'nice', 'good', 'basic', 'simple']
  const vagueMatches = vagueKeywords.filter((kw) => prompt.toLowerCase().includes(kw))
  if (vagueMatches.length > 2) {
    issues.push('Prompt uses vague language')
    confidence -= 0.2
  }

  // Check for feature count
  const featureKeywords = /features?|functionality|can (?:do|perform)|should (?:be able to|support)/gi
  if (!featureKeywords.test(prompt)) {
    issues.push('Prompt does not clearly describe features')
    confidence -= 0.15
  }

  // Check for user/role mentions
  if (!/(user|role|admin|customer|team|group)/i.test(prompt)) {
    issues.push('Prompt does not mention user types or roles')
    confidence -= 0.1
  }

  const needsClarification = confidence < 0.6
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
