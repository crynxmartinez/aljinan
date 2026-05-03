import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient() {
  // Use connection pooling URL in production (DATABASE_URL_POOLED)
  // Use direct URL for migrations (DATABASE_URL)
  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL or DATABASE_URL_POOLED must be set')
  }

  // Optimize connection pool for serverless
  const pool = globalForPrisma.pool ?? new Pool({
    connectionString,
    max: 10,                    // Reduced max connections for serverless
    min: 0,                     // No minimum connections
    idleTimeoutMillis: 10000,   // Close idle connections after 10s (faster cleanup)
    connectionTimeoutMillis: 3000, // Fail fast if can't connect
    allowExitOnIdle: true,      // Allow process to exit when idle
  })

  // Reuse pool in development to avoid connection leaks
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool
  }

  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Reuse Prisma instance in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown - close connections when process exits
if (typeof window === 'undefined') {
  const cleanup = async () => {
    await prisma.$disconnect()
    if (globalForPrisma.pool) {
      await globalForPrisma.pool.end()
    }
  }

  process.on('beforeExit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}
