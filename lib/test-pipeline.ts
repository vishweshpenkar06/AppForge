import { generateApplication } from './pipeline'

/**
 * Test the pipeline with a sample prompt
 */
export async function testPipeline() {
  const testPrompt = `
    Build a project management application with the following requirements:
    - User authentication with email/password
    - Team management (create teams, invite members)
    - Project creation and management
    - Task/issue tracking with different statuses
    - Real-time collaboration features
    - File attachment support
    - Activity/audit logs
    - Dark mode support
    
    Technical preferences:
    - Use Next.js 16 and TypeScript
    - PostgreSQL for database
    - Tailwind CSS for styling
    - Real-time updates using WebSockets
  `

  console.log('[Test] Starting pipeline test with sample prompt')
  console.log('[Test] Prompt:', testPrompt.substring(0, 100) + '...')

  const result = await generateApplication('test-job-' + Date.now(), testPrompt.trim(), 'balanced')

  console.log('[Test] Pipeline Result:')
  console.log(JSON.stringify(result, null, 2))

  return result
}

// Run if called directly
if (require.main === module) {
  testPipeline()
    .then(() => {
      console.log('[Test] Test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('[Test] Test failed:', error)
      process.exit(1)
    })
}
