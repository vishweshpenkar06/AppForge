# Security Audit — AppForge

**Audit Date:** 2026-08-26
**Branch:** `security-audit`
**Scope:** API keys/secrets exposure, route-level auth, input validation, injection, CORS, Clerk middleware

---

## Findings

### CRITICAL

- **[CRITICAL] proxy.ts:1-33 — Clerk middleware is dead code — Rename to `middleware.ts`**
  `proxy.ts` contains `clerkMiddleware` with `auth.protect()` and a public-route matcher, but Next.js only auto-loads `middleware.ts` (or `middleware.js`) at the project root. The actual `middleware.ts` in this repo only sets security headers — it never calls `auth.protect()`. Every route therefore relies solely on handler-level auth checks, and the Clerk route-protection logic is never executed.
  **Fix:** Rename `proxy.ts` to `middleware.ts` (merge the two files). The Clerk middleware should run before route handlers to block unauthenticated requests at the edge.

- **[CRITICAL] .env.local:1-14 — Real secrets committed to working tree — Rotate all credentials**
  `.env.local` contains live credentials: Clerk publishable/secret keys, a Neon PostgreSQL connection string with password, a Groq API key, and a commented NVIDIA API key. While `.gitignore` excludes `.env*.local`, the file exists on disk and could be accidentally committed or leaked. These values must be rotated immediately.
  **Fix:** Rotate every key in this file. Add `CLERK_WEBHOOK_SECRET` to `.env.example`. Create `lib/env.ts` using `zod` to validate all required env vars at startup with safe defaults and typed exports.

- **[CRITICAL] All API routes — Dev-mode auth bypass in non-production environments — Remove blanket bypass**
  Every API route (`generate`, `compile`, `metrics`, `generations`, `generations/[id]`, `generations/[id]/status`, `generations/[id]/export`, `plan/upgrade`, `plan/join-team`, `generated/[gid]/download`) uses `if (process.env.NODE_ENV !== 'production')` to skip Clerk auth and hardcode `userId = 'dev-user'`. A staging server, Vercel preview deployment, or any environment where `NODE_ENV` is not literally `"production"` will have zero authentication.
  **Fix:** Remove the dev bypass or gate it behind an explicit `APPForge_DEV_BYPASS=true` env var that is never set outside local development. Ensure `NODE_ENV=production` is set on all deployed environments.

### HIGH

- **[HIGH] app/api/evaluate/route.ts:11-14 — Auth check extracted but never enforced**
  `const { userId } = await auth()` is called but `userId` is never checked. The endpoint runs the full evaluation framework for any caller. Comment says "allow unauthenticated access" but this is a production risk.
  **Fix:** Add `if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })` and restrict to admin users.

- **[HIGH] app/api/generated/[gid]/download/route.ts:13-16 — Ownership not verified in production**
  In production, only `auth()` is called to confirm the user exists, but the route never checks `generation.userId === user.id`. Any authenticated user can download any other user's generation artifacts by guessing the `gid`.
  **Fix:** After fetching the generation, add `if (generation.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })`.

- **[HIGH] No rate limiting on any endpoint — Abuse and cost risk**
  `/api/compile` and `/api/generate` trigger multi-stage LLM pipelines that consume API credits. There is no rate limiting at the middleware or handler level. A single user can spam these endpoints and exhaust the provider quota.
  **Fix:** Add rate limiting in `middleware.ts` (e.g., using `@upstash/ratelimit` or a simple in-memory sliding window keyed on `userId`). Consider per-endpoint limits (e.g., 5 compiles/minute for free tier).

- **[HIGH] Multiple routes leak internal error messages to clients**
  Routes return `error.message` directly: `app/api/generate/route.ts:75`, `app/api/metrics/route.ts:50`, `app/api/generations/route.ts:53`, `app/api/generations/[id]/route.ts:100`, `app/api/generations/[id]/status/route.ts:74`, `app/api/generations/[id]/export/route.ts:249`, `app/api/plan/upgrade/route.ts:54`, `app/api/plan/join-team/route.ts:53`, `app/api/evaluate/route.ts:41`. These can expose stack traces, database errors, or internal paths.
  **Fix:** Log the full error server-side, return a generic `"Internal server error"` message to clients. Use a structured logger.

