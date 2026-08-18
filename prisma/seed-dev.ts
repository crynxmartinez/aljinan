/**
 * Seed a usable local environment: one platform admin and one contractor, both ACTIVE with
 * known passwords and no forced rotation, so you can sign in and exercise the app straight
 * away.
 *
 * Refuses to run unless DATABASE_URL points at a local database, because this writes users
 * with published passwords.
 *
 *   npx tsx prisma/seed-dev.ts
 */

import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

const ADMIN_EMAIL = 'admin@tasheel.local'
const ADMIN_PASSWORD = 'DevAdmin123!'
const CONTRACTOR_EMAIL = 'contractor@tasheel.local'
const CONTRACTOR_PASSWORD = 'DevContractor123!'

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL || ''
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url)

  if (!isLocal) {
    throw new Error(
      'Refusing to seed: DATABASE_URL does not point at localhost.\n' +
        'This seed creates accounts with well-known passwords and must never touch a ' +
        'shared or production database.'
    )
  }
}

async function main() {
  assertLocalDatabase()

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  const contractorHash = await bcrypt.hash(CONTRACTOR_PASSWORD, 12)

  // --- platform admin ---
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password: adminHash, status: 'ACTIVE', mustChangePassword: false },
    create: {
      email: ADMIN_EMAIL,
      password: adminHash,
      name: 'Dev Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      mustChangePassword: false,
      admin: {
        create: {
          adminRole: 'SUPER_ADMIN',
          canManageContractors: true,
          canManageAdmins: true,
          canImpersonateUsers: true,
          canViewAnalytics: true,
          canManageMessages: true,
          canManagePlatform: true,
        },
      },
    },
  })

  // --- contractor ---
  const contractor = await prisma.user.upsert({
    where: { email: CONTRACTOR_EMAIL },
    update: { password: contractorHash, status: 'ACTIVE', mustChangePassword: false },
    create: {
      email: CONTRACTOR_EMAIL,
      password: contractorHash,
      name: 'Dev Contractor',
      role: 'CONTRACTOR',
      status: 'ACTIVE',
      mustChangePassword: false,
      contractor: {
        create: {
          companyName: 'Al Jinan Fire & Safety',
          companyEmail: CONTRACTOR_EMAIL,
          companyPhone: '+966500000000',
          companyAddress: 'Riyadh, Saudi Arabia',
          isVerified: true,
        },
      },
    },
  })

  console.log('seeded:')
  console.log(`  ADMIN       ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}   (${admin.id})`)
  console.log(`  CONTRACTOR  ${CONTRACTOR_EMAIL} / ${CONTRACTOR_PASSWORD}   (${contractor.id})`)
}

main()
  .catch(e => {
    console.error('Failed to seed:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
