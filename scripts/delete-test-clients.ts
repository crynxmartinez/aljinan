import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Find all client users (role = CLIENT)
  const clientUsers = await prisma.user.findMany({
    where: { role: 'CLIENT' }
  })

  console.log('Found client users:', clientUsers.length)

  for (const user of clientUsers) {
    console.log(`Deleting user: ${user.email}`)
    
    // Delete the user (will cascade delete the client)
    await prisma.user.delete({
      where: { id: user.id }
    })
  }

  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => {
    pool.end()
    process.exit(0)
  })
