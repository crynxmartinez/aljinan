/**
 * Black-box verification of the access-control and abuse fixes.
 *
 * Runs against a live dev server and a seeded local database. This exists because there
 * were no tests at all, and the defects it covers — an auth bypass, cross-tenant reads and
 * writes, unauthenticated endpoints — are exactly the kind that a type-checker cannot see.
 *
 * Setup:
 *   node scripts/dev-db.mjs start
 *   npx prisma migrate deploy
 *   npx tsx prisma/seed-dev.ts
 *   npx tsx scripts/seed-second-tenant.ts
 *   npm run dev
 *
 * Then:
 *   node scripts/verify-security.mjs
 */

const BASE = process.env.VERIFY_BASE_URL || 'http://localhost:3000'

const CONTRACTOR = { email: 'contractor@tasheel.local', password: 'DevContractor123!' }
const ADMIN = { email: 'admin@tasheel.local', password: 'DevAdmin123!' }
const RIVAL = { email: 'rival@tasheel.local', password: 'DevRival123!' }

let pass = 0
let fail = 0
let skip = 0

function check(ok, name, detail = '') {
  if (ok) {
    pass++
    console.log(`  PASS  ${name}`)
  } else {
    fail++
    console.log(`  FAIL  ${name}${detail ? `  <- ${detail}` : ''}`)
  }
}

/**
 * Re-running this script exhausts the very limits it verifies: login allows five attempts
 * per address per fifteen minutes, and the contact form five per hour. A limited response
 * is the limiter working, not a regression — so record it as skipped rather than failed.
 */
function skipped(name, why) {
  skip++
  console.log(`  SKIP  ${name}  <- ${why}`)
}

function isRateLimited(errorOrStatus) {
  if (typeof errorOrStatus === 'number') return errorOrStatus === 429
  return /too many/i.test(String(errorOrStatus || ''))
}

function section(title) {
  console.log(`\n--- ${title} ---`)
}

async function getCsrf() {
  const res = await fetch(`${BASE}/api/auth/csrf`)
  const cookies = res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ')
  const { csrfToken } = await res.json()
  return { csrfToken, cookies }
}

/**
 * Sign in the way the browser does. Without json:true NextAuth answers 302 and puts the
 * failure message in ?error=, which is what makes message differences observable.
 */
async function login(fields) {
  const { csrfToken, cookies } = await getCsrf()
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookies },
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

