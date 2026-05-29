# AppForge — Product Spec (one-pager)

Goal
----
Build a SaaS Builder that compiles a detailed natural-language app description into a fully consistent JSON application configuration containing:
- UI schema (pages & components)
- API routes
- Prisma DB schema
- Auth & permissions matrix (roles + feature flags)

Reference UX
------------
- Vercel v0 (v0.dev): polished sandbox previews and live editing flow
- Bolt.new: instant project scaffolding, short path to a working sample
- Base44.com: high-fidelity application previews and strong visual polish

Top app types (priority)
------------------------
1. CRM with role-based dashboards
2. SaaS Project Management Tracker (billing gates)
3. Analytics Dashboard (tables + charts)

Outputs
-------
- Single canonical JSON app config that is deterministic and versionable
- Derived artifacts: Prisma schema, API route definitions, UI component schema, auth/roles matrix (Admin/Member/User), Stripe-ready feature flags

Multitenancy & Auth
-------------------
- Multi-tenant by workspace/org model
- RBAC: Admin / Member / User
- Premium feature flags in config for Stripe integration

Visual Direction
----------------
- Dark mode, modern enterprise look (shadcn-like tokens, rounded geometry, dense data tables)

AI / Models
---------
- Featherless-compatible endpoint using Qwen / Llama family models. Deterministic fallback logic when model output is malformed.

Initial Scope (MVP)
--------------------
1. Editor UI: left-side prompt editor (autosave + history), right-side generated preview (JSON + simple UI preview)
2. Compiler backend integration (local deterministic fallback + LLM calls)
3. Export as JSON + simple Prisma schema generation
4. Auth scaffolding (Clerk or pluggable provider) with workspace support

Milestones
----------
1. Product spec & editor UI (this change)
2. Compiler integration and robust parsing/fallbacks
3. Persisted projects and team access controls
4. Billing + premium feature flags
5. Polish + E2E tests

Acceptance Criteria (first iteration)
-----------------------------------
- Editor autosaves (localStorage) and keeps a usable history with restore/delete
- Draft product spec file committed in repo
- Minimal preview of generated JSON from editor prompt (deterministic fallback available)

Next actions
------------
1. Implement editor UI (autosave + history) — scaffolded in this commit
2. Hook editor to the compiler pipeline and show preview
3. Add persistence (DB) and team-auth
