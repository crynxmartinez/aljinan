import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { put, del } from '@vercel/blob'

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

    // Validate file type and size based on upload type
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

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return NextResponse.json({
      url: blob.url,
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

    await del(url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
