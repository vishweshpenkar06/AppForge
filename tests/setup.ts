import { vi } from 'vitest'

// Prevent lib/ai.ts from throwing on missing API keys during tests
vi.stubEnv('DETERMINISTIC_LLM', '1')
vi.stubEnv('NVIDIA_API_KEY', '')
vi.stubEnv('GROQ_API_KEY', '')
vi.stubEnv('FEATHERLESS_API_KEY', '')
