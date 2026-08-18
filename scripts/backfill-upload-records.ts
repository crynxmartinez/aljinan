/**
 * Backfill Upload rows for files that predate upload tracking, and rewrite the stored
 * absolute bucket URLs to the access-checked `/api/files/{id}` form.
 *
 * WHY THIS EXISTS
 * Uploads used to be written with a public-read ACL and referenced by their raw bucket
 * URL. Once public access is blocked on the bucket, every one of those stored URLs starts
 * returning 403 and existing certificates, contracts and payment proofs stop opening. This
 * script creates the ownership rows those files never had, then points the records at the
 * serving route.
 *
 * ORDER OF OPERATIONS — read this before running:
 *   1. Apply the migrations (0_init as already-applied, then the hardening migration).
 *   2. Deploy the application code.
 *   3. Run this script with --dry-run and read the report.
 *   4. Run it for real.
 *   5. ONLY THEN block public access on the bucket.
 * Blocking public access before step 4 makes existing documents unreachable in the
 * meantime; running this before step 2 leaves rewritten URLs no route can serve.
 *
 * Usage:
 *   npx tsx scripts/backfill-upload-records.ts --dry-run
 *   npx tsx scripts/backfill-upload-records.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_URL_POOLED must be set')
}

const pool = new Pool({ connectionString })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const DRY_RUN = process.argv.includes('--dry-run')

const BUCKET = process.env.AWS_S3_BUCKET_NAME || 'tasheel-uploads'
const REGION = process.env.AWS_S3_REGION || 'ap-southeast-1'

/**
 * Every column that stores a file URL, with how to reach the owning branch. `branch: null`
 * means the file is account-level (a company logo, an insurance certificate) and is
 * authorised by uploader instead.
 */
type Target = {
  label: string
  /** Loads {id, url, branchId} tuples for one column. */
  load: () => Promise<Array<{ id: string; url: string; branchId: string | null }>>
  /** Writes the rewritten value back. */
  save: (id: string, url: string) => Promise<unknown>
}

const targets: Target[] = [
  {
    label: 'Certificate.fileUrl',
    load: async () =>
      (await prisma.certificate.findMany({
        where: { fileUrl: { not: null } },
        select: { id: true, fileUrl: true, branchId: true },
      })).map(r => ({ id: r.id, url: r.fileUrl!, branchId: r.branchId })),
    save: (id, fileUrl) => prisma.certificate.update({ where: { id }, data: { fileUrl } }),
  },
  {
    label: 'Contract.fileUrl',
    load: async () =>
      (await prisma.contract.findMany({
        where: { fileUrl: { not: null } },
        select: { id: true, fileUrl: true, branchId: true },
      })).map(r => ({ id: r.id, url: r.fileUrl!, branchId: r.branchId })),
    save: (id, fileUrl) => prisma.contract.update({ where: { id }, data: { fileUrl } }),
  },
  {
    label: 'Request.quotationUrl',
    load: async () =>
      (await prisma.request.findMany({
        where: { quotationUrl: { not: null } },
        select: { id: true, quotationUrl: true, branchId: true },
      })).map(r => ({ id: r.id, url: r.quotationUrl!, branchId: r.branchId })),
    save: (id, quotationUrl) => prisma.request.update({ where: { id }, data: { quotationUrl } }),
  },
  {
    label: 'Invoice.paymentProofUrl',
    load: async () =>
      (await prisma.invoice.findMany({
        where: { paymentProofUrl: { not: null } },
        select: { id: true, paymentProofUrl: true, branchId: true },
      })).map(r => ({ id: r.id, url: r.paymentProofUrl!, branchId: r.branchId })),
    save: (id, paymentProofUrl) =>
      prisma.invoice.update({ where: { id }, data: { paymentProofUrl } }),
  },
  {
    label: 'ContractPayment.paymentProofUrl',
    load: async () =>
      (await prisma.contractPayment.findMany({
        where: { paymentProofUrl: { not: null } },
        select: { id: true, paymentProofUrl: true, contract: { select: { branchId: true } } },
      })).map(r => ({ id: r.id, url: r.paymentProofUrl!, branchId: r.contract.branchId })),
    save: (id, paymentProofUrl) =>
      prisma.contractPayment.update({ where: { id }, data: { paymentProofUrl } }),
  },
]

/** True for an absolute URL into our own bucket. Anything else is left untouched. */
function isOurBucketUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return (
      host === `${BUCKET}.s3.${REGION}.amazonaws.com` || host === `${BUCKET}.s3.amazonaws.com`
    )
  } catch {
    return false
  }
}

function keyFromUrl(url: string): string | null {
  try {
    const key = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''))
    return key.length > 0 ? key : null
  } catch {
    return null
  }
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN — no writes ===' : '=== APPLYING CHANGES ===')
  console.log(`bucket: ${BUCKET} (${REGION})\n`)

  // Uploads need an owner. Use the first admin as the system attributor: these files
  // predate tracking, so the real uploader is not recoverable.
  const systemUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true },
  })

  if (!systemUser) {
    throw new Error('No ADMIN user found to attribute historical uploads to')
  }
  console.log(`attributing historical uploads to ${systemUser.email}\n`)

  let created = 0
  let rewritten = 0
  let skippedExternal = 0
  let skippedAlready = 0

  for (const target of targets) {
    const rows = await target.load()
    let localCreated = 0
    let localRewritten = 0

    for (const row of rows) {
      if (row.url.startsWith('/api/files/')) {
        skippedAlready++
        continue
      }

      // External links are a supported case: the payment flow lets a client paste a URL
      // instead of uploading. Those must not be rewritten.
      if (!isOurBucketUrl(row.url)) {
        skippedExternal++
        continue
      }

      const key = keyFromUrl(row.url)
      if (!key) {
        console.warn(`  ! could not parse key from ${row.url}`)
        continue
      }

      const folder = key.includes('/') ? key.split('/')[0] : 'uploads'
      const fileName = key.split('/').pop() || key

      if (DRY_RUN) {
        localCreated++
        localRewritten++
        continue
      }

      // The key is unique, so a re-run reuses the row rather than duplicating it.
      const upload = await prisma.upload.upsert({
        where: { key },
        update: { branchId: row.branchId },
        create: {
          key,
          fileName,
          contentType: guessContentType(fileName),
          size: 0, // unknown for historical objects
          folder,
          uploadedById: systemUser.id,
          branchId: row.branchId,
        },
        select: { id: true },
      })

      await target.save(row.id, `/api/files/${upload.id}`)
      localCreated++
      localRewritten++
    }

    created += localCreated
    rewritten += localRewritten
    console.log(`${target.label.padEnd(34)} ${rows.length} row(s), ${localRewritten} to rewrite`)
  }

  console.log(`\nupload rows ${DRY_RUN ? 'to create' : 'created'}: ${created}`)
  console.log(`urls ${DRY_RUN ? 'to rewrite' : 'rewritten'}:        ${rewritten}`)
  console.log(`external links left alone:  ${skippedExternal}`)
  console.log(`already migrated:           ${skippedAlready}`)

  if (DRY_RUN) {
    console.log('\nRe-run without --dry-run to apply.')
  } else {
    console.log('\nDone. You can now block public access on the bucket.')
  }
}

function guessContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || ''
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  return map[ext] || 'application/octet-stream'
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
