import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),

  // Auth
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),

  // LLM Providers (at least one required)
  NVIDIA_NIM_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  FEATHERLESS_API_KEY: z.string().optional(),

  // Pipeline
  DETERMINISTIC_LLM: z.enum(['0', '1']).optional().default('0'),
  RATE_LIMIT_MAX_REQUESTS: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  GITHUB_TOKEN: z.string().optional(),
  ADMIN_USER_IDS: z.string().optional(),
  ENABLE_DEV_AUTH: z.enum(['true', 'false']).optional().default('false'),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  // Cache
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

let _env: Env | null = null

/**
 * Validate and return environment variables.
 * Throws a clear error at startup if required vars are missing.
 * Safe to call multiple times (cached after first validation).
 */
export function getEnv(): Env {
  if (_env) return _env

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors
    const messages = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
      .join('\n')

    throw new Error(
      `Environment validation failed:\n${messages}\n\nCopy .env.example to .env.local and fill in the required values.`
    )
  }

  // Warn if no LLM provider keys are set
  const hasLLMKey = result.data.NVIDIA_NIM_API_KEY || result.data.GROQ_API_KEY || result.data.FEATHERLESS_API_KEY
  if (!hasLLMKey && result.data.DETERMINISTIC_LLM !== '1') {
    console.warn(
      '[env] WARNING: No LLM provider API keys set. Set DETERMINISTIC_LLM=1 or provide at least one of: NVIDIA_NIM_API_KEY, GROQ_API_KEY, FEATHERLESS_API_KEY'
    )
  }

  _env = result.data
  return _env
}

/**
 * Check if a specific environment variable is available.
 * Returns false instead of throwing.
 */
export function hasEnv(key: keyof Env): boolean {
  try {
    const env = getEnv()
    return !!env[key]
  } catch {
    return false
  }
}
