# AppForge Submission Checklist

## Verified Locally

- [x] Development server starts with `npm run dev`
- [x] Deterministic evaluation runs with `npm run eval:deterministic`
- [x] Exported-app smoke test passes with `npm run smoke:export`
- [x] Multi-stage pipeline exists in `app/api/compile/route.ts` and `lib/compiler/core.ts`
- [x] Validation and repair flow exists in `lib/validation.ts` and `lib/compiler/core.ts`
- [x] Evaluation dataset includes 10 real prompts and 10 edge cases in `lib/compiler/evaluation.ts`
- [x] Deterministic export scaffold can boot a minimal runtime app and pass `/health`

## Submission Assets

- [ ] Live URL for deployed AppForge app
- [ ] GitHub repository URL
- [ ] Loom video link

## Deployment Readiness

- [ ] Configure production `DATABASE_URL`
- [ ] Configure `FEATHERLESS_API_KEY` for real LLM mode
- [ ] Configure Clerk environment variables
- [ ] Run Prisma migrations in production
- [ ] Validate `/api/compile` on the deployed environment
- [ ] Verify `/compiler` and `/dashboard` render correctly after sign-in

## Demo Flow

1. Open the landing page.
2. Sign in via Clerk.
3. Navigate to `/compiler`.
4. Submit a prompt such as:
   - `Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.`
5. Show the validation, execution, and metrics panels.
6. Show the deterministic evaluation run.
7. Show exported scaffold smoke test evidence.

## Notes

- Deterministic test mode uses `DETERMINISTIC_LLM=1`.
- The exported scaffold is a minimal Node runtime app generated from a validated `AppConfig`.
- Real production compilation still requires a valid Featherless key and database connection.
