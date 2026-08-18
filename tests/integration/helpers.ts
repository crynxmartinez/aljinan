import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

export const BASE = process.env.VERIFY_BASE_URL || 'http://localhost:3000'

export const ACCOUNTS = {
  admin: { email: 'admin@tasheel.local', password: 'DevAdmin123!' },
  contractor: { email: 'contractor@tasheel.local', password: 'DevContractor123!' },
  rival: { email: 'rival@tasheel.local', password: 'DevRival123!' },
} as const

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

export async function closeDb() {
  await prisma.$disconnect()
  await pool.end()
}

/**
 * Sign in the way a browser does.
 *
 * Without `json: 'true'` next-auth answers 302 and puts the failure message in the error
 * query parameter — which is what makes differing messages observable to an attacker, so the
 * tests read it from there.
 */
export async function login(
  fields: Record<string, string>
): Promise<{ cookies: string; session?: string; error: string }> {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`)
  const csrfCookies = csrfRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ')
  const { csrfToken } = await csrfRes.json()

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: csrfCookies },
    body: new URLSearchParams({ csrfToken, ...fields }),
    redirect: 'manual',
  })

  const jar = res.headers.getSetCookie().map(c => c.split(';')[0])
  const location = res.headers.get('location') || ''

  return {
    cookies: jar.join('; '),
    session: jar.find(c => c.startsWith('next-auth.session-token=')),
    error: new URL(location, BASE).searchParams.get('error') || '',
  }
}

export async function signIn(account: keyof typeof ACCOUNTS): Promise<string> {
  const result = await login(ACCOUNTS[account])

  if (!result.session) {
    // Five attempts per address per fifteen minutes. Repeated runs exhaust it, and the
    // in-memory limiter only resets when the dev server restarts.
    throw new Error(
      `Could not sign in as ${account}: ${result.error || 'no session issued'}.\n` +
        'If this says the login limit was reached, restart the dev server.'
    )
  }

  return result.cookies
}

/** Any of these means "refused"; which one depends on whether existence is disclosed. */
export const DENIED = [401, 403, 404]

export async function apiFetch(
  path: string,
  init: RequestInit & { cookies?: string; json?: unknown } = {}
): Promise<Response> {
  const { cookies, json, headers, ...rest } = init
  return fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookies ? { Cookie: cookies } : {}),
      ...(headers || {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
}

/** The seeded first tenant, and the rival tenant that must never reach it. */
export async function tenants() {
  const contractorUser = await prisma.user.findUniqueOrThrow({
    where: { email: ACCOUNTS.contractor.email },
    select: { id: true },
  })

  const branch = await prisma.branch.findFirstOrThrow({
    where: { client: { contractor: { userId: contractorUser.id } } },
    select: { id: true, clientId: true },
  })

  const clientUser = await prisma.user.findFirstOrThrow({
    where: { role: 'CLIENT', client: { id: branch.clientId } },
    select: { id: true },
  })

  return {
    contractorUserId: contractorUser.id,
    branchId: branch.id,
    clientId: branch.clientId,
    clientUserId: clientUser.id,
  }
}

/** A checklist to hang test work orders from. */
export async function adhocChecklist(branchId: string, createdById: string) {
  const existing = await prisma.checklist.findFirst({
    where: { branchId, contractId: null, status: 'IN_PROGRESS' },
  })
  if (existing) return existing

  return prisma.checklist.create({
    data: { branchId, contractId: null, title: 'Tests', status: 'IN_PROGRESS', createdById },
  })
}
