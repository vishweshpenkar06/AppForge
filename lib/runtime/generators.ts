// lib/runtime/generators.ts
// Generates portable, runnable stubs from validated AppForge config

import type { AppConfig } from '../schemas'

// ─── SQL Generator ───────────────────────────────────────────────

export function generateSQL(config: AppConfig): string {
  const lines: string[] = [
    '-- AppForge Generated Schema',
    '-- Compatible with SQLite and PostgreSQL',
    '',
  ]

  for (const table of config.database.tables) {
    lines.push(`CREATE TABLE IF NOT EXISTS "${table.name}" (`)
    const cols = table.columns.map(col => {
      const parts = [`  "${col.name}"`, mapSQLType(col.type)]
      if (col.primary_key) parts.push('PRIMARY KEY')
      if (!col.nullable) parts.push('NOT NULL')
      if (col.default !== null && col.default !== undefined) {
        parts.push(`DEFAULT ${formatDefault(col.default, col.type)}`)
      }
      return parts.join(' ')
    })

    const fkLines = table.columns
      .filter(c => c.foreign_key)
      .map(c => `  FOREIGN KEY ("${c.name}") REFERENCES "${c.foreign_key!.table}"("${c.foreign_key!.column}")`)

    lines.push([...cols, ...fkLines].join(',\n'))
    lines.push(');')
    lines.push('')
  }

  return lines.join('\n')
}

function mapSQLType(t: string): string {
  const map: Record<string, string> = {
    uuid: 'TEXT',
    text: 'TEXT',
    integer: 'INTEGER',
    boolean: 'INTEGER',
    timestamptz: 'TEXT',
    jsonb: 'TEXT',
    decimal: 'REAL',
    date: 'TEXT',
  }
  return map[t] ?? 'TEXT'
}

function formatDefault(val: unknown, type: string): string {
  if (type === 'boolean') return val ? '1' : '0'
  if (typeof val === 'string') return `'${val}'`
  return String(val)
}

// ─── Express Generator ────────────────────────────────────────────

export function generateExpressServer(config: AppConfig): string {
  const basePath = '/api/v1'

  const routeLines = config.api.endpoints.map(ep => {
    const method = ep.method.toLowerCase()
    const authMiddleware = ep.auth_required ? 'requireAuth, ' : ''
    const roleCheck = ep.roles_allowed?.length
      ? `requireRole(${JSON.stringify(ep.roles_allowed)}), `
      : ''

    return `
// ${ep.description}
app.${method}('${basePath}${ep.route}', ${authMiddleware}${roleCheck}async (req, res) => {
  try {
    // TODO: implement ${ep.description}
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`
  }).join('\n')

  const tokenExpiry = config.auth.token_expiry || '24h'

  return `const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// ── Auth Middleware ──────────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// ── Auth Routes ──────────────────────────────────────────────────
app.post('${basePath}/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // TODO: verify credentials against DB
  const token = jwt.sign({ email, role: 'user' }, JWT_SECRET, { expiresIn: '${tokenExpiry}' });
  res.json({ token });
});

// ── Generated Routes ─────────────────────────────────────────────
${routeLines}

// ── Start Server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(\`AppForge server running on port \${PORT}\`));
`
}

// ─── React Page Generator ─────────────────────────────────────────

export function generateReactApp(config: AppConfig): Record<string, string> {
  const files: Record<string, string> = {}

  const imports = config.ui.pages.map(p =>
    `import ${sanitizeName(p.name)}Page from './pages/${sanitizeName(p.name)}';`
  ).join('\n')

  const routes = config.ui.pages.map(p =>
    `  <Route path="${p.route}" element={<${sanitizeName(p.name)}Page />} />`
  ).join('\n')

  files['App.jsx'] = `import { BrowserRouter, Routes, Route } from 'react-router-dom';
${imports}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
${routes}
      </Routes>
    </BrowserRouter>
  );
}`

  for (const page of config.ui.pages) {
    const pageName = sanitizeName(page.name)
    const access = page.access?.join(', ') || 'all'

    const componentJSX = page.components.map(comp => {
      if (comp.type === 'table' || comp.type === 'list') {
        return `      <div className="table-container">
        <h2>${comp.type}</h2>
        <table><thead><tr>${(comp.fields || []).map(f => `<th>${f.name}</th>`).join('')}</tr></thead><tbody></tbody></table>
      </div>`
      }
      if (comp.type === 'form') {
        const inputs = (comp.fields || []).map(f =>
          `        <div><label>${f.name}</label><input type="${f.type || 'text'}" name="${f.name}" ${f.required ? 'required' : ''} /></div>`
        ).join('\n')
        return `      <form onSubmit={handleSubmit}>
${inputs}
        <button type="submit">Submit</button>
      </form>`
      }
      return `      <div className="${comp.type}"></div>`
    }).join('\n')

    files[`pages/${pageName}.jsx`] = `import { useState, useEffect } from 'react';

// Access: ${access}
// Layout: ${page.layout}
export default function ${pageName}Page() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // TODO: fetch from API
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: POST to API
  }

  return (
    <div className="page ${page.layout}">
      <h1>${page.name}</h1>
${componentJSX}
    </div>
  );
}`
  }

  return files
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '')
}
