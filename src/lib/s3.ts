import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'tasheel-uploads'

/** How long a download link stays valid. Long enough to click, short enough not to share. */
const SIGNED_URL_TTL_SECONDS = 300

/**
 * The only folders an upload may be written to. `folder` arrives from the client, so
 * without this it selects an arbitrary key prefix in the bucket.
 */
export const ALLOWED_FOLDERS = [
  // Values the UI sends today. Verified against every formData.append('folder', ...) call
  // site: a mismatch here rejects real uploads, so this list follows the callers.
  'request-photos',
  'inspection-photos',
  'certificates',
  'contracts',
  'quotations',
  'payment-proofs',
  // Used by flows that do not upload through the shared helper yet.
  'signatures',
  'logos',
] as const

export type AllowedFolder = (typeof ALLOWED_FOLDERS)[number]

export function isAllowedFolder(folder: string): folder is AllowedFolder {
  return (ALLOWED_FOLDERS as readonly string[]).includes(folder)
}

/**
 * Store an object privately.
 *
 * Uploads were previously written with ACL 'public-read' and referenced by their raw
 * bucket URL, which made every contract, invoice, payment proof and signature readable by
 * anyone holding or guessing the key. Objects are now private and reached only through a
 * short-lived signed URL issued after an access check.
 */
export async function uploadToS3(file: File, key: string): Promise<{ key: string }> {
  const buffer = Buffer.from(await file.arrayBuffer())

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      // No ACL: the bucket should block public access at the account level.
    })
  )

  return { key }
}

/** Issue a short-lived download URL. Callers must run their access check first. */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    { expiresIn: SIGNED_URL_TTL_SECONDS }
  )
}

export async function deleteFromS3ByKey(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
}

/**
 * Recover an object key from a legacy absolute bucket URL.
 *
 * Records written before uploads were tracked store the full URL. Returns null for
 * anything that is not a URL into our own bucket, so a caller-supplied URL can never be
 * turned into a delete against an arbitrary key.
 */
export function keyFromLegacyUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname

    const isOurBucket =
      host === `${BUCKET_NAME}.s3.${process.env.AWS_S3_REGION || 'ap-southeast-1'}.amazonaws.com` ||
      host === `${BUCKET_NAME}.s3.amazonaws.com`

    if (!isOurBucket) return null

    const key = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
    return key.length > 0 ? key : null
  } catch {
    return null
  }
}
