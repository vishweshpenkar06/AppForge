# AppForge — Default Assumptions

These assumptions are applied automatically when the user's prompt is ambiguous.

## Auth & Roles
- If no roles mentioned → create `admin` and `user` roles
- If "login" mentioned → JWT auth is assumed
- Admin always has full CRUD on all entities
- User role gets read + create on their own records only

## Database
- Every table gets `id` (UUID), `created_at`, `updated_at` columns automatically
- Many-to-many relations get a junction table named `{TableA}_{TableB}`
- Soft deletes (`deleted_at`) added to User-facing tables

## API
- Base path is always `/api/v1`
- All mutation endpoints (POST/PUT/DELETE) require auth by default
- GET list endpoints are paginated (default: `?page=1&limit=20`)

## Payments / Premium
- If "premium" or "paid" mentioned → Subscription table added with `plan`, `status`, `expires_at`
- Premium gate default behavior: `paywall` (redirect to upgrade page)
- Payment processor assumed: Stripe (not integrated, only schema)

## UI
- Dashboard layout used for authenticated pages
- Blank layout for auth pages (login, register)
- Tables include search + pagination by default
- Forms include client-side required field validation
