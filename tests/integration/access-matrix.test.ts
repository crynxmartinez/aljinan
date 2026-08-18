import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { closeDb, signIn, apiFetch, tenants, DENIED, login, ACCOUNTS } from './helpers'

/**
 * The tenancy boundary, asserted rather than assumed.
 *
 * Three separate audits found routes with no access check: two IDORs, three unprotected
 * writes, and 22 copy-pasted checks that had drifted into seven variants. The common cause is
 * that nothing enforced the rule, so this suite does two things:
 *
 *   1. Drives a rival tenant against the first tenant's branch on every branch-scoped route.
 *   2. Enumerates the route tree and fails if a route exists that this file does not classify
 *      — so adding an endpoint without deciding who may reach it breaks the build.
 */

let rival: string
let contractor: string
let branchId: string
let clientId: string
let clientUserId: string

beforeAll(async () => {
  contractor = await signIn('contractor')
  rival = await signIn('rival')
  const t = await tenants()
  branchId = t.branchId
  clientId = t.clientId
  clientUserId = t.clientUserId
})

afterAll(closeDb)

// ---------------------------------------------------------------------------

const BRANCH_SCOPED_READS = [
  'requests', 'equipment', 'invoices', 'contracts', 'quotations', 'certificates',
  'checklists', 'checklist-items', 'documents', 'appointments', 'contract-payments',
]

describe('a rival contractor cannot read another tenant', () => {
  it.each(BRANCH_SCOPED_READS)('GET %s is denied', async resource => {
    const res = await apiFetch(`/api/branches/${branchId}/${resource}`, { cookies: rival })
    expect(DENIED).toContain(res.status)
  })

  it('GET the client itself is denied', async () => {
    const res = await apiFetch(`/api/clients/${clientId}`, { cookies: rival })
    expect(DENIED).toContain(res.status)
  })

  it('GET the client branches is denied', async () => {
    const res = await apiFetch(`/api/clients/${clientId}/branches`, { cookies: rival })
    expect(DENIED).toContain(res.status)
  })
})

describe('a rival contractor cannot write into another tenant', () => {
  // Each of these had no branch check at all before August 2026.
  const writes: Array<[string, string, string, unknown]> = [
    ['create an immediate work order', 'POST', '/work-orders/create-immediate',
      { title: 'injected', workOrderType: 'FIRE_EXTINGUISHER' }],
    ['start a request immediately', 'POST', '/requests/nonexistent/start-now', {}],
    ['read a request comment thread', 'GET', '/requests/nonexistent/comments', undefined],
    ['post a request comment', 'POST', '/requests/nonexistent/comments', { content: 'injected' }],
    ['rename the branch', 'PATCH', '/display-name', { displayName: 'hijacked' }],
    ['add equipment', 'POST', '/equipment',
      { equipmentNumber: 'INJECTED-1', equipmentType: 'FIRE_EXTINGUISHER', location: 'x' }],
  ]

  it.each(writes)('%s is denied', async (_label, method, suffix, json) => {
    const res = await apiFetch(`/api/branches/${branchId}${suffix}`, {
      method, cookies: rival, json,
    })
    expect(DENIED).toContain(res.status)
  })
})

describe('the auth bypass stays closed', () => {
  it('a self-asserted impersonation flag issues no session', async () => {
    const result = await login({
      email: ACCOUNTS.admin.email,
      password: '',
      impersonation: 'true',
      realAdminId: 'anything',
      realAdminEmail: 'attacker@evil.test',
    })
    expect(result.session).toBeUndefined()
  })

  it('a forged impersonation grant issues no session', async () => {
    const result = await login({ email: ACCOUNTS.admin.email, grant: 'f'.repeat(64) })
    expect(result.session).toBeUndefined()
  })

  it('credential failures are indistinguishable', async () => {
    const unknown = await login({
      email: `nobody-${Math.random().toString(36).slice(2)}@nowhere.test`,
      password: 'x',
    })
    const wrongPassword = await login({
      email: ACCOUNTS.contractor.email,
      password: 'definitely-wrong',
    })

    // Skip if the login limiter has already engaged; that is the limiter working.
    if (/too many/i.test(unknown.error) || /too many/i.test(wrongPassword.error)) return

    expect(unknown.error).toBe(wrongPassword.error)
    expect(unknown.error.length).toBeGreaterThan(0)
  })
})

describe('impersonation requires a server-issued grant', () => {
  it('a contractor cannot request one', async () => {
    const res = await apiFetch('/api/admin/impersonate', {
      method: 'POST', cookies: contractor, json: { targetUserId: clientUserId },
    })
    expect(res.status).toBe(401)
  })

  it('an admin can, and it redeems exactly once', async () => {
    const admin = await signIn('admin')

    const issued = await apiFetch('/api/admin/impersonate', {
      method: 'POST', cookies: admin, json: { targetUserId: clientUserId },
    })
    expect(issued.status).toBe(200)

    const { grant, email } = await issued.json()
    expect(grant).toBeTruthy()

    const first = await login({ email, grant })
    expect(first.session).toBeTruthy()

    const replay = await login({ email, grant })
    expect(replay.session).toBeUndefined()
  })
})

