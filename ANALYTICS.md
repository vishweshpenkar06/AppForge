# Product Analytics

PostHog-based usage analytics. Tracks user behavior patterns, not errors (Sentry handles that separately).

## Setup

Set `NEXT_PUBLIC_POSTHOG_KEY` and optionally `NEXT_PUBLIC_POSTHOG_HOST` in `.env.local`.

If the key is missing, all tracking calls are no-ops — no errors, no crashes.

## Tracked Events

| Event | Where | Why |
|---|---|---|
| `prompt_submitted` | `generation-form.tsx` | Measure conversion from prompt to compilation. Properties: `mode`, `prompt_length`. |
| `generation_completed` | `generation-form.tsx` | Track success rate and mode usage. Properties: `mode`, `job_id`. |
| `generation_failed` | `generation-form.tsx` | Identify failure patterns. Properties: `mode`, `error`. |
| `example_prompt_clicked` | `ExamplePrompts.tsx` | See which templates drive usage. Property: `prompt`. |
| `plan_upgrade_clicked` | `pricing/page.tsx` | Measure upgrade intent and billing preference. Properties: `plan`, `billing`. |
| `template_used` | *(pending Prompt 12)* | Track template-to-generation pipeline. |

## Funnel

The primary funnel tracks the path from first interaction to paid conversion:

```
example_prompt_clicked  (or prompt typed manually)
        |
        v
  prompt_submitted
        |
        v
 generation_completed  ──>  generation_failed
        |
        v
plan_upgrade_clicked
```

**Key conversion metrics:**
- Prompt completion rate: `prompt_submitted` / page visits
- Success rate: `generation_completed` / `prompt_submitted`
- Upgrade rate: `plan_upgrade_clicked` / `generation_completed`

## Design Principles

- **Client-side only** — events fire from browser components, no server-side tracking.
- **No PII** — we never send email, names, or prompt content (only prompt length).
- **Graceful degradation** — missing PostHog key means zero side effects.
- **Separate from observability** — Sentry captures errors; PostHog captures usage.
