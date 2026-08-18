/**
 * Seed a second contractor tenant with its own client and branch.
 *
 * Cross-tenant bugs are invisible with only one tenant in the database, which is how a
 * blanket "contractors can access all branches" rule survived. scripts/verify-security.mjs
 * uses this tenant to prove the boundary holds.
 *
 * Prints the ids the verification script needs, as shell exports.
 *
 *   npx tsx scripts/seed-second-tenant.ts
 */

import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

const RIVAL_EMAIL = 'rival@tasheel.local'
const RIVAL_PASSWORD = 'DevRival123!'

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL || ''
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    throw new Error(
      'Refusing to seed: DATABASE_URL does not point at localhost. This creates accounts ' +
        'with well-known passwords and must never touch a shared or production database.'
    )
  }
}

async function main() {
  assertLocalDatabase()

  const hash = await bcrypt.hash(RIVAL_PASSWORD, 12)

  const rivalUser = await prisma.user.upsert({
    where: { email: RIVAL_EMAIL },
    update: { password: hash, status: 'ACTIVE', mustChangePassword: false },
    create: {
      email: RIVAL_EMAIL,
      password: hash,
      name: 'Rival Contractor',
      role: 'CONTRACTOR',
      status: 'ACTIVE',
      mustChangePassword: false,
      contractor: { create: { companyName: 'Rival Safety Co', isVerified: true } },
    },
  })

  const rivalContractor = await prisma.contractor.findUniqueOrThrow({
    where: { userId: rivalUser.id },
  })

  const rivalClientUser = await prisma.user.upsert({
    where: { email: 'rivalclient@tasheel.local' },
    update: {},
    create: {
      email: 'rivalclient@tasheel.local',
      password: '',
      name: 'Rival Client',
      role: 'CLIENT',
      status: 'ACTIVE',
    },
  })

  const rivalClient = await prisma.client.upsert({
    where: { userId: rivalClientUser.id },
    update: {},
    create: {
      userId: rivalClientUser.id,
      contractorId: rivalContractor.id,
      companyName: 'Rival Client Co',
      slug: 'rival-client-co',
    },
  })

  const existingRivalBranch = await prisma.branch.findFirst({
    where: { clientId: rivalClient.id },
  })
  const rivalBranch =
    existingRivalBranch ??
    (await prisma.branch.create({
      data: {
        clientId: rivalClient.id,
        name: 'Rival Branch',
        slug: 'rival-branch',
        address: 'Jeddah',
      },
    }))

  // The first tenant's branch, which the rival must never reach.
  const victim = await prisma.branch.findFirst({
    where: { client: { contractor: { user: { email: 'contractor@tasheel.local' } } } },
    select: { id: true, name: true, clientId: true },
  })

  const victimClient = await prisma.user.findFirst({
    where: { role: 'CLIENT', client: { contractor: { user: { email: 'contractor@tasheel.local' } } } },
    select: { id: true },
  })

  console.log(`seeded second tenant: ${RIVAL_EMAIL} / ${RIVAL_PASSWORD}`)
  console.log(`  rival branch: ${rivalBranch.id}`)

  if (!victim) {
    console.log('\nNo branch found for the first tenant. Create a client and branch as')
    console.log('contractor@tasheel.local, then re-run this to get the ids.')
    return
  }

  console.log(`\nExport these before running scripts/verify-security.mjs:\n`)
  console.log(`  export VERIFY_VICTIM_BRANCH_ID=${victim.id}`)
  console.log(`  export VERIFY_VICTIM_CLIENT_ID=${victim.clientId}`)
  if (victimClient) {
    console.log(`  export VERIFY_TARGET_USER_ID=${victimClient.id}`)
  }
}

main()
  .catch(e => {
    console.error('Failed to seed:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
