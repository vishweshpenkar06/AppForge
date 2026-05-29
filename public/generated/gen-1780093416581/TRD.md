# Technical Requirements Document

## Summary
This system converts a natural-language app idea into a validated product blueprint, then emits technical guidance and route/page stubs that can be used to build the application.

## Architecture
- Frontend: Next.js App Router
- Backend: Server route handlers and compiler pipeline
- Database: PostgreSQL via Prisma
- Auth: Clerk with role-aware authorization
- Export: Markdown docs and file stubs in public/generated

## Technical Decisions
1. Normalize the requirement into a deterministic compiler input.
2. Group multiple HTTP methods for the same route into one file.
3. Keep the Prisma schema as the canonical source of truth.
4. Persist generated artifacts so the user can review or download them.

## Constraints
- Fallback outputs must still be valid when model output is missing
- Route paths must not be double-prefixed with /api
- All docs should agree on roles, pages, and entities

## Reliability and Validation
- Validate intent before design
- Validate design before schema generation
- Validate schema before export
- Track stage-level timings for debugging and review

## Deployment Notes
- Generated output is written to public/generated for local inspection
- Production compile access should remain authenticated
- Generated route files should be reviewed before being merged into the app