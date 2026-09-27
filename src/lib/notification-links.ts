import { prisma } from '@/lib/prisma'

/** Repair the precise historical route shape; do not accept arbitrary redirect URLs. */
export async function resolveNotificationLink(link: string | null | undefined): Promise<string | null> {
  if (!link) return null
  const match = /^\/dashboard\/branches\/([^/?]+)\/(requests|work-orders|checklist|contracts)(?:\?.*)?$/.exec(link)
  if (!match) return link.replace('?tab=work-orders', '?tab=checklist')
  const branch = await prisma.branch.findUnique({ where: { id: match[1] }, select: { id: true, clientId: true } })
  if (!branch) return null
  const tab = match[2] === 'work-orders' ? 'checklist' : match[2]
  return `/dashboard/clients/${branch.clientId}/branches/${branch.id}?tab=${tab}`
}
