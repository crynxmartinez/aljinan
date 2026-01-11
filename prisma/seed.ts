import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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
