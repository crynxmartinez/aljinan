import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid request' }, { status: 400 }) }
  const locale = body && typeof body === 'object' && 'locale' in body ? body.locale : undefined
  if (locale !== 'en' && locale !== 'ar') return Response.json({ error: 'Invalid locale' }, { status: 400 })
  await prisma.user.update({ where: { id: session.user.id }, data: { preferredLocale: locale } })
  return Response.json({ locale })
}
