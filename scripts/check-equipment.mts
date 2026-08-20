import { prisma } from '../src/lib/prisma'
const count = await prisma.equipment.count()
console.log('Total equipment:', count)
const all = await prisma.equipment.findMany({ select: { id: true, branchId: true, equipmentNumber: true, equipmentType: true } })
console.log(JSON.stringify(all, null, 2))

const branches = await prisma.branch.findMany({ select: { id: true, name: true, clientId: true } })
console.log('\nBranches:', JSON.stringify(branches, null, 2))
await prisma.$disconnect()