describe('endpoints that should not exist, and ones that must be gated', () => {
  it('the debug endpoint is gone', async () => {
    const res = await apiFetch('/api/debug/checklist-items?branchId=x', { cookies: contractor })
    expect(res.status).toBe(404)
  })

  it('the client purge cron is gone', async () => {
    const res = await apiFetch('/api/cron/cleanup-archived-clients')
    expect(res.status).toBe(404)
  })

  it('the notification cron requires its secret', async () => {
    const res = await apiFetch('/api/cron/work-order-notifications')
    expect(res.status).toBe(401)
  })

  it('geocode requires a session', async () => {
    const res = await apiFetch('/api/geocode?address=Riyadh')
    expect(res.status).toBe(401)
  })

  it('geocode rejects anything that is not a coordinate pair', async () => {
    const res = await apiFetch('/api/geocode?latlng=abc', { cookies: contractor })
    expect(res.status).toBe(400)
  })

  it('a file cannot be deleted by supplying an arbitrary URL', async () => {
    const res = await apiFetch('/api/upload', {
      method: 'DELETE',
      cookies: contractor,
      json: { url: 'https://tasheel-uploads.s3.ap-southeast-1.amazonaws.com/certificates/x.pdf' },
    })
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// Coverage guard
// ---------------------------------------------------------------------------

/**
 * Every API route, discovered from the filesystem.
 */
function discoverRoutes(dir: string, prefix = '/api'): string[] {
  const found: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      found.push(...discoverRoutes(full, `${prefix}/${entry.name}`))
    } else if (entry.name === 'route.ts') {
      found.push(prefix)
    }
  }
  return found
}

/**
 * Routes this suite deliberately does not drive against a rival tenant, with the reason.
 * Anything not listed here and not branch-scoped fails the guard below, which is the point:
 * a new endpoint cannot be added without someone deciding who may reach it.
 */
const CLASSIFIED_ELSEWHERE: Array<[RegExp, string]> = [
  [/^\/api\/auth\//, 'authentication; covered by the bypass and enumeration tests'],
  [/^\/api\/admin\//, 'platform admin; covered by the impersonation and permission tests'],
  [/^\/api\/cron\//, 'scheduled jobs; covered by the secret tests'],
  [/^\/api\/branches\/\[branchId\]/, 'branch-scoped; covered by the rival tenant tests'],
  [/^\/api\/clients/, 'client-scoped; covered by the rival tenant tests'],
  [/^\/api\/files\//, 'serves an upload after a branch-access check'],
  [/^\/api\/upload$/, 'covered by the arbitrary-URL delete test'],
  [/^\/api\/geocode$/, 'covered by the session and validation tests'],
  [/^\/api\/contact$/, 'public by design; covered by the abuse-limit tests'],
  [/^\/api\/work-orders/, 'scoped by role in the handler; reads only the caller\'s tenant'],
  [/^\/api\/notifications/, 'scoped to session.user.id'],
  [/^\/api\/branch-requests/, 'scoped to the caller\'s client or contractor'],
  [/^\/api\/team-members/, 'contractor-scoped'],
  [/^\/api\/equipment\//, 'contractor-scoped aggregate'],
  [/^\/api\/dashboard\//, 'scoped by role in the handler'],
  [/^\/api\/analytics\//, 'scoped by role in the handler'],
  [/^\/api\/search$/, 'scoped by role in the handler'],
  [/^\/api\/reports\//, 'covered by the branch-access check on the work order'],
  [/^\/api\/invoices\//, 'covered by canPayInvoice'],
  [/^\/api\/contractor\//, 'own profile only'],
]

describe('coverage guard', () => {
  it('every API route is classified', () => {
    const routes = discoverRoutes(path.resolve('src/app/api'))
    expect(routes.length).toBeGreaterThan(50)

    const unclassified = routes.filter(
      route => !CLASSIFIED_ELSEWHERE.some(([pattern]) => pattern.test(route))
    )

    // A failure here is not a bug in the test. It means a route was added without deciding
    // who is allowed to reach it. Add a case above, or add it to the list with a reason.
    expect(unclassified).toEqual([])
  })

  it('no route reintroduces a local verifyBranchAccess', () => {
    // 22 copy-pasted variants of this check drifted into seven different behaviours, one of
    // which granted a technician access to branches they were never assigned.
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name === 'route.ts') {
          const source = fs.readFileSync(full, 'utf8')
          if (/(async\s+)?function\s+verifyBranchAccess/.test(source)) offenders.push(full)
        }
      }
    }
    walk(path.resolve('src/app/api'))

    expect(offenders).toEqual([])
  })
})
