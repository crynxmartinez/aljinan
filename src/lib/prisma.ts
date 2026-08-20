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
    max: 3,                     // Minimal connections per serverless instance
    min: 0,                     // No minimum connections
    idleTimeoutMillis: 10000,   // Close idle connections after 10s (faster cleanup)
    connectionTimeoutMillis: 3000, // Fail fast if can't connect
    allowExitOnIdle: true,      // Allow process to exit when idle
  })

  // Reuse pool globally to avoid connection leaks in both dev and production (serverless)
  globalForPrisma.pool = pool

  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Reuse Prisma instance globally (critical for serverless connection management)
globalForPrisma.prisma = prisma

// Graceful shutdown. Three signals can fire for one exit, and pg throws
// "Called end on pool more than once" on a second end() — which surfaced as a crash at the
// end of otherwise successful scripts. Run at most once, and never let teardown throw.
if (typeof window === 'undefined') {
  let shuttingDown = false

  const cleanup = async () => {
    if (shuttingDown) return
    shuttingDown = true

    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Error disconnecting Prisma:', error)
    }

    try {
      await globalForPrisma.pool?.end()
    } catch {
      // already closed
    }
  }

  // Registered once per process. Under dev HMR this module can be re-evaluated, so guard
  // against stacking listeners and tripping the max-listeners warning.
  const marker = '__tasheelPrismaCleanupRegistered'
  const globalWithMarker = globalThis as unknown as Record<string, boolean>

  if (!globalWithMarker[marker]) {
    globalWithMarker[marker] = true
    process.once('beforeExit', cleanup)
    process.once('SIGINT', cleanup)
    process.once('SIGTERM', cleanup)
  }
}
