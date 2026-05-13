import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Unified document type for the documents hub
interface UnifiedDocument {
  id: string
  fileName: string
  fileUrl: string
  source: 'quote' | 'request' | 'report' | 'contract' | 'certificate' | 'generated'
  sourceLabel: string
  relatedTo: string
  relatedToId: string
  relatedToUrl?: string
  uploadedBy: string
  uploadedById: string
  uploadedAt: string
  expiryDate?: string | null
  fileType: 'image' | 'pdf' | 'document'
}

// Helper to determine file type from URL
function getFileType(url: string): 'image' | 'pdf' | 'document' {
  const lower = url.toLowerCase()
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/)) return 'image'
  if (lower.match(/\.pdf(\?|$)/)) return 'pdf'
  return 'document'
}

// Helper to get user name by ID
async function getUserName(userId: string | null): Promise<string> {
  if (!userId) return 'Unknown'
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  })
  return user?.name || 'Unknown'
}

// GET - Fetch all documents for a branch from all sources
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const documents: UnifiedDocument[] = []

    // 1. Fetch quotation files from requests
    const requestsWithQuotes = await prisma.request.findMany({
      where: {
        branchId,
        quotationUrl: { not: null }
      }
    })

    for (const req of requestsWithQuotes) {
      if (req.quotationUrl) {
        const uploaderName = await getUserName(req.quotedById)
        documents.push({
          id: `quote-${req.id}`,
          fileName: req.quotationFileName || 'Quotation',
          fileUrl: req.quotationUrl,
          source: 'quote',
          sourceLabel: 'Quotation',
          relatedTo: req.requestNumber
            ? `REQ-${String(req.requestNumber).padStart(4, '0')} ${req.title}`
            : req.title,
          relatedToId: req.id,
          uploadedBy: uploaderName,
          uploadedById: req.quotedById || '',
          uploadedAt: req.quotedAt?.toISOString() || req.createdAt.toISOString(),
          expiryDate: null,
          fileType: getFileType(req.quotationUrl)
        })
      }
    }

    // 2. Fetch request photos
    const requestsWithPhotos = await prisma.request.findMany({
      where: {
        branchId,
        photos: { some: {} }
      },
      include: {
        photos: true
      }
    })

    for (const req of requestsWithPhotos) {
      const uploaderName = await getUserName(req.createdById)
      for (const photo of req.photos) {
        documents.push({
          id: `request-photo-${photo.id}`,
          fileName: photo.caption || 'Request Photo',
          fileUrl: photo.url,
          source: 'request',
          sourceLabel: 'Request Photo',
          relatedTo: req.requestNumber
            ? `REQ-${String(req.requestNumber).padStart(4, '0')} ${req.title}`
            : req.title,
          relatedToId: req.id,
          uploadedBy: uploaderName,
          uploadedById: req.createdById,
          uploadedAt: photo.createdAt.toISOString(),
          expiryDate: null,
          fileType: getFileType(photo.url)
        })
      }
    }

    // 3. Fetch inspection/report photos from work orders
    const checklistsWithPhotos = await prisma.checklist.findMany({
      where: { branchId },
      include: {
        items: {
          include: {
            photos: true
          }
        }
      }
    })

    for (const checklist of checklistsWithPhotos) {
      const uploaderName = await getUserName(checklist.createdById)
      for (const item of checklist.items) {
        for (const photo of item.photos) {
          const photoTypeLabel = photo.photoType
            ? `${photo.photoType.charAt(0).toUpperCase() + photo.photoType.slice(1)} Photo`
            : 'Report Photo'

          documents.push({
            id: `report-photo-${photo.id}`,
            fileName: photo.caption || photoTypeLabel,
            fileUrl: photo.url,
            source: 'report',
            sourceLabel: 'Report Photo',
            relatedTo: item.description,
            relatedToId: item.id,
            uploadedBy: uploaderName,
            uploadedById: checklist.createdById,
            uploadedAt: photo.createdAt.toISOString(),
            expiryDate: null,
            fileType: getFileType(photo.url)
          })
        }
      }
    }

    // 4. Fetch contract documents
    const contracts = await prisma.contract.findMany({
      where: { branchId }
    })

    for (const contract of contracts) {
      // Get uploader name
      let uploaderName = 'Contractor'
      if (contract.createdById) {
        const user = await prisma.user.findUnique({
          where: { id: contract.createdById },
          select: { name: true }
        })
        if (user?.name) uploaderName = user.name
      }

      // Contract PDF
      if (contract.fileUrl) {
        documents.push({
          id: `contract-${contract.id}`,
          fileName: contract.fileName || 'Contract Document',
          fileUrl: contract.fileUrl,
          source: 'contract',
          sourceLabel: 'Contract',
          relatedTo: contract.title,
          relatedToId: contract.id,
          uploadedBy: uploaderName,
          uploadedById: contract.createdById,
          uploadedAt: contract.createdAt.toISOString(),
          expiryDate: contract.endDate?.toISOString() || null,
          fileType: getFileType(contract.fileUrl)
        })
      }

      // Contract certificate
      if (contract.certificateUrl) {
        documents.push({
          id: `contract-cert-${contract.id}`,
          fileName: contract.certificateFileName || 'Contract Certificate',
          fileUrl: contract.certificateUrl,
          source: 'contract',
          sourceLabel: 'Contract Certificate',
          relatedTo: contract.title,
          relatedToId: contract.id,
          uploadedBy: uploaderName,
          uploadedById: contract.createdById,
          uploadedAt: contract.createdAt.toISOString(),
          expiryDate: contract.endDate?.toISOString() || null,
          fileType: getFileType(contract.certificateUrl)
        })
      }
    }

    // 5. Fetch certificates (manually uploaded and generated)
    const certificates = await prisma.certificate.findMany({
      where: { branchId },
      include: {
        contract: { select: { title: true } },
        workOrder: { select: { description: true } },
        equipment: { select: { equipmentNumber: true, equipmentType: true } }
      }
    })

    for (const cert of certificates) {
      // Get uploader name
      let uploaderName = cert.issuedBy || 'System'
      if (cert.issuedById) {
        const user = await prisma.user.findUnique({
          where: { id: cert.issuedById },
          select: { name: true }
        })
        if (user?.name) uploaderName = user.name
      }

      // Determine related to
      let relatedTo = cert.title
      if (cert.workOrder) {
        relatedTo = cert.workOrder.description
      } else if (cert.contract) {
        relatedTo = cert.contract.title
      } else if (cert.equipment) {
        relatedTo = `${cert.equipment.equipmentType} - ${cert.equipment.equipmentNumber}`
      }

      // Determine if it's auto-generated or uploaded
      const isGenerated = !cert.fileUrl || cert.type === 'COMPLETION'

      documents.push({
        id: `certificate-${cert.id}`,
        fileName: cert.title,
        fileUrl: cert.fileUrl || '',
        source: isGenerated ? 'generated' : 'certificate',
        sourceLabel: isGenerated ? 'Generated Certificate' : 'Certificate',
        relatedTo: relatedTo,
        relatedToId: cert.id,
        uploadedBy: uploaderName,
        uploadedById: cert.issuedById || '',
        uploadedAt: cert.createdAt.toISOString(),
        expiryDate: cert.expiryDate?.toISOString() || null,
        fileType: cert.fileUrl ? getFileType(cert.fileUrl) : 'pdf'
      })
    }

    // 6. Fetch generated report PDFs from work orders
    const workOrdersWithReports = await prisma.checklistItem.findMany({
      where: {
        checklist: { branchId },
        reportUrl: { not: null }
      },
      include: {
        checklist: true
      }
    })

    for (const wo of workOrdersWithReports) {
      if (wo.reportUrl) {
        const uploaderName = await getUserName(wo.checklist.createdById)
        documents.push({
          id: `report-pdf-${wo.id}`,
          fileName: `Report - ${wo.description}`,
          fileUrl: wo.reportUrl,
          source: 'generated',
          sourceLabel: 'Generated Report',
          relatedTo: wo.description,
          relatedToId: wo.id,
          uploadedBy: uploaderName,
          uploadedById: wo.checklist.createdById,
          uploadedAt: (wo.reportGeneratedAt || new Date()).toISOString(),
          expiryDate: null,
          fileType: 'pdf'
        })
      }
    }

    // Sort by upload date (newest first)
    documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// Helper function to verify branch access
async function verifyBranchAccess(branchId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === 'CONTRACTOR') {
    const contractor = await prisma.contractor.findUnique({
      where: { userId },
      include: {
        clients: {
          include: {
            branches: { where: { id: branchId } }
          }
        }
      }
    })
    return contractor?.clients.some(client => client.branches.length > 0) || false
  } else if (userRole === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId },
      include: { branches: { where: { id: branchId } } }
    })
    return (client?.branches.length || 0) > 0
  } else if (userRole === 'TEAM_MEMBER' || userRole === 'TECHNICIAN') {
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId },
      include: {
        branchAccess: { where: { branchId } }
      }
    })
    return (teamMember?.branchAccess.length || 0) > 0
  }
  return false
}
