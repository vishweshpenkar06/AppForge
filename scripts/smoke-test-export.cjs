process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'commonjs',
  moduleResolution: 'node',
})

require('ts-node/register/transpile-only')

const { access, mkdtemp, rm } = require('fs/promises')
const { createServer } = require('http')
const path = require('path')
const os = require('os')
const { once } = require('events')
const { AppConfigSchema } = require('../lib/schemas')
const { writeAppScaffold } = require('../lib/export/scaffold')

function sampleConfig() {
  return AppConfigSchema.parse({
    meta: {
      appName: 'AppForge Smoke Export',
      description: 'A deterministic exported app scaffold used to validate executability.',
      version: '1.0',
      generatedAt: new Date('2026-05-29T00:00:00.000Z').toISOString(),
      assumptions: ['Single-tenant demo export'],
    },
    ui: {
      pages: [
        {
          id: 'home',
          name: 'Home',
          route: '/',
          layout: 'dashboard',
          components: [{ type: 'card', fields: [] }],
          access: ['admin', 'user'],
        },
      ],
    },
    api: {
      endpoints: [
        {
          method: 'GET',
          route: '/api/health',
          description: 'Health check',
          response: { ok: 'boolean' },
          auth_required: false,
          roles_allowed: ['admin', 'user'],
        },
      ],
    },
    database: {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid', primary_key: true, nullable: false },
            { name: 'email', type: 'text', nullable: false },
          ],
        },
      ],
    },
    auth: {
      provider: 'clerk',
      session_strategy: 'jwt',
      roles: [
        { name: 'admin', permissions: ['read', 'write'] },
        { name: 'user', permissions: ['read'] },
      ],
    },
    businessLogic: [
      {
        rule: 'Admin can access dashboard analytics',
        condition: 'role === admin',
        action: 'allow_analytics',
        affected_roles: ['admin'],
      },
    ],
  })
}

async function getFreePort() {
  const server = createServer()
  server.listen(0)
  await once(server, 'listening')
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 3000
  await new Promise((resolve) => server.close(resolve))
  return port
}

async function requestText(url) {
  const response = await fetch(url)
  return { status: response.status, body: await response.text() }
}

async function waitForHealth(baseUrl) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`)
      if (response.ok) {
        return await response.json()
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  throw new Error('Health check did not become ready')
}

async function main() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appforge-export-'))
  const outputDir = path.join(tempDir, 'exported-app')
  const config = sampleConfig()

  try {
    const scaffold = await writeAppScaffold(outputDir, config)
    const requiredFiles = ['package.json', 'server.js', 'app-config.json', 'README.md']

    for (const fileName of requiredFiles) {
      await access(path.join(outputDir, fileName))
    }

    const port = await getFreePort()
    const { spawn } = require('child_process')
    const serverProcess = spawn(process.execPath, ['server.js'], {
      cwd: outputDir,
      env: {
        ...process.env,
        PORT: String(port),
      },
      stdio: 'pipe',
    })

    const baseUrl = `http://127.0.0.1:${port}`
    const health = await waitForHealth(baseUrl)
    const root = await requestText(`${baseUrl}/`)

    serverProcess.kill()

    const summary = {
      outputDir,
      files: scaffold.files,
      health,
      rootStatus: root.status,
      rootContainsAppName: root.body.includes(config.meta.appName),
      executable: health.ok === true && root.status === 200 && root.body.includes(config.meta.appName),
    }

    console.log(JSON.stringify(summary, null, 2))

    if (!summary.executable) {
      throw new Error('Exported scaffold failed executable smoke test')
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