async function main() {
  // ---------------------------------------------------------------------------
  section('auth bypass (C-01)')

  const bypass = await login({
    email: ADMIN.email,
    password: '',
    impersonation: 'true',
    realAdminId: 'anything',
    realAdminEmail: 'attacker@evil.test',
  })
  check(!bypass.session, 'a self-asserted impersonation flag issues no session',
    bypass.session ? 'GOT AN ADMIN SESSION' : '')

  const forged = await login({ email: ADMIN.email, grant: 'f'.repeat(64) })
  check(!forged.session, 'a forged impersonation grant issues no session')

  // ---------------------------------------------------------------------------
  section('account enumeration (C-01)')

  // A fresh address per run, so this probe never collides with its own rate limit.
  const unknown = await login({
    email: `nobody-${Math.random().toString(36).slice(2)}@nowhere.test`,
    password: 'x',
  })
  const wrongPw = await login({ email: CONTRACTOR.email, password: 'definitely-wrong' })

  if (isRateLimited(unknown.error) || isRateLimited(wrongPw.error)) {
    skipped('unknown user and wrong password are indistinguishable', 'login rate limit reached')
  } else {
    check(
      unknown.error === wrongPw.error && unknown.error.length > 0,
      `unknown user and wrong password are indistinguishable ("${unknown.error}")`,
      unknown.error !== wrongPw.error ? `"${unknown.error}" vs "${wrongPw.error}"` : ''
    )
  }

  // ---------------------------------------------------------------------------
  section('valid sign-in still works')

  const contractor = await login(CONTRACTOR)
  if (!contractor.session && isRateLimited(contractor.error)) {
    skipped('contractor signs in with the correct password', 'login rate limit reached')
  } else {
    check(!!contractor.session, 'contractor signs in with the correct password')
  }

  if (!contractor.session) {
    console.error(
      '\nNo contractor session, so the authenticated checks below cannot run.\n' +
        'Either the database is not seeded, or the login limit (five attempts per address\n' +
        'per fifteen minutes) is still in force from an earlier run. Restart the dev server\n' +
        'to clear the in-memory limiter, or wait it out.'
    )
    console.log(`\n${pass} passed, ${fail} failed${skip ? `, ${skip} skipped` : ''}\n`)
    process.exitCode = fail === 0 ? 0 : 1
    return
  }

  const admin = await login(ADMIN)
  if (!admin.session && isRateLimited(admin.error)) {
    skipped('admin signs in with the correct password', 'login rate limit reached')
  } else {
    check(!!admin.session, 'admin signs in with the correct password')
  }

  // ---------------------------------------------------------------------------
  section('impersonation is server-issued and single-use (C-01 / 2.5)')

  if (!admin.session) {
    skipped('admin-only checks', 'no admin session available')
  } else {
    const clientsRes = await fetch(`${BASE}/api/admin/contractors`, {
      headers: { Cookie: admin.cookies },
    })
    check(clientsRes.status === 200, 'admin with canManageContractors can list contractors')
  }

  const targetId = admin.session ? process.env.VERIFY_TARGET_USER_ID : null
  if (!targetId) {
    console.log('  skip  grant redemption (set VERIFY_TARGET_USER_ID to a CLIENT user id)')
  } else {
    const grantRes = await fetch(`${BASE}/api/admin/impersonate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin.cookies },
      body: JSON.stringify({ targetUserId: targetId }),
    })
    const grant = await grantRes.json()
    check(grantRes.status === 200 && !!grant.grant, 'admin receives a grant')

    if (grant.grant) {
      const redeemed = await login({ email: grant.email, grant: grant.grant })
      check(!!redeemed.session, 'the grant redeems once')

      const replayed = await login({ email: grant.email, grant: grant.grant })
      check(!replayed.session, 'the same grant cannot be replayed')
    }
  }

  const rivalGrant = await fetch(`${BASE}/api/admin/impersonate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: contractor.cookies },
    body: JSON.stringify({ targetUserId: targetId || 'x' }),
  })
  check(rivalGrant.status === 401, `a contractor cannot request a grant (got ${rivalGrant.status})`)

  // ---------------------------------------------------------------------------
  section('cross-tenant access (H-02 / H-10)')

  const rival = await login(RIVAL)
  const victimBranch = process.env.VERIFY_VICTIM_BRANCH_ID
  const victimClient = process.env.VERIFY_VICTIM_CLIENT_ID

  if (!rival.session || !victimBranch) {
    console.log('  skip  set VERIFY_VICTIM_BRANCH_ID and seed the second tenant first')
  } else {
    const DENIED = [401, 403, 404]

    const reads = [
      'requests', 'equipment', 'invoices', 'contracts', 'quotations', 'certificates',
      'checklists', 'checklist-items', 'documents', 'appointments', 'contract-payments',
    ]
    for (const resource of reads) {
      const res = await fetch(`${BASE}/api/branches/${victimBranch}/${resource}`, {
        headers: { Cookie: rival.cookies },
      })
      check(DENIED.includes(res.status), `GET ${resource} denied (${res.status})`)
    }

    if (victimClient) {
      const res = await fetch(`${BASE}/api/clients/${victimClient}`, {
        headers: { Cookie: rival.cookies },
      })
      check(DENIED.includes(res.status), `GET client detail denied (${res.status})`)
    }

    // The writes that had no branch check at all.
    const writes = [
      ['POST create-immediate', `/api/branches/${victimBranch}/work-orders/create-immediate`, 'POST',
        { title: 'injected', workOrderType: 'FIRE_EXTINGUISHER' }],
      ['POST start-now', `/api/branches/${victimBranch}/requests/nonexistent/start-now`, 'POST', {}],
      ['GET comments', `/api/branches/${victimBranch}/requests/nonexistent/comments`, 'GET', null],
      ['POST comments', `/api/branches/${victimBranch}/requests/nonexistent/comments`, 'POST',
        { content: 'injected' }],
      ['PATCH display-name', `/api/branches/${victimBranch}/display-name`, 'PATCH',
        { displayName: 'hijacked' }],
      // A fully valid payload, so field validation cannot mask the authorization result.
      ['POST equipment', `/api/branches/${victimBranch}/equipment`, 'POST',
        { equipmentNumber: 'INJECTED-001', equipmentType: 'FIRE_EXTINGUISHER', location: 'x' }],
    ]

    for (const [label, path, method, body] of writes) {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Cookie: rival.cookies },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      check(DENIED.includes(res.status), `${label} denied (${res.status})`)
    }
  }

  // ---------------------------------------------------------------------------
  section('removed and gated endpoints')

  const debug = await fetch(`${BASE}/api/debug/checklist-items?branchId=x`, {
    headers: { Cookie: contractor.cookies },
  })
  check(debug.status === 404, `the debug endpoint is gone (${debug.status})`)

  const purge = await fetch(`${BASE}/api/cron/cleanup-archived-clients`)
  check(purge.status === 404, `the purge cron route is gone (${purge.status})`)

  const cron = await fetch(`${BASE}/api/cron/work-order-notifications`)
  check(cron.status === 401, `the notification cron requires its secret (${cron.status})`)

  const geocode = await fetch(`${BASE}/api/geocode?address=Riyadh`)
  check(geocode.status === 401, `geocode requires a session (${geocode.status})`)

  const badLatLng = await fetch(`${BASE}/api/geocode?latlng=abc`, {
    headers: { Cookie: contractor.cookies },
  })
  check(badLatLng.status === 400, `geocode rejects a non-coordinate latlng (${badLatLng.status})`)

  // ---------------------------------------------------------------------------
  section('file deletion (C-05)')

  const deleteByUrl = await fetch(`${BASE}/api/upload`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Cookie: contractor.cookies },
    body: JSON.stringify({
      url: 'https://tasheel-uploads.s3.ap-southeast-1.amazonaws.com/certificates/x.pdf',
    }),
  })
  check(deleteByUrl.status === 400, `deleting by arbitrary URL is refused (${deleteByUrl.status})`)

  // ---------------------------------------------------------------------------
  section('password handling (N-02 / N-05)')

  const noCurrent = await fetch(`${BASE}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: contractor.cookies },
    body: JSON.stringify({ newPassword: 'BrandNewPass123!' }),
  })
  check(noCurrent.status === 400, `change refused without the current password (${noCurrent.status})`)

  const weak = await fetch(`${BASE}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: contractor.cookies },
    body: JSON.stringify({ currentPassword: CONTRACTOR.password, newPassword: 'aaaaaaaa' }),
  })
  check(weak.status === 400, `weak password refused server-side (${weak.status})`)

  // ---------------------------------------------------------------------------
  section('abuse limits (H-07 / H-08)')

  let limited = false
  for (let i = 0; i < 6; i++) {
    const res = await fetch(`${BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ratelimit-probe@tasheel.local' }),
    })
    if (res.status === 429) {
      limited = true
      break
    }
  }
  check(limited, 'forgot-password refuses after the per-address limit')

  const longMessage = await fetch(`${BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'x', email: 'a@b.co', phone: '1', message: 'y'.repeat(5000) }),
  })
  if (isRateLimited(longMessage.status)) {
    skipped('oversized contact message refused', 'contact rate limit reached')
  } else {
    check(longMessage.status === 400, `oversized contact message refused (${longMessage.status})`)
  }

  const badEmail = await fetch(`${BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'x', email: 'nope', phone: '1', message: 'hello' }),
  })
  if (isRateLimited(badEmail.status)) {
    skipped('malformed contact email refused', 'contact rate limit reached')
  } else {
    check(badEmail.status === 400, `malformed contact email refused (${badEmail.status})`)
  }

  // ---------------------------------------------------------------------------
  console.log(`\n${pass} passed, ${fail} failed${skip ? `, ${skip} skipped` : ''}\n`)
  process.exitCode = fail === 0 ? 0 : 1
}

main().catch(error => {
  console.error('\nverification could not run:', error.message)
  console.error('is the dev server up on ' + BASE + '?')
  process.exitCode = 1
})
