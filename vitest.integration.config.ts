import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Integration tests. These need a live local Postgres, and the HTTP suites need the dev
 * server running:
 *
 *   node scripts/dev-db.mjs start
 *   npx prisma migrate deploy
 *   npx tsx prisma/seed-dev.ts
 *   npx tsx scripts/seed-second-tenant.ts
 *   npm run dev
 *   npm run test:integration
 *
 * They refuse to run against anything but localhost — see tests/integration/setup.ts.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    // Shared database state; running files in parallel makes them fight.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
})
