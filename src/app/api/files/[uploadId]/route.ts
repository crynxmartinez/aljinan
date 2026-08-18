import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSignedDownloadUrl } from '@/lib/s3'
import { verifyBranchAccess } from '@/lib/permissions'

/**
 * Serve a stored file.
 *
 * Objects are private, so a read goes: authenticate, confirm the caller can reach the
 * branch the file belongs to, then redirect to a short-lived signed URL. Because the value
 * stored on records is this relative path, existing image and link usages need no change.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uploadId } = await params

    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      select: {
        key: true,
        branchId: true,
        uploadedById: true,
        deletedAt: true,
      },
    })

    if (!upload || upload.deletedAt) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const canRead = upload.branchId
      ? await verifyBranchAccess(upload.branchId, session.user.id, session.user.role)
      : upload.uploadedById === session.user.id

    if (!canRead) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const signedUrl = await getSignedDownloadUrl(upload.key)

    // Redirect rather than proxy the bytes: keeps large files out of the function memory
    // and bandwidth, and the signed URL expires within minutes.
    return NextResponse.redirect(signedUrl, { status: 302 })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
