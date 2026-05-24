import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL must be set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Delete orphaned contract work orders (items with contractSystemId or contract-like descriptions)
  const deletedItems = await prisma.checklistItem.deleteMany({
    where: {
      OR: [
        { contractSystemId: { not: null } },
        { description: { contains: 'Visit' } },
        { type: 'SCHEDULED' }
      ]
    }
  })
  console.log('Deleted contract work orders:', deletedItems.count)

  // Delete all contracts (cascade will delete systems, payments)
  const deletedContracts = await prisma.contract.deleteMany({})
  console.log('Deleted contracts:', deletedContracts.count)

  // Delete any orphaned checklists that were linked to contracts
  const deletedChecklists = await prisma.checklist.deleteMany({
    where: { contractId: { not: null } }
  })
  console.log('Deleted contract checklists:', deletedChecklists.count)
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
