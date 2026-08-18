/**
 * Verifies the central compliance invariant: a certificate is only ever issued for
 * equipment that actually passed inspection.
 *
 * This exists because the platform previously wrote `inspectionResult: 'PASS'` and
 * `status: 'ACTIVE'` unconditionally when a sticker inspection completed. A fire
 * extinguisher recorded as FAIL was flipped to passing, its warning status cleared, and it
 * received a certificate valid for a year — the document a client shows a Civil Defence
 * inspector. Both directions are checked here: failures must not be certificated, and
 * passes must still be.
 *
 * Setup:
 *   node scripts/dev-db.mjs start
 *   npx prisma migrate deploy
 *   npx tsx prisma/seed-dev.ts
 *   npm run dev
 *
 * Then:
 *   DATABASE_URL=postgresql://tasheel:tasheel@localhost:55432/tasheel_dev \
 *     node scripts/verify-certificates.mjs
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const BASE = process.env.VERIFY_BASE_URL || 'http://localhost:3000'
const CONTRACTOR = { email: 'contractor@tasheel.local', password: 'DevContractor123!' }

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

let pass = 0
let fail = 0
const check = (ok, name, detail = '') => {
  if (ok) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? `  <- ${detail}` : ''}`) }
}

async function login() {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`)
  const cookies = csrfRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ')
  const { csrfToken } = await csrfRes.json()

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookies },
    body: new URLSearchParams({ csrfToken, ...CONTRACTOR }),
    redirect: 'manual',
  })
  return res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ')
}

/**
 * Builds a sticker-inspection work order over equipment with the given recorded results,
 * completes it through the API, and reports what the platform did.
 *
 * Certificates only generate once the client has signed and a price is set, so the work
 * order is created already satisfying that gate.
 */
async function runInspection(jar, branchId, contractorUserId, label, equipmentResults, workOrderResult) {
  const prefix = `VC-${Date.now()}-${label}`

  const equipment = []
  for (const [i, result] of equipmentResults.entries()) {
    equipment.push(await prisma.equipment.create({
      data: {
        branchId,
        equipmentNumber: `${prefix}-${i}`,
        equipmentType: 'FIRE_EXTINGUISHER',
        location: 'Verification',
        inspectionResult: result,
        status: result === 'PASS' ? 'ACTIVE' : 'NEEDS_ATTENTION',
      },
    }))
  }

  let checklist = await prisma.checklist.findFirst({
    where: { branchId, contractId: null, status: 'IN_PROGRESS' },
  })
  if (!checklist) {
    checklist = await prisma.checklist.create({
      data: {
        branchId, contractId: null, title: 'Verification', status: 'IN_PROGRESS',
        createdById: contractorUserId,
      },
    })
  }

  const wo = await prisma.checklistItem.create({
    data: {
      checklistId: checklist.id,
      description: `Verification inspection ${label}`,
      stage: 'IN_PROGRESS',
      type: 'ADHOC',
      workOrderType: 'STICKER_INSPECTION',
      recurringType: 'ONCE',
      occurrenceIndex: 1,
      inspectionResult: workOrderResult,
      clientSignature: 'data:image/png;base64,iVBORw0KGgo=',
      clientSignedAt: new Date(),
      price: 500,
    },
  })

  await prisma.equipment.updateMany({
    where: { id: { in: equipment.map(e => e.id) } },
    data: { workOrderId: wo.id },
  })

  const res = await fetch(`${BASE}/api/branches/${branchId}/checklist-items`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: jar },
    body: JSON.stringify({
      action: 'supervisor_sign',
      workOrderId: wo.id,
      signature: 'data:image/png;base64,iVBORw0KGgo=',
    }),
  })

  if (res.status !== 200) {
    throw new Error(`supervisor_sign returned ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }

  const after = await prisma.equipment.findMany({
    where: { id: { in: equipment.map(e => e.id) } },
    select: { equipmentNumber: true, inspectionResult: true, status: true, certificateIssued: true },
    orderBy: { equipmentNumber: 'asc' },
  })
  const certs = await prisma.certificate.findMany({ where: { workOrderId: wo.id } })

  // tidy up
  await prisma.certificate.deleteMany({ where: { workOrderId: wo.id } })
  await prisma.equipment.deleteMany({ where: { id: { in: equipment.map(e => e.id) } } })
  await prisma.checklistItem.delete({ where: { id: wo.id } })

  return { after, certs }
}

async function main() {
  const jar = await login()
  if (!jar.includes('session-token')) {
    console.error('could not sign in — is the database seeded, or is the login limit in force?')
    process.exitCode = 1
    return
  }

  const contractorUser = await prisma.user.findUniqueOrThrow({
    where: { email: CONTRACTOR.email },
    select: { id: true },
  })
  const branch = await prisma.branch.findFirstOrThrow({
    where: { client: { contractor: { userId: contractorUser.id } } },
    select: { id: true, name: true },
  })
  console.log(`branch: ${branch.name}\n`)

  // ---- failures must not be certificated ----
  console.log('--- equipment recorded as FAIL ---')
  {
    const { after, certs } = await runInspection(
      jar, branch.id, contractorUser.id, 'fail', ['FAIL', 'FAIL'], 'FAILED'
    )
    check(certs.length === 0, `no certificate issued (got ${certs.length})`)
    check(after.every(e => e.inspectionResult === 'FAIL'),
      'recorded result preserved as FAIL',
      after.map(e => e.inspectionResult).join(','))
    check(after.every(e => e.status === 'NEEDS_ATTENTION'),
      'status stays NEEDS_ATTENTION',
      after.map(e => e.status).join(','))
    check(after.every(e => e.certificateIssued === false), 'certificateIssued stays false')
  }

  // ---- passes must still be certificated ----
  console.log('\n--- equipment recorded as PASS ---')
  {
    const { after, certs } = await runInspection(
      jar, branch.id, contractorUser.id, 'pass', ['PASS', 'PASS'], 'PASSED'
    )
    check(certs.length === 2, `a certificate per passing item (got ${certs.length})`)
    check(after.every(e => e.certificateIssued === true), 'certificateIssued set')
    check(after.every(e => e.status === 'ACTIVE'), 'status set to ACTIVE')
  }

  // ---- a mixed inspection certificates only the passes ----
  console.log('\n--- mixed: one PASS, one FAIL ---')
  {
    const { after, certs } = await runInspection(
      jar, branch.id, contractorUser.id, 'mixed', ['PASS', 'FAIL'], 'ATTENTION_REQUIRED'
    )
    // The work order itself is ATTENTION_REQUIRED, so nothing should be certificated:
    // the inspection as a whole did not demonstrate compliance.
    check(certs.length === 0,
      `a work order needing attention issues nothing (got ${certs.length})`)
    const failed = after.find(e => e.inspectionResult === 'FAIL')
    check(failed?.status === 'NEEDS_ATTENTION', 'the failing item keeps its warning status')
  }

  console.log(`\n${pass} passed, ${fail} failed\n`)
  process.exitCode = fail === 0 ? 0 : 1
}

main()
  .catch(e => {
    console.error('verification could not run:', e.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
