import dotenv from 'dotenv'
import { defineConfig } from 'prisma/config'

// Load .env.local first (preferred for Next.js), then fallback to .env
dotenv.config({ path: '.env.local' })
dotenv.config()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
})