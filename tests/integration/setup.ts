import { beforeAll } from 'vitest'

/**
 * Guard rail for the integration suite.
 *
 * These tests create and delete real rows and sign in with published passwords. The repo
 * previously had no development database at all, so the local .env pointed at production
 * while the working tree contained scripts that deleted every client. Refusing to run
 * against anything but localhost is the cheapest way to make that mistake impossible.
 */
beforeAll(() => {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error(
      'DATABASE_URL is not set.\n\n' +
        'Start the local database first:\n' +
        '  node scripts/dev-db.mjs start\n' +
        '  npx prisma migrate deploy\n' +
        '  npx tsx prisma/seed-dev.ts\n'
    )
  }

  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    throw new Error(
      'Refusing to run the integration suite against a non-local database.\n\n' +
        `DATABASE_URL points at: ${url.replace(/\/\/[^@]*@/, '//***@')}\n\n` +
        'These tests write and delete rows and use well-known passwords. Point ' +
        'DATABASE_URL at the local development database.'
    )
  }
})
