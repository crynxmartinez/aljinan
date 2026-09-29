import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aljinan.com' },
    update: {},
    create: {
      email: 'admin@aljinan.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'CONTRACTOR',
      status: 'ACTIVE',
      contractor: {
        create: {
          companyName: 'Aljinan Admin',
          isVerified: true,
        },
      },
    },
  })

  console.log('Created admin user:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
