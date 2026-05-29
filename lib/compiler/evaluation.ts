/**
 * AppForge Evaluation Framework
 * Tests system reliability with real product prompts and edge cases
 */

import {
  extractIntent,
  designSystem,
  generateSchemas,
  refineSchemas,
  validateAndRepair,
  checkExecutability,
} from './core'

// ============================================================================
// TEST DATASET
// ============================================================================

export const TEST_CASES = {
  realProducts: [
    {
      id: 'crm-basic',
      name: 'CRM System',
      prompt:
        'Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.',
      expectedType: 'crm',
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      prompt:
        'Create a marketplace where sellers can list products, buyers can search and purchase. Include reviews, ratings, and seller analytics.',
      expectedType: 'marketplace',
    },
    {
      id: 'blog-platform',
      name: 'Blog Platform',
      prompt: 'Build a blogging platform with user authentication, post creation, comments, categories, and search functionality.',
      expectedType: 'content',
    },
    {
      id: 'project-tracker',
      name: 'Project Tracker',
      prompt:
        'Create a project management tool with tasks, timelines, team collaboration, and progress tracking. Support real-time updates.',
      expectedType: 'saas',
    },
    {
      id: 'social-feed',
      name: 'Social Feed',
      prompt:
        'Build a social network with user profiles, posts, likes, comments, follows, and a home feed. Support notifications.',
      expectedType: 'social',
    },
    {
      id: 'ecommerce-store',
      name: 'E-Commerce Store',
      prompt: 'Create an online store with product catalog, shopping cart, checkout, payment processing, and order history.',
      expectedType: 'ecommerce',
    },
    {
      id: 'analytics-dashboard',
      name: 'Analytics Dashboard',
      prompt: 'Build an analytics dashboard that tracks user behavior, displays charts, allows filtering, and generates reports.',
      expectedType: 'analytics',
    },
    {
      id: 'saas-app',
      name: 'SaaS App',
      prompt:
        'Create a subscription-based SaaS tool for team collaboration. Include user roles (admin, member), workspace management, and billing.',
      expectedType: 'saas',
    },
    {
      id: 'health-tracker',
      name: 'Health Tracker',
      prompt:
        'Build a fitness tracking app with workout logging, progress charts, social sharing, and personalized recommendations based on activity.',
      expectedType: 'other',
    },
    {
      id: 'booking-system',
      name: 'Booking System',
      prompt:
        'Create a booking platform for services (salon, hotel, consulting). Include availability, payments, confirmations, and customer history.',
      expectedType: 'saas',
    },
  ],

  edgeCases: [
    {
      id: 'vague-prompt',
      name: 'Vague Requirements',
      prompt: 'Build an app.',
      expectedType: 'other',
      shouldAskClarification: true,
    },
    {
      id: 'conflicting-requirements',
      name: 'Conflicting Requirements',
      prompt:
        'Build a simple app with minimal features but also with advanced AI capabilities, real-time collaboration, and complex payment workflows.',
      expectedType: 'other',
      shouldDetectConflict: true,
    },
    {
      id: 'underspecified',
      name: 'Underspecified',
      prompt: 'Create an app with users, posts, and comments.',
      expectedType: 'content',
      shouldMakeAssumptions: true,
    },
    {
      id: 'overly-complex',
      name: 'Overly Complex',
      prompt:
        'Build a system that combines CRM, marketplace, SaaS, social network, and analytics. Include AI recommendations, blockchain, and IoT integration.',
      expectedType: 'other',
      shouldWarnComplexity: true,
    },
    {
      id: 'ambiguous-roles',
      name: 'Ambiguous Roles',
      prompt: 'Build an app where different users see different things based on undefined criteria.',
      expectedType: 'other',
      shouldAskClarification: true,
    },
    {
      id: 'technical-constraints',
      name: 'Technical Constraints',
      prompt: 'Build an app that must work offline, sync in real-time online, and be built in a single file.',
      expectedType: 'other',
      shouldDetectConflict: true,
    },
    {
      id: 'circular-dependency',
      name: 'Circular Dependencies',
      prompt:
        'Users create content that other users can edit, but the original creator must approve, who then needs approval from viewers.',
      expectedType: 'social',
      shouldWarnComplexity: true,
    },
    {
      id: 'missing-auth',
      name: 'Missing Auth Specification',
      prompt: 'Build an app with multiple user types but no authentication requirements.',
      expectedType: 'other',
      shouldMakeAssumptions: true,
    },
    {
      id: 'payment-missing-model',
      name: 'Payment Without Model',
      prompt: 'App needs premium subscription but no description of what entities are needed.',
      expectedType: 'saas',
      shouldMakeAssumptions: true,
    },
    {
      id: 'realtime-scalability',
      name: 'Realtime + Scalability',
      prompt:
        'Build an app supporting 1M concurrent users with real-time updates, but running on a single database instance.',
      expectedType: 'other',
      shouldDetectConflict: true,
    },
  ],
}

// ============================================================================
// EVALUATION METRICS
// ============================================================================

