import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'el_admin@tasheel.com'
  const password = 'admin123'
  const hashedPassword = await bcrypt.hash(password, 12)

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin user already exists: ${email}`)
    return
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Tasheel Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
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

  console.log(`✅ Admin user created successfully!`)
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
  console.log(`   User ID: ${user.id}`)
}

main()
  .catch((e) => {
    console.error('Failed to seed admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
