(async () => {
  process.env.DETERMINISTIC_LLM = '1'

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ai = require('../lib/ai')

  const TEST_CASES = [
    { id: 'crm-basic', name: 'CRM System', prompt: 'Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.' },
    { id: 'marketplace', name: 'Marketplace', prompt: 'Create a marketplace where sellers can list products, buyers can search and purchase. Include reviews, ratings, and seller analytics.' },
    { id: 'blog-platform', name: 'Blog Platform', prompt: 'Build a blogging platform with user authentication, post creation, comments, categories, and search functionality.' },
    { id: 'project-tracker', name: 'Project Tracker', prompt: 'Create a project management tool with tasks, timelines, team collaboration, and progress tracking. Support real-time updates.' },
    { id: 'social-feed', name: 'Social Feed', prompt: 'Build a social network with user profiles, posts, likes, comments, follows, and a home feed. Support notifications.' },
    { id: 'ecommerce-store', name: 'E-Commerce Store', prompt: 'Create an online store with product catalog, shopping cart, checkout, payment processing, and order history.' },
    { id: 'analytics-dashboard', name: 'Analytics Dashboard', prompt: 'Build an analytics dashboard that tracks user behavior, displays charts, allows filtering, and generates reports.' },
    { id: 'saas-app', name: 'SaaS App', prompt: 'Create a subscription-based SaaS tool for team collaboration. Include user roles (admin, member), workspace management, and billing.' },
    { id: 'health-tracker', name: 'Health Tracker', prompt: 'Build a fitness tracking app with workout logging, progress charts, social sharing, and personalized recommendations based on activity.' },
    { id: 'booking-system', name: 'Booking System', prompt: 'Create a booking platform for services (salon, hotel, consulting). Include availability, payments, confirmations, and customer history.' },
  ]

  const results: any[] = []

  for (const test of TEST_CASES) {
    const start = Date.now()
    try {
      const intentText = await ai.callLLMText({ system: ai.SYSTEM_PROMPTS.intent, prompt: test.prompt, model: 'deterministic' })
      const intent = JSON.parse(intentText)

      const designText = await ai.callLLMText({ system: ai.SYSTEM_PROMPTS.design, prompt: JSON.stringify(intent), model: 'deterministic' })
      const design = JSON.parse(designText)

      const schemasText = await ai.callLLMText({ system: ai.SYSTEM_PROMPTS.schema, prompt: JSON.stringify(design), model: 'deterministic' })
      const schemas = JSON.parse(schemasText)

      const refinedText = await ai.callLLMText({ system: ai.SYSTEM_PROMPTS.refinement, prompt: JSON.stringify(schemas), model: 'deterministic' })
      const refined = JSON.parse(refinedText)

      // rudimentary validation
      const errors: string[] = []
      const warnings: string[] = []

      if (!refined.database || !Array.isArray(refined.database.tables) || refined.database.tables.length === 0) {
        errors.push('No database tables defined')
      }
      if (!refined.api || !Array.isArray(refined.api.endpoints) || refined.api.endpoints.length === 0) {
        errors.push('No API endpoints defined')
      }
      if (!refined.ui || !Array.isArray(refined.ui.pages) || refined.ui.pages.length === 0) {
        errors.push('No UI pages defined')
      }

      // check cross-layer: UI dataSource must reference /api/
      (refined.ui?.pages || []).forEach((p: any) => {
        if (p.dataSource && !String(p.dataSource).includes('/api/')) {
          errors.push(`Page ${p.route} has invalid dataSource: ${p.dataSource}`)
        }
      })

      const latency = Date.now() - start
      const validationScore = Math.max(0, 100 - errors.length * 30 - warnings.length * 5)
      const executable = errors.length === 0 && validationScore >= 70

      results.push({ testId: test.id, testName: test.name, success: executable, latency, errors, warnings, validationScore, retries: 0, costEstimate: 0.0 })
    } catch (err) {
      const latency = Date.now() - start
      results.push({ testId: test.id, testName: test.name, success: false, latency, errors: [String(err)], warnings: [], validationScore: 0, retries: 0, costEstimate: 0.0 })
    }
  }

  const passed = results.filter((r) => r.success).length
  const report = {
    totalTests: results.length,
    passed,
    failed: results.length - passed,
    successRate: (passed / results.length) * 100,
    avgLatency: results.reduce((s, r) => s + r.latency, 0) / results.length,
    avgValidationScore: results.reduce((s, r) => s + r.validationScore, 0) / results.length,
    executionRate: (results.filter((r) => r.success).length / results.length) * 100,
    averageRetries: 0,
    totalCost: 0,
    results,
  }

  console.log('\nDETERMINISTIC EVALUATION REPORT')
  console.log(JSON.stringify(report, null, 2))
})()
