/**
 * Finds certificates that were auto-issued for equipment that had not passed inspection.
 *
 * WHY
 * Until the fix in checklist-items/route.ts, completing a sticker-inspection work order
 * wrote `inspectionResult: 'PASS'` and `status: 'ACTIVE'` to every linked piece of
 * equipment unconditionally, then issued a certificate for each. Equipment a technician
 * had recorded as FAIL was flipped to passing, its warning status cleared, and it received
 * a certificate valid for a year.
 *
 * Because the flip overwrote the original result, the failing state is not directly
 * recoverable from the equipment row. This script therefore reports every auto-generated
 * certificate together with the evidence that survives — the work order's own recorded
 * result, its findings and recommendations text, and the equipment's deficiencies field —
 * so a human can judge which ones are suspect.
 *
 * READ-ONLY. It writes nothing and changes nothing.
 *
 * Usage (safe against production):
 *   npx tsx scripts/audit-auto-certificates.ts
 *   npx tsx scripts/audit-auto-certificates.ts --csv > suspect-certificates.csv
 */

import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

const AS_CSV = process.argv.includes('--csv')

/** Outcomes that mean the inspection did not demonstrate compliance. */
const FAILING = new Set(['FAIL', 'FAILED', 'NEEDS_REPAIR', 'ATTENTION_REQUIRED'])

type Row = {
  certificateId: string
  issueDate: string
  expiryDate: string
  clientName: string
  branchName: string
  equipmentNumber: string
  equipmentResultNow: string
  equipmentStatusNow: string
  workOrderResult: string
  reason: string
  evidence: string
}

async function main() {
  // Every certificate the system generated itself. Manually issued certificates are not
  // affected by this defect.
  const certificates = await prisma.certificate.findMany({
    where: { issuedBy: 'System (Auto-generated)' },
    select: {
      id: true,
      issueDate: true,
      expiryDate: true,
      equipmentId: true,
      workOrderId: true,
      branch: {
        select: { name: true, client: { select: { companyName: true } } },
      },
    },
    orderBy: { issueDate: 'desc' },
  })

  if (certificates.length === 0) {
    console.log('No auto-generated certificates found. Nothing to review.')
    return
  }

  // Equipment and work orders in bulk, rather than per certificate.
  const equipmentIds = certificates.map(c => c.equipmentId).filter((v): v is string => !!v)
  const workOrderIds = certificates.map(c => c.workOrderId).filter((v): v is string => !!v)

  const equipment = new Map(
    (await prisma.equipment.findMany({
      where: { id: { in: equipmentIds } },
      select: {
        id: true, equipmentNumber: true, inspectionResult: true, status: true,
        deficiencies: true, notes: true,
      },
    })).map(e => [e.id, e])
  )

  const workOrders = new Map(
    (await prisma.checklistItem.findMany({
      where: { id: { in: workOrderIds } },
      select: {
        id: true, description: true, inspectionResult: true,
        findings: true, recommendations: true,
      },
    })).map(w => [w.id, w])
  )

  const suspect: Row[] = []

  for (const cert of certificates) {
    const eq = cert.equipmentId ? equipment.get(cert.equipmentId) : undefined
    const wo = cert.workOrderId ? workOrders.get(cert.workOrderId) : undefined

    const reasons: string[] = []

    // Strongest signal: the work order as a whole was recorded as not passing, yet a
    // certificate was issued anyway.
    if (wo?.inspectionResult && FAILING.has(wo.inspectionResult)) {
      reasons.push(`work order recorded ${wo.inspectionResult}`)
    }

    // The equipment has since been re-flagged, which suggests it was never sound.
    if (eq && eq.status === 'NEEDS_ATTENTION') {
      reasons.push('equipment currently flagged NEEDS_ATTENTION')
    }
    if (eq?.inspectionResult && FAILING.has(eq.inspectionResult)) {
      reasons.push(`equipment currently ${eq.inspectionResult}`)
    }

    // Free-text evidence that a problem was found at the time.
    if (eq?.deficiencies?.trim()) {
      reasons.push('equipment has recorded deficiencies')
    }

    if (reasons.length === 0) continue

    const evidenceParts = [
      eq?.deficiencies && `deficiencies: ${eq.deficiencies}`,
      wo?.findings && `findings: ${wo.findings}`,
      wo?.recommendations && `recommendations: ${wo.recommendations}`,
    ].filter(Boolean)

    suspect.push({
      certificateId: cert.id,
      issueDate: cert.issueDate.toISOString().slice(0, 10),
      expiryDate: cert.expiryDate?.toISOString().slice(0, 10) ?? '',
      clientName: cert.branch?.client?.companyName ?? '',
      branchName: cert.branch?.name ?? '',
      equipmentNumber: eq?.equipmentNumber ?? '(no equipment link)',
      equipmentResultNow: eq?.inspectionResult ?? '',
      equipmentStatusNow: eq?.status ?? '',
      workOrderResult: wo?.inspectionResult ?? '',
      reason: reasons.join('; '),
      evidence: evidenceParts.join(' | ').replace(/\s+/g, ' ').slice(0, 300),
    })
  }

  if (AS_CSV) {
    const cols = Object.keys(suspect[0] ?? { certificateId: '' }) as (keyof Row)[]
    console.log(cols.join(','))
    for (const row of suspect) {
      console.log(cols.map(c => `"${String(row[c]).replace(/"/g, '""')}"`).join(','))
    }
    return
  }

  console.log(`auto-generated certificates: ${certificates.length}`)
  console.log(`needing review:              ${suspect.length}\n`)

  if (suspect.length === 0) {
    console.log('None of the auto-generated certificates show evidence of a failed inspection.')
    console.log('That is a good outcome, but note the caveat below.')
  } else {
    for (const row of suspect) {
      console.log(`${row.certificateId}`)
      console.log(`  client      ${row.clientName} / ${row.branchName}`)
      console.log(`  equipment   ${row.equipmentNumber}  now: ${row.equipmentResultNow} / ${row.equipmentStatusNow}`)
      console.log(`  issued      ${row.issueDate}  expires ${row.expiryDate}`)
      console.log(`  why         ${row.reason}`)
      if (row.evidence) console.log(`  evidence    ${row.evidence}`)
      console.log()
    }
  }

  console.log('CAVEAT')
  console.log('  The defect overwrote the equipment result with PASS, so a certificate issued')
  console.log('  for equipment that failed may leave no trace on the equipment row. This list')
  console.log('  is therefore a lower bound. Where the stakes justify it, treat every')
  console.log('  auto-generated sticker-inspection certificate issued before the fix as')
  console.log('  unverified and re-inspect.')
}

main()
  .catch(e => {
    console.error('audit failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
