# LLM Provider Tradeoffs

AppForge supports multiple LLM providers via an OpenAI-compatible API layer. This document compares them to help you choose the right one.

## Provider Comparison

| | NVIDIA NIM | Groq | Featherless |
|---|---|---|---|
| **URL** | [build.nvidia.com](https://build.nvidia.com) | [console.groq.com](https://console.groq.com) | [featherless.ai](https://featherless.ai) |
| **Cost** | Free tier | Free tier | Free tier |
| **Rate Limit** | ~40 req/min | ~30 req/min (free) | Varies by model |
| **Default Model** | `mistralai/mistral-nemotron-super-49b-v1` | `llama-3.3-70b-versatile` | `meta-llama/Meta-Llama-3.3-70B-Instruct` |
| **Fallback Model** | `deepseek-ai/deepseek-v4-pro` | `llama-3.1-8b-instant` | `meta-llama/Meta-Llama-3.1-8B-Instruct` |
| **Latency** | ~1–3s | ~0.5–2s | ~2–5s |
| **Best For** | Structured JSON generation, complex reasoning | Low-latency inference, high throughput | Model variety, custom deployments |
| **Auth Header** | `Bearer nvapi-...` | `Bearer gsk_...` | `Bearer rc_...` |

## Selection Logic

Set `LLM_PROVIDER` in your `.env`:

```env
LLM_PROVIDER=nvidia    # or groq, featherless
```

**Default behavior** (when `LLM_PROVIDER` is unset):
1. Try NVIDIA NIM first
2. On 429 (rate limit) or timeout, automatically fall back to Groq
3. If both fail, throw an error

## Why NVIDIA NIM (Recommended)

- **Best structured output** — Mistral Nemotron Super is tuned for instruction following and JSON schema compliance, which is critical for AppForge's 5-stage pipeline
- **Free tier** — No credit card required, generous rate limits for development
- **Dual-model strategy** — Primary model handles complex reasoning; fallback model (`deepseek-v4-pro`) provides redundancy
- **OpenAI-compatible** — Drop-in replacement, zero code changes needed

## Why Groq (Fallback)

- **Fastest inference** — Groq's custom LPU hardware delivers the lowest latency
- **Reliable** — High uptime, well-tested API
- **Good for prototyping** — When speed matters more than output quality

## Cost Per Compile

Estimated cost per full pipeline run (6 LLM calls):

| Mode | Tokens (est.) | NVIDIA NIM | Groq | Featherless |
|------|--------------|------------|------|-------------|
| Fast | ~4,000 | Free | Free | Free |
| Balanced | ~8,000 | Free | Free | Free |
| Precise | ~12,000 | Free | Free | Free |

*All providers offer free tiers sufficient for development and moderate production use.*

## Adding a Custom Provider

Any OpenAI-compatible API works. Set these env vars:

```env
LLM_BASE_URL=https://your-api.example.com/v1
LLM_MODEL=your-model-name
LLM_PROVIDER=nvidia  # Use 'nvidia' provider slot with custom base URL
```
