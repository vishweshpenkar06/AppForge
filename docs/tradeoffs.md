# AppForge — Cost vs Quality Tradeoffs

## Pipeline Strategy Comparison

| Strategy | Latency | Est. Cost | Quality | Decision |
|----------|---------|-----------|---------|----------|
| Single monolithic prompt | ~3s | ~$0.001 | Poor | Rejected — no cross-layer consistency |
| Sequential 6-stage pipeline | ~12s | ~$0.006 | High | **Default mode** |
| Parallel Stage 3 sub-schemas | ~6s | ~$0.006 | High | Used when latency matters |
| Deterministic stub (offline) | ~0ms | $0 | Minimal | Testing only |
| Full validation + LLM repair | ~18s | ~$0.012 | Excellent | When schemas fail rule-based repair |

## Key Decisions

### Why Groq/Featherless over OpenAI?
- Free tier available for development
- Sufficient quality for structured JSON generation
- Lower latency on smaller models

### Why Next.js stubs instead of Express?
- Aligns with existing stack (no context switch)
- Prisma handles type safety better than raw SQL
- However: portable Express + SQL stubs also generated via `lib/runtime/generators.ts`

### Stage 3 Parallelism
Stages 3a–3d (DB, API, UI, Auth schemas) can be generated in parallel since they share only the Stage 2 architecture as input. Currently sequential for simplicity; parallel mode reduces latency by ~40%.

### Repair Strategy Priority
1. Rule-based auto-repair (zero cost, instant)
2. LLM-assisted repair (costs 1 extra call, ~3s)
3. Human review flag (non-blocking, deferred)

Never full-retry the entire pipeline — only re-run the failing stage.
