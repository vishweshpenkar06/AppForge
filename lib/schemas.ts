import { z } from 'zod'

// ============================================================================
// INTENT EXTRACTION OUTPUT
// ============================================================================

export const IntentJSONSchema = z.object({
  appType: z.string().describe('Type of application (CRM, SaaS, e-commerce, etc.)'),
  description: z.string().describe('Brief description of the app'),
  features: z.array(z.string()).describe('List of key features'),
  userRoles: z.array(z.string()).describe('User roles/personas in the system'),
  entities: z.array(z.string()).describe('Core data entities'),
  integrations: z.array(z.string()).optional().describe('Third-party integrations'),
  constraints: z.array(z.string()).optional().describe('Technical or business constraints'),
  assumptions: z.array(z.string()).optional().describe('Assumptions made about requirements'),
  confidenceScore: z.number().min(0).max(1).optional().describe('Confidence score (0-1)'),
})

export type IntentJSON = z.infer<typeof IntentJSONSchema>

// ============================================================================
// ARCHITECTURE BLUEPRINT
// ============================================================================

export const ArchitectureBlueprintSchema = z.object({
  pages: z.array(
    z.object({
      name: z.string(),
      route: z.string(),
      description: z.string(),
      accessibleBy: z.array(z.string()),
    })
  ),
  apiGroups: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      endpoints: z.array(z.string()),
    })
  ),
  dbTables: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
      relatedTables: z.array(z.string()).optional(),
    })
  ),
  authStrategy: z.string().describe('Auth provider and strategy'),
  rolePermissions: z.record(z.array(z.string())).describe('Role to permissions mapping'),
})

export type ArchitectureBlueprint = z.infer<typeof ArchitectureBlueprintSchema>

// ============================================================================
// FINAL APP CONFIG SCHEMA
// ============================================================================

// UI Schema
export const UIPageComponentSchema = z.object({
  type: z.enum(['form', 'table', 'card', 'chart', 'nav', 'list']),
  fields: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum([
          'text',
          'email',
          'password',
          'select',
          'checkbox',
          'date',
          'number',
          'textarea',
        ]),
        required: z.boolean(),
        maps_to_api: z.string().optional(),
      })
    )
    .optional(),
})

export const UIPageSchema = z.object({
  id: z.string(),
  name: z.string(),
  route: z.string(),
  layout: z.string(),
  components: z.array(UIPageComponentSchema),
  access: z.array(z.string()),
})

// API Schema
export const APIEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  route: z.string(),
  description: z.string(),
  requestBody: z.record(z.object({ type: z.string(), required: z.boolean() })).optional(),
  response: z.record(z.string()),
  auth_required: z.boolean(),
  roles_allowed: z.array(z.string()),
})

// Database Schema
export const ColumnSchema = z.object({
  name: z.string(),
  type: z.enum([
    'uuid',
    'text',
    'integer',
    'boolean',
    'timestamptz',
    'jsonb',
    'decimal',
    'date',
  ]),
  primary_key: z.boolean().optional(),
  foreign_key: z
    .object({
      table: z.string(),
      column: z.string(),
    })
    .optional(),
  nullable: z.boolean(),
  default: z.string().optional(),
})

export const TableSchema = z.object({
  name: z.string(),
  columns: z.array(ColumnSchema),
})

// Auth Schema
export const AuthRoleSchema = z.object({
  name: z.string(),
  permissions: z.array(z.string()),
})

export const AuthConfigSchema = z.object({
  provider: z.string(),
  roles: z.array(AuthRoleSchema),
  session_strategy: z.string(),
})

// Business Logic
export const BusinessLogicRuleSchema = z.object({
  rule: z.string(),
  condition: z.string(),
  action: z.string(),
  affected_roles: z.array(z.string()),
})

// Complete AppConfig
export const AppConfigMetaSchema = z.object({
  appName: z.string(),
  description: z.string(),
  version: z.string().default('1.0'),
  generatedAt: z.string(),
  assumptions: z.array(z.string()),
})

export const AppConfigSchema = z.object({
  meta: AppConfigMetaSchema,
  ui: z.object({
    pages: z.array(UIPageSchema),
  }),
  api: z.object({
    endpoints: z.array(APIEndpointSchema),
  }),
  database: z.object({
    tables: z.array(TableSchema),
  }),
  auth: AuthConfigSchema,
  businessLogic: z.array(BusinessLogicRuleSchema).optional(),
})

export type AppConfig = z.infer<typeof AppConfigSchema>
export type UIPage = z.infer<typeof UIPageSchema>
export type APIEndpoint = z.infer<typeof APIEndpointSchema>
export type Table = z.infer<typeof TableSchema>
export type AuthRole = z.infer<typeof AuthRoleSchema>
export type BusinessLogicRule = z.infer<typeof BusinessLogicRuleSchema>

// ============================================================================
// VALIDATION & ERROR TYPES
// ============================================================================

export const ValidationErrorSchema = z.object({
  type: z.enum(['json_error', 'schema_error', 'consistency_error']),
  field: z.string().optional(),
  message: z.string(),
  context: z.record(z.any()).optional(),
})

export type ValidationError = z.infer<typeof ValidationErrorSchema>

export const ConsistencyCheckSchema = z.object({
  passed: z.boolean(),
  errors: z.array(ValidationErrorSchema),
  warnings: z.array(z.string()).optional(),
})

export type ConsistencyCheck = z.infer<typeof ConsistencyCheckSchema>

// ============================================================================
// REPAIR AGENT INPUT/OUTPUT
// ============================================================================

export const RepairRequestSchema = z.object({
  originalConfig: AppConfigSchema.partial(),
  errors: z.array(ValidationErrorSchema),
  brokenSection: z.string(),
})

export type RepairRequest = z.infer<typeof RepairRequestSchema>

export const RepairResponseSchema = z.object({
  repairedSection: z.record(z.any()),
  changes: z.array(
    z.object({
      field: z.string(),
      before: z.any().optional(),
      after: z.any(),
    })
  ),
})

export type RepairResponse = z.infer<typeof RepairResponseSchema>

// ============================================================================
// GENERATION JOB
// ============================================================================

export const GenerationJobSchema = z.object({
  id: z.string(),
  userId: z.string(),
  prompt: z.string(),
  mode: z.enum(['fast', 'balanced', 'precise']).default('balanced'),
  status: z.enum(['pending', 'running', 'success', 'failed']),
  currentStage: z.enum(['intent', 'design', 'schema', 'validation', 'repair', 'complete']),
  error_message: z.string().optional(),
  totalLatencyMs: z.number().optional(),
  retryCount: z.number().default(0),
  createdAt: z.date(),
  completedAt: z.date().optional(),
})

export type GenerationJob = z.infer<typeof GenerationJobSchema>
