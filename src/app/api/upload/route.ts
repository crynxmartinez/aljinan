import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { uploadToS3, deleteFromS3 } from '@/lib/s3'
import { checkFileUploadRateLimit } from '@/lib/rate-limit'
import { validateFile, generateSafeFilename, ALLOWED_FILE_TYPES, FILE_SIZE_LIMITS } from '@/lib/file-security'
import { logFileUpload, logSecurityAlert } from '@/lib/audit-log'

// Maximum file sizes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB for photos
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB for documents/certificates
const MAX_SIGNATURE_SIZE = 500 * 1024 // 500KB for signatures

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting: Check file upload attempts
    const rateLimitResult = await checkFileUploadRateLimit(session.user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many file uploads. Please try again later.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadType = formData.get('type') as string | null // 'photo', 'signature', 'document'
    const folder = formData.get('folder') as string | null // 'requests', 'inspections', 'certificates', 'signatures'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!uploadType || !folder) {
      return NextResponse.json({ error: 'Upload type and folder are required' }, { status: 400 })
    }

    // Determine allowed types and max size based on upload type
    let maxSize: number
    let allowedTypes: string[]

    switch (uploadType) {
      case 'photo':
        maxSize = MAX_IMAGE_SIZE
        allowedTypes = ALLOWED_IMAGE_TYPES
        break
      case 'signature':
        maxSize = MAX_SIGNATURE_SIZE
        allowedTypes = ALLOWED_IMAGE_TYPES
        break
      case 'document':
        maxSize = MAX_DOCUMENT_SIZE
        allowedTypes = ALLOWED_DOCUMENT_TYPES
        break
      default:
        return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    // Comprehensive file validation using security library
    const validation = validateFile(file.name, file.type, file.size, {
      allowedTypes,
      maxSize
    })

    if (!validation.valid) {
      // Log security alert for invalid file upload attempt
      await logSecurityAlert(
        session.user.id,
        'Invalid file upload attempt',
        {
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          errors: validation.errors
        }
      )
      return NextResponse.json(
        { error: 'File validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Generate safe filename with timestamp and random suffix
    const safeFilename = generateSafeFilename(validation.sanitizedFilename!, folder)
    const filename = `${folder}/${safeFilename}`

    // Upload to S3
    const result = await uploadToS3(file, filename)

    // Log successful file upload
    await logFileUpload(
      session.user.id,
      session.user.role as any,
      file.name,
      file.size,
      file.type,
      uploadType,
      folder
    )

    return NextResponse.json({
      url: result.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// Delete a file from Vercel Blob
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    await deleteFromS3(url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
