import { spawnSync } from 'node:child_process'
// Only production may migrate the shared database automatically. Preview builds
// must use an already-migrated isolated database; they never alter production.
const command = process.env.VERCEL_ENV === 'production' ? 'deploy' : 'status'
const result = spawnSync('npx', ['prisma', 'migrate', command], { stdio: 'inherit', shell: process.platform === 'win32' })
if (result.status !== 0) {
  console.error('Database migrations must be current before publishing this application.')
  process.exit(result.status ?? 1)
}
const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' })
process.exit(build.status ?? 1)
