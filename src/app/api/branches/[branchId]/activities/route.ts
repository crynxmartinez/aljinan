import type { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyBranchAccess } from '@/lib/permissions'
import { enforceRateLimit } from '@/lib/rate-limit'

type Context = { params: Promise<{ branchId: string }> }

export async function GET(request: Request, { params }: Context) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { branchId } = await params
  if (!await verifyBranchAccess(branchId, session.user.id, session.user.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
  const query = new URL(request.url).searchParams
  const cursor = query.get('before')
  const beforeId = query.get('beforeId')
  if (cursor && !Number.isFinite(Date.parse(cursor))) return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 })
  // Comments are shared. Internal lifecycle records may reference unpublished contracts.
  const rows = await prisma.activity.findMany({
    where: { branchId, type: 'COMMENT', ...(cursor ? { OR: [{ createdAt: { lt: new Date(cursor) } }, ...(beforeId ? [{ createdAt: new Date(cursor), id: { lt: beforeId } }] : [])] } : {}) },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 100,
  })
  const users = await prisma.user.findMany({ where: { id: { in: [...new Set(rows.map(row => row.createdById))] } }, select: { id: true, name: true } })
  const names = new Map(users.map(user => [user.id, user.name]))
  return NextResponse.json(rows.reverse().map(row => ({ ...row, createdByName: names.get(row.createdById) ?? null })))
}

export async function POST(request: Request, { params }: Context) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { branchId } = await params
  if (!await verifyBranchAccess(branchId, session.user.id, session.user.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, { name: 'branch-comment', limit: 30, window: 60 })
  if (limited) return limited
  let body: { content?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  if (typeof body.content !== 'string' || !body.content.trim() || body.content.length > 5000) {
    return NextResponse.json({ error: 'Comment must contain 1 to 5000 characters' }, { status: 400 })
  }
  const activity = await prisma.activity.create({ data: {
    branchId, type: 'COMMENT', content: body.content.trim(), createdById: session.user.id, createdByRole: session.user.role as UserRole,
  } })
  return NextResponse.json(activity, { status: 201 })
}
