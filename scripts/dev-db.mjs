/**
 * Throwaway local Postgres for development and tests.
 *
 * The repo previously had no development database, so the local .env pointed at production
 * — alongside scripts that deleted every client. This gives you a real Postgres that is
 * unmistakably not production: a non-default port and its own data directory.
 *
 *   node scripts/dev-db.mjs init     # create the cluster and database (run once)
 *   node scripts/dev-db.mjs start    # run in the foreground until interrupted
 *   node scripts/dev-db.mjs stop
 *
 * Then point .env at it:
 *   DATABASE_URL="postgresql://tasheel:tasheel@localhost:55432/tasheel_dev"
 */

import EmbeddedPostgres from 'embedded-postgres'
import fs from 'fs'
import path from 'path'

const PORT = 55432
const DATA_DIR = process.env.DEV_DB_DIR || path.join(process.cwd(), '.devdb')

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: 'tasheel',
  password: 'tasheel',
  port: PORT,
  persistent: true,
  // Match production. Without this, initdb inherits the Windows locale (WIN1252 on an
  // English install) and any Arabic company or branch name fails to insert with
  // "no equivalent in encoding WIN1252" — which would look like an application bug.
  initdbFlags: ['--encoding=UTF8', '--no-locale'],
})

const action = process.argv[2]

if (action === 'init') {
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`initialising cluster in ${DATA_DIR} ...`)
    await pg.initialise()
  } else {
    console.log(`reusing cluster in ${DATA_DIR}`)
  }

  await pg.start()
  console.log(`started on port ${PORT}`)

  try {
    await pg.createDatabase('tasheel_dev')
    console.log('created database tasheel_dev')
  } catch {
    console.log('database tasheel_dev already exists')
  }

  await pg.stop()
  console.log('init complete')
} else if (action === 'start') {
  await pg.start()
  console.log(`READY postgresql://tasheel:tasheel@localhost:${PORT}/tasheel_dev`)
  await new Promise(() => {}) // hold open
} else if (action === 'stop') {
  await pg.stop()
  console.log('stopped')
} else {
  console.error('usage: node scripts/dev-db.mjs <init|start|stop>')
  process.exitCode = 1
}
