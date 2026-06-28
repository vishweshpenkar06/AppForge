// eval/run_evals.ts
// Run: npx ts-node eval/run_evals.ts (server must be running on port 3000)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEST_CASES = [
  // Real product prompts
  { id: 1, type: 'real', prompt: 'Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.' },
  { id: 2, type: 'real', prompt: 'Create a project management tool like Trello with boards, cards, teams, and due date reminders.' },
  { id: 3, type: 'real', prompt: 'Build an LMS with courses, lessons, quizzes, student progress tracking, and instructor dashboards.' },
  { id: 4, type: 'real', prompt: 'Create a multi-tenant SaaS invoice tool with clients, invoices, payment tracking, and PDF export.' },
  { id: 5, type: 'real', prompt: 'Build a job board with company profiles, job listings, applicant tracking, and email notifications.' },
  { id: 6, type: 'real', prompt: 'Create a real estate listing platform with property search, agent profiles, and inquiry forms.' },
  { id: 7, type: 'real', prompt: 'Build a subscription newsletter platform with subscriber management, campaign builder, and analytics.' },
  { id: 8, type: 'real', prompt: 'Create a hospital appointment system with doctor schedules, patient records, and prescription history.' },
  { id: 9, type: 'real', prompt: 'Build a food delivery platform with restaurants, menus, orders, delivery tracking, and ratings.' },
  { id: 10, type: 'real', prompt: 'Create an e-commerce store with products, cart, checkout, inventory management, and admin panel.' },
  // Edge cases
  { id: 11, type: 'vague', prompt: 'Build an app' },
  { id: 12, type: 'vague', prompt: 'I need a website for my business' },
  { id: 13, type: 'conflicting', prompt: 'Build a public dashboard that only logged-in admins can see' },
  { id: 14, type: 'conflicting', prompt: 'Make everything free but also add premium features for all users' },
  { id: 15, type: 'incomplete', prompt: 'Add payments to my app' },
  { id: 16, type: 'incomplete', prompt: 'Build a social platform' },
  { id: 17, type: 'overloaded', prompt: 'Build Uber + Airbnb + LinkedIn + Shopify in one app' },
  { id: 18, type: 'contradictory_roles', prompt: 'Admins cannot see user data but must generate user reports' },
  { id: 19, type: 'missing_auth', prompt: 'Build a banking app with no login' },
  { id: 20, type: 'ambiguous_premium', prompt: 'Some features should cost money' },
]

async function runEval(testCase: (typeof TEST_CASES)[0]) {
  const start = Date.now()
  let status = 'failed'
  let stagesCompleted = 0
  let retries = 0
  let failureType: string | null = null
  let invariantsViolated: string[] = []
  let repairsMade = 0

  try {
    const response = await fetch('http://localhost:3000/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: testCase.prompt }),
    })

    const data = await response.json()

    if (response.ok && data.config) {
      status = 'success'
      stagesCompleted = 6
      retries = data.metadata?.retries || 0
      repairsMade = data.validation?.repairs?.length || 0
      invariantsViolated = data.validation?.errors?.filter((e: string) => e.includes('invariant')) || []
    } else if (data.stagesCompleted) {
      status = 'partial'
      stagesCompleted = data.stagesCompleted
      failureType = data.error
    }
  } catch (err: any) {
    failureType = err.message
  }

  return {
    id: testCase.id,
    type: testCase.type,
    prompt: testCase.prompt.substring(0, 60) + '...',
    status,
    stages_completed: stagesCompleted,
    retries,
    failure_type: failureType,
    latency_ms: Date.now() - start,
    invariants_violated: invariantsViolated,
    repairs_made: repairsMade,
  }
}

async function main() {
  console.log('Running AppForge Evaluation Suite (20 cases)...\n')

  const results = []
  for (const tc of TEST_CASES) {
    process.stdout.write(`  [${tc.id}/20] ${tc.type.padEnd(20)} `)
    const result = await runEval(tc)
    results.push(result)
    console.log(`-> ${result.status.toUpperCase()} (${result.latency_ms}ms)`)
  }

  const successRate = results.filter(r => r.status === 'success').length / results.length
  const avgLatency = results.reduce((s, r) => s + r.latency_ms, 0) / results.length
  const avgRetries = results.reduce((s, r) => s + r.retries, 0) / results.length

  const report = {
    generated_at: new Date().toISOString(),
    total_cases: 20,
    success_rate: Math.round(successRate * 100) / 100,
    avg_latency_ms: Math.round(avgLatency),
    avg_retries: Math.round(avgRetries * 100) / 100,
    results,
  }

  fs.writeFileSync(
    path.join(__dirname, 'evaluation.json'),
    JSON.stringify(report, null, 2)
  )

  console.log(`\nResults:`)
  console.log(`  Success rate: ${(successRate * 100).toFixed(0)}%`)
  console.log(`  Avg latency:  ${Math.round(avgLatency)}ms`)
  console.log(`  Avg retries:  ${avgRetries.toFixed(2)}`)
  console.log(`\nWritten to eval/evaluation.json`)
}

main()
