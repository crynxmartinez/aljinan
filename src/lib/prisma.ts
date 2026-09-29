import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Use connection pooling URL in production (DATABASE_URL_POOLED)
  // Use direct URL for migrations (DATABASE_URL)
  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL or DATABASE_URL_POOLED must be set')
  }

  return new PrismaClient({
    datasources: { db: { url: connectionString } },
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Reuse Prisma instance globally (critical for serverless connection management)
globalForPrisma.prisma = prisma

// Graceful shutdown. Three signals can fire for one exit, so run disconnect at most once.
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
