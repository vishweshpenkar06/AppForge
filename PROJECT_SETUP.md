# AppForge - AI Application Compiler

**Transform natural language descriptions into production-ready application configurations.**

## Project Overview

AppForge is an advanced AI-powered application compiler that leverages Claude (via Featherless API) to understand natural language product descriptions and generate complete, validated application configurations across database schemas, API routes, components, and deployment specifications.

## Architecture

The system is built on a **5-stage AI pipeline** that progressively refines application specifications:

1. **Intent Extraction** - Parse natural language requirements
2. **Design Architecture** - Create system blueprints
3. **Schema Generation** - Define databases, APIs, and components
4. **Refinement** - Merge and validate schemas
5. **Validation & Repair** - Cross-layer consistency checking

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (email/password)
- **AI**: Featherless API (Claude model access)
- **Styling**: Tailwind CSS with custom dark theme
- **UI Components**: shadcn/ui
- **Type Safety**: Zod for runtime validation

## Environment Setup

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/dbname"

# Featherless AI
FEATHERLESS_API_KEY="your_api_key"
FEATHERLESS_BASE_URL="https://api.featherless.ai/v1"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."
```

### Setup Instructions

1. **Clone and Install**
   ```bash
   pnpm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Fill in all required environment variables
   ```

3. **Initialize Database**
   ```bash
   pnpm exec prisma migrate dev
   pnpm exec prisma db seed
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

5. **Access Application**
   - Open http://localhost:3000
   - Sign up or sign in
   - Start generating application configs

## Project Structure

```
appforge/
├── app/
│   ├── api/                    # API routes
│   │   ├── generate/           # Main generation endpoint
│   │   ├── generations/        # History and details
│   │   ├── metrics/            # Analytics
│   │   └── webhooks/clerk/     # Authentication webhooks
│   ├── dashboard/              # Main application interface
│   ├── sign-in/                # Clerk sign-in
│   ├── sign-up/                # Clerk sign-up
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home/landing page
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── generation-form.tsx     # App description form
│   ├── generation-detail.tsx   # Config display
│   ├── generation-history.tsx  # Past generations
│   └── metrics-dashboard.tsx   # Analytics view
├── lib/
│   ├── ai.ts                   # AI pipeline orchestration
│   ├── pipeline.ts             # Multi-stage generation
│   ├── schemas.ts              # Zod validation schemas
│   ├── validation.ts           # Cross-layer consistency
│   ├── metrics.ts              # Quality scoring & analytics
│   ├── db.ts                   # Prisma client
│   └── execution-context.ts    # Stage tracking
├── prisma/
│   └── schema.prisma           # Database schema
└── public/                      # Static assets
```

## Core Features

### 1. Natural Language Compilation
Users describe their application in plain English, and AppForge converts it into structured, validated configurations.

### 2. Multi-Stage Pipeline
- **Intent Extraction**: Understands requirements, user roles, features, constraints
- **Design Architecture**: Creates page layouts, API endpoints, database structure
- **Schema Generation**: Generates specific database tables, API routes, React components
- **Refinement**: Merges schemas and resolves inconsistencies
- **Validation & Repair**: Auto-fixes cross-layer issues

### 3. Cross-Layer Validation
Ensures consistency between:
- Database tables and API parameters
- API endpoints and UI forms
- Data types across all layers
- User permissions and access control

### 4. Quality Metrics
Tracks and calculates:
- Schema completeness
- Name consistency
- Type correctness
- Relationship validity
- Overall quality score (0-100)

### 5. Export Capabilities
Download generated configurations as:
- **JSON**: Full structured data
- **YAML**: Human-readable format

## API Endpoints

### Generation
- `POST /api/generate` - Create new generation
- `GET /api/generations` - List user's generations
- `GET /api/generations/[id]` - Get specific generation
- `GET /api/generations/[id]/status` - Check generation status
- `GET /api/generations/[id]/export` - Export configuration

### Analytics
- `GET /api/metrics` - Get user/system metrics

### Webhooks
- `POST /api/webhooks/clerk` - Clerk auth events

## Configuration Modes

AppForge supports three compilation modes:

| Mode | Speed | Quality | Use Case |
|------|-------|---------|----------|
| **Fast** | ⚡ Quick | ✓ Basic | Prototypes, demos |
| **Balanced** | ⚖️ Moderate | ✓✓ Good | Most projects |
| **Precise** | 🔬 Thorough | ✓✓✓ Excellent | Production apps |

Each mode adjusts token limits, temperature, and refinement iterations.

## Data Models

### User
```typescript
{
  id: string
  clerkId: string
  email: string
  name: string
  createdAt: Date
  generations: Generation[]
}
```

### Generation
```typescript
{
  id: string
  userId: string
  prompt: string
  status: 'pending' | 'completed' | 'failed'
  mode: 'fast' | 'balanced' | 'precise'
  config: AppConfig
  metadata: {
    stages: StageMetadata[]
    totalTokens: number
    totalLatencyMs: number
  }
  errorMessage?: string
  createdAt: Date
  completedAt?: Date
}
```

### AppConfig
```typescript
{
  metadata: {
    name: string
    description: string
    version: string
  }
  intent: {
    appType: string
    features: string[]
    userRoles: string[]
    entities: string[]
    integrations: string[]
  }
  design: {
    pages: Page[]
    apiGroups: APIGroup[]
    dbTables: DBTable[]
    authStrategy: string
    rolePermissions: Record<string, string[]>
  }
  database: {
    tables: Table[]
    relationships: Relationship[]
  }
  api: {
    routes: APIRoute[]
  }
  components: Component[]
  deployment: {
    platform: string
    environment: string
  }
}
```

## Performance Considerations

- **Token Usage**: Average 2,000-5,000 tokens per generation
- **Processing Time**: 10-30 seconds depending on mode
- **Database**: Optimized with indexes on userId, status, createdAt
- **Caching**: Generations cached for 24 hours

## Security

- **Authentication**: Clerk handles all auth logic
- **Authorization**: User IDs scoped to all queries
- **Webhooks**: Signed with Clerk webhook secrets
- **Input Validation**: Zod schemas on all inputs
- **Environment**: Sensitive keys in .env.local

## Testing

Run the pipeline test:
```bash
pnpm exec ts-node lib/test-pipeline.ts
```

This generates a test application config and validates the full pipeline.

## Deployment

### To Vercel

1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Ensure PostgreSQL is accessible (Neon, Railway, etc.)
4. Deploy main branch

### Database Setup on Vercel
```bash
DATABASE_URL=<production-postgres-url> pnpm exec prisma migrate deploy
```

## Monitoring

Track generation quality and performance:
- Visit `/dashboard` to see metrics
- Monitor token usage and API costs
- Review generation history and success rates

## Future Enhancements

- [ ] WebSocket real-time generation progress
- [ ] Code generation from configurations
- [ ] Template marketplace
- [ ] Team collaboration
- [ ] Git integration
- [ ] Advanced metrics dashboard
- [ ] Custom model fine-tuning
- [ ] Batch processing

## Support & Contributions

For issues, questions, or contributions:
- Open an issue on GitHub
- Check documentation
- Contact support

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Maintained By**: AppForge Team
