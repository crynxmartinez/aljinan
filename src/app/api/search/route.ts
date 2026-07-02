import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const LIMIT = 5

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const role = session.user.role
    const userId = session.user.id

    // --- Resolve scope ---
    // Contractor: scoped by their contractorId
    // Client: scoped by their clientId (only their own branches)
    let contractorId: string | null = null
    let clientId: string | null = null
    let clientBranchIds: string[] = []

    if (role === 'CONTRACTOR') {
      const contractor = await prisma.contractor.findUnique({
        where: { userId },
        select: { id: true }
      })
      contractorId = contractor?.id ?? null
    } else if (role === 'TEAM_MEMBER') {
      const teamMember = await prisma.teamMember.findUnique({
        where: { userId },
        select: { contractor: { select: { id: true } } }
      })
      contractorId = teamMember?.contractor?.id ?? null
    } else if (role === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { userId },
        select: { id: true, branches: { select: { id: true } } }
      })
      clientId = client?.id ?? null
      clientBranchIds = client?.branches.map(b => b.id) ?? []
    }

    // --- Build parallel queries ---
    const [
      clients,
      branches,
      workOrders,
      requests,
      contracts,
      invoices,
      equipment,
      certificates,
    ] = await Promise.all([

      // 1. Clients — contractor/team member only
      contractorId && role !== 'CLIENT'
        ? prisma.client.findMany({
          where: {
            contractorId,
            OR: [
              { companyName: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
              { contactPersonName: { contains: query, mode: 'insensitive' } },
              { companyEmail: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, slug: true, companyName: true, displayName: true },
          take: LIMIT,
        })
        : Promise.resolve([]),

      // 2. Branches
      contractorId && role !== 'CLIENT'
        ? prisma.branch.findMany({
          where: {
            client: { contractorId },
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
              { clientNickname: { contains: query, mode: 'insensitive' } },
              { address: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, slug: true, name: true, displayName: true, address: true, client: { select: { id: true, slug: true, companyName: true } } },
          take: LIMIT,
        })
        : clientId
          ? prisma.branch.findMany({
            where: {
              clientId,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { clientNickname: { contains: query, mode: 'insensitive' } },
                { address: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, slug: true, name: true, clientNickname: true, address: true, client: { select: { id: true, slug: true } } },
            take: LIMIT,
          })
          : Promise.resolve([]),

      // 3. Work orders
      contractorId && role !== 'CLIENT'
        ? prisma.checklistItem.findMany({
          where: {
            checklist: { branch: { client: { contractorId } } },
            stage: { not: 'ARCHIVED' },
            OR: [
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, description: true, workOrderNumber: true, stage: true, checklist: { select: { branchId: true, branch: { select: { slug: true, client: { select: { id: true, slug: true, companyName: true } } } } } } },
          take: LIMIT,
        })
        : clientBranchIds.length > 0
          ? prisma.checklistItem.findMany({
            where: {
              checklist: { branchId: { in: clientBranchIds } },
              stage: { not: 'ARCHIVED' },
              OR: [
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, description: true, workOrderNumber: true, stage: true, checklist: { select: { branchId: true, branch: { select: { id: true, slug: true } } } } },
            take: LIMIT,
          })
          : Promise.resolve([]),

      // 4. Requests
      contractorId && role !== 'CLIENT'
        ? prisma.request.findMany({
          where: {
            branch: { client: { contractorId } },
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, title: true, status: true, requestNumber: true, branchId: true, branch: { select: { slug: true, client: { select: { id: true, slug: true, companyName: true } } } } },
          take: LIMIT,
        })
        : clientBranchIds.length > 0
          ? prisma.request.findMany({
            where: {
              branchId: { in: clientBranchIds },
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, title: true, status: true, requestNumber: true, branchId: true, branch: { select: { id: true, slug: true } } },
            take: LIMIT,
          })
          : Promise.resolve([]),

      // 5. Contracts
      contractorId && role !== 'CLIENT'
        ? prisma.contract.findMany({
          where: {
            branch: { client: { contractorId } },
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, title: true, status: true, branchId: true, branch: { select: { slug: true, client: { select: { id: true, slug: true, companyName: true } } } } },
          take: LIMIT,
        })
        : clientBranchIds.length > 0
          ? prisma.contract.findMany({
            where: {
              branchId: { in: clientBranchIds },
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, title: true, status: true, branchId: true, branch: { select: { id: true, slug: true } } },
            take: LIMIT,
          })
          : Promise.resolve([]),

      // 6. Invoices
      contractorId && role !== 'CLIENT'
        ? prisma.invoice.findMany({
          where: {
            branch: { client: { contractorId } },
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { invoiceNumber: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, title: true, invoiceNumber: true, status: true, branchId: true, branch: { select: { slug: true, client: { select: { id: true, slug: true, companyName: true } } } } },
          take: LIMIT,
        })
        : clientBranchIds.length > 0
          ? prisma.invoice.findMany({
            where: {
              branchId: { in: clientBranchIds },
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { invoiceNumber: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, title: true, invoiceNumber: true, status: true, branchId: true, branch: { select: { id: true, slug: true } } },
            take: LIMIT,
          })
          : Promise.resolve([]),

      // 7. Equipment
      contractorId && role !== 'CLIENT'
        ? prisma.equipment.findMany({
          where: {
            branch: { client: { contractorId } },
            OR: [
              { equipmentNumber: { contains: query, mode: 'insensitive' } },
              { location: { contains: query, mode: 'insensitive' } },
              { brand: { contains: query, mode: 'insensitive' } },
              { model: { contains: query, mode: 'insensitive' } },
              { serialNumber: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, equipmentNumber: true, equipmentType: true, location: true, branchId: true, branch: { select: { slug: true, client: { select: { id: true, slug: true, companyName: true } } } } },
          take: LIMIT,
        })
        : clientBranchIds.length > 0
          ? prisma.equipment.findMany({
            where: {
              branchId: { in: clientBranchIds },
              OR: [
                { equipmentNumber: { contains: query, mode: 'insensitive' } },
                { location: { contains: query, mode: 'insensitive' } },
                { brand: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, equipmentNumber: true, equipmentType: true, location: true, branchId: true, branch: { select: { id: true, slug: true } } },
            take: LIMIT,
          })
          : Promise.resolve([]),

      // 8. Certificates
      contractorId && role !== 'CLIENT'
        ? prisma.certificate.findMany({
          where: {
            branch: { client: { contractorId } },
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { certificateNumber: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, title: true, type: true, certificateNumber: true, branchId: true, branch: { select: { slug: true, client: { select: { id: true, slug: true, companyName: true } } } } },
          take: LIMIT,
        })
        : clientBranchIds.length > 0
          ? prisma.certificate.findMany({
            where: {
              branchId: { in: clientBranchIds },
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { certificateNumber: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, title: true, type: true, certificateNumber: true, branchId: true, branch: { select: { id: true, slug: true } } },
            take: LIMIT,
          })
          : Promise.resolve([]),
    ])

    // --- Format results ---
    type SearchResult = {
      id: string
      type: 'client' | 'branch' | 'work_order' | 'request' | 'contract' | 'invoice' | 'equipment' | 'certificate'
      title: string
      subtitle: string
      link: string
    }

    const isContractor = role === 'CONTRACTOR' || role === 'TEAM_MEMBER'

    const formatted: SearchResult[] = [
      // Clients
      ...(clients as typeof clients).map(c => ({
        id: c.id,
        type: 'client' as const,
        title: c.displayName || c.companyName,
        subtitle: c.companyName,
        link: `/dashboard/clients/${c.slug || c.id}`,
      })),

      // Branches
      ...(branches as any[]).map(b => ({
        id: b.id,
        type: 'branch' as const,
        title: b.displayName || b.clientNickname || b.name,
        subtitle: `${isContractor ? (b.client?.companyName + ' · ') : ''}${b.address}`,
        link: isContractor
          ? `/dashboard/clients/${b.client?.slug || b.client?.id}/branches/${b.slug || b.id}`
          : `/portal/branches/${b.slug || b.id}`,
      })),

      // Work Orders
      ...(workOrders as any[]).map(wo => ({
        id: wo.id,
        type: 'work_order' as const,
        title: wo.workOrderNumber ? `WO-${String(wo.workOrderNumber).padStart(4, '0')} ${wo.description}` : wo.description,
        subtitle: isContractor
          ? `${wo.checklist?.branch?.client?.companyName} · ${wo.stage}`
          : wo.stage,
        link: isContractor
          ? `/dashboard/clients/${wo.checklist?.branch?.client?.slug || wo.checklist?.branch?.client?.id}/branches/${wo.checklist?.branch?.slug || wo.checklist?.branchId}?tab=checklists`
          : `/portal/branches/${wo.checklist?.branch?.slug || wo.checklist?.branchId}?tab=checklist`,
      })),

      // Requests
      ...(requests as any[]).map(r => ({
        id: r.id,
        type: 'request' as const,
        title: r.requestNumber ? `REQ-${String(r.requestNumber).padStart(4, '0')} ${r.title}` : r.title,
        subtitle: isContractor
          ? `${r.branch?.client?.companyName} · ${r.status}`
          : r.status,
        link: isContractor
          ? `/dashboard/clients/${r.branch?.client?.slug || r.branch?.client?.id}/branches/${r.branch?.slug || r.branchId}?tab=requests`
          : `/portal/branches/${r.branch?.slug || r.branchId}?tab=requests`,
      })),

      // Contracts
      ...(contracts as any[]).map(c => ({
        id: c.id,
        type: 'contract' as const,
        title: c.title,
        subtitle: isContractor
          ? `${c.branch?.client?.companyName} · ${c.status}`
          : c.status,
        link: isContractor
          ? `/dashboard/clients/${c.branch?.client?.slug || c.branch?.client?.id}/branches/${c.branch?.slug || c.branchId}?tab=contracts`
          : `/portal/branches/${c.branch?.slug || c.branchId}?tab=contracts`,
      })),

      // Invoices
      ...(invoices as any[]).map(inv => ({
        id: inv.id,
        type: 'invoice' as const,
        title: inv.invoiceNumber ? `${inv.invoiceNumber} — ${inv.title}` : inv.title,
        subtitle: isContractor
          ? `${inv.branch?.client?.companyName} · ${inv.status}`
          : inv.status,
        link: isContractor
          ? `/dashboard/clients/${inv.branch?.client?.slug || inv.branch?.client?.id}/branches/${inv.branch?.slug || inv.branchId}?tab=billing`
          : `/portal/branches/${inv.branch?.slug || inv.branchId}?tab=billing`,
      })),

      // Equipment
      ...(equipment as any[]).map(eq => ({
        id: eq.id,
        type: 'equipment' as const,
        title: `${eq.equipmentNumber} — ${eq.equipmentType.replace(/_/g, ' ')}`,
        subtitle: isContractor
          ? `${eq.branch?.client?.companyName}${eq.location ? ' · ' + eq.location : ''}`
          : eq.location || eq.equipmentType.replace(/_/g, ' '),
        link: isContractor
          ? `/dashboard/clients/${eq.branch?.client?.slug || eq.branch?.client?.id}/branches/${eq.branch?.slug || eq.branchId}?tab=equipment`
          : `/portal/branches/${eq.branch?.slug || eq.branchId}?tab=equipment`,
      })),

      // Certificates
      ...(certificates as any[]).map(cert => ({
        id: cert.id,
        type: 'certificate' as const,
        title: cert.certificateNumber ? `${cert.title} #${cert.certificateNumber}` : cert.title,
        subtitle: isContractor
          ? `${cert.branch?.client?.companyName} · ${cert.type.replace(/_/g, ' ')}`
          : cert.type.replace(/_/g, ' '),
        link: isContractor
          ? `/dashboard/clients/${cert.branch?.client?.slug || cert.branch?.client?.id}/branches/${cert.branch?.slug || cert.branchId}?tab=certificates`
          : `/portal/branches/${cert.branch?.slug || cert.branchId}?tab=certificates`,
      })),
    ]

    return NextResponse.json({ results: formatted })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
