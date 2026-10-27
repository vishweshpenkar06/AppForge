import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import reactHooks from 'eslint-plugin-react-hooks'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // Legacy pipeline types are intentionally loose; keep as signal, not a gate.
      '@typescript-eslint/no-explicit-any': 'warn',
      // CJS interop (archiver) and script entrypoints.
      '@typescript-eslint/no-require-imports': 'off',
      // React Compiler advisories: pre-existing data-loading effects use this pattern.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'public/generated/**',
    'next-env.d.ts',
  ]),
])
