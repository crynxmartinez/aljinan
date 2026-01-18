import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteBranch() {
  try {
    // Find all branches
    const branches = await prisma.branch.findMany({
      include: {
        client: true
      }
    })

    console.log('Found branches:', branches.map(b => ({ id: b.id, name: b.name, client: b.client.companyName })))

    if (branches.length === 0) {
      console.log('No branches found')
      return
    }

    // Delete all branches (cascade will delete related data)
    for (const branch of branches) {
      console.log(`Deleting branch: ${branch.name} (${branch.id})...`)
      await prisma.branch.delete({
        where: { id: branch.id }
      })
      console.log(`Deleted branch: ${branch.name}`)
    }

    console.log('All branches deleted successfully')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteBranch()