export interface TestResult {
  testId: string
  testName: string
  success: boolean
  latency: number
  errors: string[]
  warnings: string[]
  validationScore: number
  executionScore: boolean
  retries: number
  costEstimate: number
}

export interface EvaluationReport {
  totalTests: number
  passed: number
  failed: number
  successRate: number
  avgLatency: number
  avgValidationScore: number
  executionRate: number
  averageRetries: number
  totalCost: number
  results: TestResult[]
}

// ============================================================================
// EVALUATION RUNNER
// ============================================================================

export async function runEvaluation(): Promise<EvaluationReport> {
  const results: TestResult[] = []
  const allTests = [
    ...TEST_CASES.realProducts.map((t) => ({ ...t, category: 'real-product' })),
    ...TEST_CASES.edgeCases.map((t) => ({ ...t, category: 'edge-case' })),
  ]

  for (const test of allTests) {
    const result = await runSingleTest(test)
    results.push(result)
  }

  return generateReport(results)
}

async function runSingleTest(test: any): Promise<TestResult> {
  const startTime = Date.now()
  let retries = 0
  let lastError: string | null = null

  // Retry logic: up to 2 retries on failure
  while (retries <= 2) {
    try {
      const intent = await extractIntent(test.prompt)
      const design = await designSystem(intent)
      const schemas = await generateSchemas(design, intent)
      const refined = await refineSchemas(schemas, design)
      const validation = await validateAndRepair(refined)
      const execution = checkExecutability(refined, validation)

      const latency = Date.now() - startTime

      return {
        testId: test.id,
        testName: test.name,
        success: validation.valid && execution.executable,
        latency,
        errors: validation.errors,
        warnings: validation.warnings,
        validationScore: validation.score,
        executionScore: execution.executable,
        retries,
        costEstimate: estimateCost(latency),
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      retries++

      if (retries <= 2) {
        console.log(`[Retry ${retries}] Test ${test.id} failed: ${lastError}`)
        await new Promise((r) => setTimeout(r, 1000)) // Wait before retry
      }
    }
  }

  return {
    testId: test.id,
    testName: test.name,
    success: false,
    latency: Date.now() - startTime,
    errors: [lastError || 'Failed after retries'],
    warnings: [],
    validationScore: 0,
    executionScore: false,
    retries,
    costEstimate: estimateCost(Date.now() - startTime),
  }
}

function estimateCost(latencyMs: number): number {
  // Rough estimate: $0.001 per second of compute + token costs
  // Real calculation would use actual token counts
  return (latencyMs / 1000) * 0.01
}

function generateReport(results: TestResult[]): EvaluationReport {
  const passed = results.filter((r) => r.success).length
  const failed = results.length - passed

  return {
    totalTests: results.length,
    passed,
    failed,
    successRate: (passed / results.length) * 100,
    avgLatency: results.reduce((sum, r) => sum + r.latency, 0) / results.length,
    avgValidationScore: results.reduce((sum, r) => sum + r.validationScore, 0) / results.length,
    executionRate: (results.filter((r) => r.executionScore).length / results.length) * 100,
    averageRetries: results.reduce((sum, r) => sum + r.retries, 0) / results.length,
    totalCost: results.reduce((sum, r) => sum + r.costEstimate, 0),
    results,
  }
}

// ============================================================================
// REPORTING
// ============================================================================

export function formatReport(report: EvaluationReport): string {
  return `
┌─ APPFORGE EVALUATION REPORT ──────────────────┐
│ Total Tests:       ${report.totalTests}
│ Passed:            ${report.passed}/${report.totalTests} (${report.successRate.toFixed(1)}%)
│ Failed:            ${report.failed}/${report.totalTests}
│
│ Avg Latency:       ${report.avgLatency.toFixed(0)}ms
│ Avg Validation:    ${report.avgValidationScore.toFixed(1)}/100
│ Execution Ready:   ${report.executionRate.toFixed(1)}%
│ Avg Retries:       ${report.averageRetries.toFixed(2)}
│ Total Cost:        $${report.totalCost.toFixed(4)}
└──────────────────────────────────────────────┘

FAILURES:
${report.results
  .filter((r) => !r.success)
  .map(
    (r) => `  ✗ ${r.testName} (${r.testId})
    Errors: ${r.errors.join(', ')}
    Retries: ${r.retries}
  `
  )
  .join('\n')}

WARNINGS:
${report.results
  .filter((r) => r.warnings.length > 0)
  .map(
    (r) => `  ⚠ ${r.testName}
    ${r.warnings.join(', ')}
  `
  )
  .join('\n')}
`
}

// If run directly (via ts-node), execute evaluation in deterministic mode
if (require.main === module) {
  ;(async () => {
    process.env.DETERMINISTIC_LLM = '1'
    try {
      const report = await runEvaluation()
      console.log(formatReport(report))
      console.log('JSON_REPORT_START')
      console.log(JSON.stringify(report, null, 2))
      console.log('JSON_REPORT_END')
    } catch (err) {
      console.error('Evaluation execution failed:', err)
      process.exitCode = 1
    }
  })()
}
