import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToS3, deleteFromS3ByKey, isAllowedFolder, ALLOWED_FOLDERS } from '@/lib/s3'
import { checkFileUploadRateLimit } from '@/lib/rate-limit'
import { validateFile, generateSafeFilename, validateFileContents } from '@/lib/file-security'
import { verifyBranchAccess } from '@/lib/permissions'
import { logFileUpload, logSecurityAlert } from '@/lib/audit-log'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB for photos
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB for documents/certificates
const MAX_SIGNATURE_SIZE = 500 * 1024 // 500KB for signatures

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

// The extension whitelist has to match the MIME whitelist. It did not, so Word documents
// were advertised as supported and then rejected by validation on every attempt.
const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp', '.gif',
]

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResult = await checkFileUploadRateLimit(session.user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many file uploads. Please try again later.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadType = formData.get('type') as string | null
    const folder = formData.get('folder') as string | null
    const branchId = formData.get('branchId') as string | null
    const entityType = formData.get('entityType') as string | null
    const entityId = formData.get('entityId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!uploadType || !folder) {
      return NextResponse.json({ error: 'Upload type and folder are required' }, { status: 400 })
    }

    // The folder becomes part of the object key, so it cannot be free text.
    if (!isAllowedFolder(folder)) {
      return NextResponse.json(
        { error: `Invalid folder. Expected one of: ${ALLOWED_FOLDERS.join(', ')}` },
        { status: 400 }
      )
    }

    // A file attached to a branch must be one the caller can actually reach.
    if (branchId) {
      const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    let maxSize: number
    let allowedTypes: string[]
    let allowedExtensions: string[]

    switch (uploadType) {
      case 'photo':
        maxSize = MAX_IMAGE_SIZE
        allowedTypes = ALLOWED_IMAGE_TYPES
        allowedExtensions = ALLOWED_IMAGE_EXTENSIONS
        break
      case 'signature':
        maxSize = MAX_SIGNATURE_SIZE
        allowedTypes = ALLOWED_IMAGE_TYPES
        allowedExtensions = ALLOWED_IMAGE_EXTENSIONS
        break
      case 'document':
        maxSize = MAX_DOCUMENT_SIZE
        allowedTypes = ALLOWED_DOCUMENT_TYPES
        allowedExtensions = ALLOWED_DOCUMENT_EXTENSIONS
        break
      default:
        return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    const validation = validateFile(file.name, file.type, file.size, {
      allowedTypes,
      allowedExtensions,
      maxSize,
    })

    if (!validation.valid) {
      await logSecurityAlert(session.user.id, 'Invalid file upload attempt', {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        errors: validation.errors,
      })
      return NextResponse.json(
        { error: 'File validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // The MIME type and extension are both supplied by the caller, so they agree with each
    // other and prove nothing about the file. Check the leading bytes as well.
    const contents = await validateFileContents(file, file.type)
    if (!contents.valid) {
      await logSecurityAlert(session.user.id, 'File contents did not match declared type', {
        filename: file.name,
        declaredType: file.type,
        fileSize: file.size,
      })
      return NextResponse.json(
        { error: 'File validation failed', details: [contents.error] },
        { status: 400 }
      )
    }

    const safeFilename = generateSafeFilename(validation.sanitizedFilename!, folder)
    const key = `${folder}/${safeFilename}`

    await uploadToS3(file, key)

    // Ownership record. Reads and deletes are authorised against this row, so an object
    // with no row is unreachable rather than public.
    const upload = await prisma.upload.create({
      data: {
        key,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        folder,
        uploadedById: session.user.id,
        branchId: branchId || null,
        entityType: entityType || null,
        entityId: entityId || null,
      },
      select: { id: true },
    })

    await logFileUpload(
      session.user.id,
      session.user.role as never,
      file.name,
      file.size,
      file.type,
      uploadType,
      folder
    )

    // A relative app URL, so anything already rendering the stored value in an image or
    // link keeps working. That request is access-checked and redirected to a signed URL.
    return NextResponse.json({
      id: upload.id,
      url: `/api/files/${upload.id}`,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

/**
 * Delete a file.
 *
 * This previously accepted any URL from any authenticated caller and deleted the object it
 * pointed at, with no ownership check, so one client could erase another tenant signed
 * contracts and certificates. Deletion is now by upload id, gated on branch access.
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Upload id is required' }, { status: 400 })
    }

    const upload = await prisma.upload.findUnique({
      where: { id },
      select: { id: true, key: true, branchId: true, uploadedById: true, deletedAt: true },
    })

    if (!upload || upload.deletedAt) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const isOwner = upload.uploadedById === session.user.id
    const canReach = upload.branchId
      ? await verifyBranchAccess(upload.branchId, session.user.id, session.user.role)
      : isOwner

    if (!canReach) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await deleteFromS3ByKey(upload.key)
    await prisma.upload.update({
      where: { id: upload.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