### MEDIUM

- **[MEDIUM] app/api/health/route.ts:16-19 — LLM provider metadata exposed**
  The health endpoint returns `active_provider`, `fallback_provider`, `model`, `base_url`, and `deterministic_mode`. This leaks infrastructure details that could aid targeted attacks.
  **Fix:** Return only `{ status, timestamp, uptime }` publicly. Move provider details behind an authenticated admin endpoint.

- **[MEDIUM] app/api/generate/route.ts:15 — No request body size limit**
  `request.json()` is called without a body size limit. An attacker could send a multi-GB payload to cause OOM.
  **Fix:** Use `request.clone().text()` with a manual size check, or configure Next.js body size limits. The `/api/compile` route has a 5000-char prompt limit but `/api/generate` has none.

- **[MEDIUM] app/api/metrics/route.ts:25-26 — System metrics accessible in dev mode**
  When `scope=system`, system-level metrics are returned. In dev mode (no auth), anyone can query these. Even in production, there's no role check — any authenticated user can access system metrics.
  **Fix:** Gate `scope=system` behind an admin role check.

- **[MEDIUM] lib/runtime/generators.ts:90 — Hardcoded JWT secret fallback**
  Generated Express server code contains `const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'`. If users deploy generated code without setting the env var, tokens are signed with a known secret.
  **Fix:** Remove the fallback. Throw an error if `JWT_SECRET` is not set. Add a prominent comment in generated code.

- **[MEDIUM] app/api/webhooks/clerk/route.ts:19,38 — Inconsistent error responses**
  Webhook errors return raw strings (`'Error occurred -- no svix headers'`, `'Error occurred'`) instead of JSON. This breaks client-side error parsing and leaks implementation details.
  **Fix:** Return `NextResponse.json({ error: 'Invalid request' }, { status: 400 })` consistently.

- **[MEDIUM] middleware.ts:21-23 — Missing Content-Security-Policy header**
  Security headers are set (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) but there's no `Content-Security-Policy` header. This leaves the app vulnerable to XSS via injected scripts.
  **Fix:** Add a CSP header appropriate for the app's needs (at minimum `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'`).

### LOW

- **[LOW] .env.example — Missing `CLERK_WEBHOOK_SECRET` variable**
  `app/api/webhooks/clerk/route.ts:7` reads `process.env.CLERK_WEBHOOK_SECRET`, but `.env.example` doesn't document this variable. Developers will hit a runtime error when setting up webhooks.
  **Fix:** Add `CLERK_WEBHOOK_SECRET=whsec_...` to `.env.example`.

- **[LOW] lib/env.ts does not exist — No centralized env validation**
  There is no `lib/env.ts` file. Environment variables are accessed directly via `process.env` across the codebase with no validation. Missing variables only surface at runtime.
  **Fix:** Create `lib/env.ts` using `zod` to parse and validate all required environment variables at startup. Export typed, validated values.

- **[LOW] app/api/plan/upgrade/route.ts:20 — Plan value not sanitized before DB write**
  The `plan` value from the request body is checked against `['free', 'pro', 'team']` (good) but is not trimmed or lowercased before the `includes()` check. A value like `"Team "` would be rejected, but `"TEAM"` would also be rejected — inconsistent.
  **Fix:** Normalize `plan` with `.trim().toLowerCase()` before validation.

- **[LOW] No CORS configuration — Relies on Next.js defaults**
  `next.config.mjs` has no `headers` or `Access-Control-Allow-Origin` configuration. Next.js defaults to same-origin only, which is correct. If cross-origin API access is ever needed, there's no framework to support it safely.
  **Fix:** Document the decision. When CORS is needed, use explicit origin allowlists — never `*`.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3     |
| HIGH     | 4     |
| MEDIUM   | 6     |
| LOW      | 4     |

**Top priorities:**
1. Rename `proxy.ts` → `middleware.ts` and merge with the existing header middleware
2. Rotate all secrets in `.env.local` and create `lib/env.ts` for validated env access
3. Remove the blanket dev-mode auth bypass or replace with an explicit opt-in flag
4. Add ownership checks to `/api/generated/[gid]/download` and `/api/evaluate`
5. Add rate limiting to LLM-consuming endpoints
