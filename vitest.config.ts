import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Two test projects, because they need different things.
 *
 * `unit` runs pure functions and needs nothing. `integration` needs a live Postgres and,
 * for the HTTP-level suites, a running dev server — so it is excluded from the default run
 * and invoked explicitly. That keeps `npm test` fast enough to be worth running on every
 * change, which is the difference between a suite people use and one they route around.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'tests/integration/**'],
    // These suites talk to a database and an HTTP server; parallel runs would fight over
    // the same rows.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
