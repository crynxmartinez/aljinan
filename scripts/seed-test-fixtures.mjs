/**
 * Give the first tenant a client and a branch, so the integration tests have something to
 * assert against — and use Arabic names, since that is what exposed the slug bug.
 *
 * Idempotent, and refuses to run against anything but a local database.
 *
 *   node scripts/seed-test-fixtures.mjs
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error('Refusing to seed fixtures against a non-local database')
  process.exit(1)
}

const pool = new Pool({ connectionString: url })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const CLIENT_EMAIL = 'jinan.client@tasheel.local'

try {
  const contractor = await prisma.contractor.findFirstOrThrow({
    where: { user: { email: 'contractor@tasheel.local' } },
    select: { id: true },
  })

  const clientUser = await prisma.user.upsert({
    where: { email: CLIENT_EMAIL },
    update: {},
    create: {
      email: CLIENT_EMAIL,
      password: '',
      name: 'شركة الجنان للسلامة',
      role: 'CLIENT',
      status: 'ACTIVE',
    },
  })

  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      contractorId: contractor.id,
      companyName: 'شركة الجنان للسلامة',
      slug: 'shrkh-aljnan-llslamh',
      companyEmail: CLIENT_EMAIL,
    },
  })

  let branch = await prisma.branch.findFirst({ where: { clientId: client.id } })
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        clientId: client.id,
        name: 'فرع الرياض',
        slug: 'fra-alryad',
        address: 'King Fahd Road, Riyadh',
        city: 'Riyadh',
        country: 'Saudi Arabia',
      },
    })
  }

  console.log('fixtures ready:')
  console.log(`  client ${client.id} (${client.companyName})`)
  console.log(`  branch ${branch.id} (${branch.name})`)
} catch (error) {
  console.error('Failed to seed fixtures:', error.message)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
  await pool.end()
}
