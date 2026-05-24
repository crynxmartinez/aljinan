import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  // Delete all contracts (cascade will delete systems, payments, and linked checklists)
  const deletedContracts = await prisma.contract.deleteMany({})
  console.log('Deleted contracts:', deletedContracts.count)

  // Also delete any orphaned checklists that were linked to contracts
  const deletedChecklists = await prisma.checklist.deleteMany({
    where: { contractId: { not: null } }
  })
  console.log('Deleted contract checklists:', deletedChecklists.count)
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
