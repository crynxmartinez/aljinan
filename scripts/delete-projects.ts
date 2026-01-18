import { prisma } from '../src/lib/prisma'

async function main() {
  const deleted = await prisma.project.deleteMany({})
  console.log(`Deleted ${deleted.count} projects`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
