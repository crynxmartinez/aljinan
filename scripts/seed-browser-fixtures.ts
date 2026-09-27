import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) throw new Error('Browser fixtures require an isolated local database')
async function seed() {
  const password = await bcrypt.hash('BrowserOnly123!', 12)
  const owner = await prisma.user.create({ data: { email: 'browser-owner@tasheel.local', password, name: 'Browser owner', role: 'CONTRACTOR', status: 'ACTIVE', contractor: { create: { companyName: 'Browser fixture company', companyEmail: 'browser-owner@tasheel.local' } } }, include: { contractor: true } })
  const client = await prisma.user.create({ data: { email: 'browser-client@tasheel.local', password, name: 'Browser client', role: 'CLIENT', status: 'ACTIVE', client: { create: { contractorId: owner.contractor!.id, companyName: 'Browser fixture client', slug: 'browser-client' } } }, include: { client: true } })
  const branch = await prisma.branch.create({ data: { clientId: client.client!.id, name: 'Browser fixture branch', slug: 'browser-branch', address: 'Test address', city: 'Riyadh', country: 'Saudi Arabia' } })
  await prisma.user.create({ data: { email: 'browser-admin@tasheel.local', password, name: 'Browser admin', role: 'ADMIN', status: 'ACTIVE', admin: { create: { adminRole: 'SUPER_ADMIN' } } } })
  for (const teamRole of ['TECHNICIAN', 'SUPERVISOR'] as const) await prisma.user.create({ data: { email: `browser-${teamRole.toLowerCase()}@tasheel.local`, password, name: teamRole, role: 'TEAM_MEMBER', status: 'ACTIVE', teamMember: { create: { contractorId: owner.contractor!.id, teamRole, branchAccess: { create: { branchId: branch.id } } } } } })
  await prisma.request.create({ data: { branchId: branch.id, title: 'Browser quote fixture', description: 'Customer supplied description', createdById: client.id, createdByRole: 'CLIENT', status: 'QUOTED', quotedPrice: 0, workOrderType: 'SERVICE' } })
  const checklist = await prisma.checklist.create({ data: { branchId: branch.id, title: 'Browser fixture', status: 'IN_PROGRESS', createdById: owner.id } })
  for (const stage of ['SCHEDULED', 'IN_PROGRESS', 'FOR_REVIEW', 'COMPLETED'] as const) await prisma.checklistItem.create({ data: { checklistId: checklist.id, description: `Browser fixture ${stage}`, stage, price: 0 } })
}
seed().finally(() => prisma.$disconnect())
