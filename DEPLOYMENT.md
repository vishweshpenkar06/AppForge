# AppForge Deployment Guide

## Overview

AppForge is designed for easy deployment to Vercel with PostgreSQL database support. This guide covers production deployment setup.

## Prerequisites

- Vercel account
- PostgreSQL database (Neon, Railway, or similar)
- Clerk account for authentication
- Featherless API account for LLM access

## Step 1: Prepare Your Repository

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: AppForge application"

# Push to GitHub (recommended)
git remote add origin https://github.com/your-username/appforge.git
git push -u origin main
```

## Step 2: Create PostgreSQL Database

### Using Neon (Recommended)

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Format: `postgresql://username:password@host:port/database`

### Using Railway

1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy connection URL from Variables tab

## Step 3: Set Up Clerk

1. Go to [clerk.com](https://clerk.com)
2. Create or select your application
3. Go to Settings → API Keys
4. Copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
5. Go to Webhooks → Create new endpoint
6. Set webhook URL to: `https://yourdomain.com/api/webhooks/clerk`
7. Subscribe to: `user.created`, `user.deleted`
8. Copy the webhook signing secret: `CLERK_WEBHOOK_SECRET`

## Step 4: Get Featherless API Keys

1. Go to [featherless.ai](https://featherless.ai)
2. Sign up and create API key
3. Copy:
   - `FEATHERLESS_API_KEY`
   - `FEATHERLESS_BASE_URL` (usually `https://api.featherless.ai/v1`)

## Step 5: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables when prompted
```

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your GitHub repository
4. Configure project settings:
   - Framework: Next.js
   - Root Directory: ./
5. Add Environment Variables:
   ```
   DATABASE_URL=<your-postgres-url>
   FEATHERLESS_API_KEY=<your-key>
   FEATHERLESS_BASE_URL=https://api.featherless.ai/v1
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-key>
   CLERK_SECRET_KEY=<your-key>
   CLERK_WEBHOOK_SECRET=<your-key>
   ```
6. Click "Deploy"

## Step 6: Post-Deployment Setup

### Initialize Database

After deployment, run migrations:

```bash
# Using Vercel CLI
vercel env pull

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed
```

### Update Clerk Webhook URL

1. In Clerk Dashboard, go to Webhooks
2. Update endpoint URL to your Vercel domain:
   ```
   https://your-app.vercel.app/api/webhooks/clerk
   ```
3. Save changes

### Verify Deployment

1. Visit your Vercel domain: `https://your-app.vercel.app`
2. Test sign-up flow
3. Create a test generation
4. Verify data is saved in database

## Environment Variables Reference

```env
# Database Connection
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Featherless AI (LLM)
FEATHERLESS_API_KEY=rc_xxxxx
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Node Environment
NODE_ENV=production
```

## Monitoring & Maintenance

### Check Logs

```bash
# View Vercel logs
vercel logs

# Or in Vercel Dashboard: Deployments → Function Logs
```

### Monitor Database

- Check connection pool usage
- Monitor query performance
- Set up database backups

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Re-deploy
git push origin main
```

## Troubleshooting

### Database Connection Fails

```
Error: could not connect to server: Connection refused
```

**Solution**:
1. Verify DATABASE_URL is correct
2. Ensure IP whitelist allows Vercel IPs
3. Test connection locally: `psql $DATABASE_URL`

### Clerk Webhooks Not Working

**Solution**:
1. Verify webhook URL is correct in Clerk Dashboard
2. Check webhook signing secret matches `CLERK_WEBHOOK_SECRET`
3. Review logs in Clerk Dashboard → Webhooks

### Featherless API Errors

```
Error: 401 Unauthorized
```

**Solution**:
1. Verify `FEATHERLESS_API_KEY` is correct
2. Check API key is active in Featherless dashboard
3. Ensure `FEATHERLESS_BASE_URL` is correct

### Out of Memory Errors

**Solution**:
1. Check for memory leaks in pipeline
2. Limit max generation token size
3. Consider upgrading Vercel plan

## Performance Optimization

### Database Queries

```typescript
// Add indexes for common queries
// In prisma/schema.prisma
model Generation {
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

### Caching

- Cache generation configs (24 hours)
- Cache user metrics (5 minutes)
- Use Vercel KV for session storage (optional)

### Rate Limiting

```typescript
// Add rate limiting middleware
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
})
```

## Rollback Procedures

```bash
# Rollback to previous deployment
vercel rollback

# Or select specific deployment in Vercel Dashboard
```

## Scaling

As usage grows:

1. **Database**: Consider read replicas or better infrastructure
2. **API Rate Limits**: Implement user-based rate limiting
3. **Queue**: Use Bull/Redis for background jobs
4. **Caching**: Implement Redis caching for expensive queries
5. **CDN**: Vercel auto-handles static assets globally

## Security Checklist

- [ ] All environment variables set
- [ ] Database SSL enabled
- [ ] Webhook secrets configured
- [ ] CORS policies set
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS protection (Next.js default)
- [ ] CSRF tokens (Next.js default)
- [ ] Regular backups configured
- [ ] Log monitoring enabled

## Disaster Recovery

### Database Backup

```bash
# With Neon
# Backups are automatic (7-day retention)

# With Railway
# Enable automated backups in project settings

# Manual backup
pg_dump $DATABASE_URL > backup.sql
```

### Restore from Backup

```bash
# Restore database
psql $DATABASE_URL < backup.sql

# Re-run migrations if needed
npx prisma migrate deploy
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Clerk Deployment Guide](https://clerk.com/docs/deployments/overview)
- [Next.js Production Guide](https://nextjs.org/docs/going-to-production)

---

**Last Updated**: May 2026  
**Version**: 1.0.0
