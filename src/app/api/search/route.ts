import { generatedField } from '@/lib/i18n/generated-content'
import { enumLabel } from '@/lib/i18n/enum-labels'
import { getLocale } from '@/lib/i18n/server'
import { publishedFor } from '@/lib/publication'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCached, CACHE_TAGS } from '@/lib/cache'

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

    const locale = await getLocale()
    const cacheKey = CACHE_TAGS.SEARCH(session.user.id, query.toLowerCase())

    const loadResults = async () => {
      const role = session.user.role
      const userId = session.user.id

      // Extract numeric portion for matching Int fields like workOrderNumber/requestNumber
      // Handles formats like "WO-0001", "REQ-42", "0007", "7"
      const numericMatch = query.match(/\d+/)
      const numericValue = numericMatch ? parseInt(numericMatch[0], 10) : null

      // --- Resolve scope ---
      // Contractor: scoped by their contractorId
      // Client: scoped by their clientId (only their own branches)
      let contractorId: string | null = null
      let clientId: string | null = null
      let clientBranchIds: string[] = []
      // Admin: platform-wide, but still gated per-category by the same granular
      // permissions that guard the equivalent /api/admin/* read endpoints — a support
      // admin with canManageContractors off shouldn't see contractors surface here either.
      let isAdmin = false
      let adminPerms: { canManageContractors: boolean; canManageMessages: boolean } | null = null

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
      } else if (role === 'ADMIN') {
        isAdmin = true
        const admin = await prisma.adminUser.findUnique({
          where: { userId },
          select: { canManageContractors: true, canManageMessages: true }
        })
        adminPerms = admin ?? { canManageContractors: false, canManageMessages: false }
      }

      // Staff scope is evaluated in the database, never from stale JWT assignments.
      const staffScope = role === 'TEAM_MEMBER'
        ? { teamMemberAccess: { some: { teamMember: { userId } } } }
        : {}

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
        teamMembers,
        branchRequests,
        appointments,
        contractors,
        inquiries,
        quotations,
      ] = await Promise.all([

        // 1. Clients — contractor/team member only
        contractorId && role !== 'CLIENT'
          ? prisma.client.findMany({
            where: {
              contractorId,
              ...(role === 'TEAM_MEMBER' ? { branches: { some: staffScope } } : {}),
              OR: [
                { companyName: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
                { contactPersonName: { contains: query, mode: 'insensitive' } },
                { companyEmail: { contains: query, mode: 'insensitive' } },
                { companyPhone: { contains: query, mode: 'insensitive' } },
                { contactPersonPhone: { contains: query, mode: 'insensitive' } },
                { contactPersonEmail: { contains: query, mode: 'insensitive' } },
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
              ...staffScope,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
                { clientNickname: { contains: query, mode: 'insensitive' } },
                { address: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
                { contactPersonPhone: { contains: query, mode: 'insensitive' } },
                { contactPersonEmail: { contains: query, mode: 'insensitive' } },
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
                  { phone: { contains: query, mode: 'insensitive' } },
                  { contactPersonEmail: { contains: query, mode: 'insensitive' } },
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
              checklist: { branch: { client: { contractorId }, ...staffScope } },
              deletedAt: null,
              stage: { not: 'ARCHIVED' },
              OR: [
                { description: { contains: query, mode: 'insensitive' } },
                ...(numericValue !== null ? [{ workOrderNumber: numericValue }] : []),
              ],
            },
            select: { generatedContent: true, id: true, description: true, workOrderNumber: true, stage: true, checklist: { select: { branchId: true, branch: { select: { slug: true, client: { select: { id: true, slug: true, companyName: true } } } } } } },
            take: LIMIT,
          })
          : clientBranchIds.length > 0
            ? prisma.checklistItem.findMany({
              where: {
                checklist: { branchId: { in: clientBranchIds } },
                deletedAt: null,
                stage: { not: 'ARCHIVED' },
                OR: [
                  { description: { contains: query, mode: 'insensitive' } },
                  ...(numericValue !== null ? [{ workOrderNumber: numericValue }] : []),
                ],
              },
              select: { generatedContent: true, id: true, description: true, workOrderNumber: true, stage: true, checklist: { select: { branchId: true, branch: { select: { id: true, slug: true } } } } },
              take: LIMIT,
            })
            : Promise.resolve([]),

        // 4. Requests
        contractorId && role !== 'CLIENT'
          ? prisma.request.findMany({
            where: {
              branch: { client: { contractorId }, ...staffScope },
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                ...(numericValue !== null ? [{ requestNumber: numericValue }] : []),
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
                  ...(numericValue !== null ? [{ requestNumber: numericValue }] : []),
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
              branch: { client: { contractorId }, ...staffScope },
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
                ...publishedFor(role),
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { description: { contains: query, mode: 'insensitive' } },
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
              branch: { client: { contractorId }, ...staffScope },
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
                ...publishedFor(role),
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
              branch: { client: { contractorId }, ...staffScope },
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
                  { model: { contains: query, mode: 'insensitive' } },
                  { serialNumber: { contains: query, mode: 'insensitive' } },
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
              branch: { client: { contractorId }, ...staffScope },
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { generatedContent: true, id: true, title: true, type: true, branchId: true, branch: { select: { slug: true, client: { select: { id: true, slug: true, companyName: true } } } } },
            take: LIMIT,
          })
          : clientBranchIds.length > 0
            ? prisma.certificate.findMany({
              where: {
                branchId: { in: clientBranchIds },
                AND: [{ OR: [{ contractId: null }, { contract: { status: { not: 'DRAFT' } } }] }],
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { description: { contains: query, mode: 'insensitive' } },
                ],
              },
              select: { generatedContent: true, id: true, title: true, type: true, branchId: true, branch: { select: { id: true, slug: true } } },
              take: LIMIT,
            })
            : Promise.resolve([]),

        // 9. Team members — contractor's own staff. Only the contractor owner manages
        // this roster (/dashboard/team redirects TEAM_MEMBER and CLIENT away), so it's
        // scoped to role === 'CONTRACTOR' rather than the broader isContractor check.
        role === 'CONTRACTOR' && contractorId
          ? prisma.teamMember.findMany({
            where: {
              contractorId,
              OR: [
                { user: { name: { contains: query, mode: 'insensitive' } } },
                { user: { email: { contains: query, mode: 'insensitive' } } },
                { jobTitle: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, jobTitle: true, teamRole: true, user: { select: { name: true, email: true } } },
            take: LIMIT,
          })
          : Promise.resolve([]),

        // 10. Branch requests — a client's pending/rejected ask for a new branch. Approved
        // ones are excluded since they already exist as a searchable Branch by then.
        contractorId && role === 'CONTRACTOR'
          ? prisma.branchRequest.findMany({
            where: {
              client: { contractorId },
              status: { not: 'APPROVED' },
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { address: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, name: true, status: true, client: { select: { id: true, slug: true, companyName: true } } },
            take: LIMIT,
          })
          : clientId
            ? prisma.branchRequest.findMany({
              where: {
                clientId,
                status: { not: 'APPROVED' },
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { address: { contains: query, mode: 'insensitive' } },
                  { city: { contains: query, mode: 'insensitive' } },
                ],
              },
              select: { id: true, name: true, status: true },
              take: LIMIT,
            })
            : Promise.resolve([]),

        // 11. Appointments
        contractorId && role !== 'CLIENT'
          ? prisma.appointment.findMany({
            where: {
              branch: { client: { contractorId }, ...staffScope },
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, title: true, status: true, branchId: true, branch: { select: { slug: true, client: { select: { id: true, slug: true, companyName: true } } } } },
            take: LIMIT,
          })
          : clientBranchIds.length > 0
            ? prisma.appointment.findMany({
              where: {
                branchId: { in: clientBranchIds },
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { description: { contains: query, mode: 'insensitive' } },
                ],
              },
              select: { id: true, title: true, status: true, branchId: true, branch: { select: { id: true, slug: true } } },
              take: LIMIT,
            })
            : Promise.resolve([]),

        // 12. Contractors — ADMIN only, platform-wide. Gated on the same
        // canManageContractors permission that guards GET /api/admin/contractors.
        isAdmin && adminPerms?.canManageContractors
          ? prisma.contractor.findMany({
            where: {
              OR: [
                { companyName: { contains: query, mode: 'insensitive' } },
                { companyEmail: { contains: query, mode: 'insensitive' } },
                { companyPhone: { contains: query, mode: 'insensitive' } },
                { contactPersonName: { contains: query, mode: 'insensitive' } },
                { contactPersonEmail: { contains: query, mode: 'insensitive' } },
                { contactPersonPhone: { contains: query, mode: 'insensitive' } },
                { licenseNumber: { contains: query, mode: 'insensitive' } },
                { crNumber: { contains: query, mode: 'insensitive' } },
                { user: { email: { contains: query, mode: 'insensitive' } } },
                { user: { name: { contains: query, mode: 'insensitive' } } },
              ],
            },
            select: { id: true, companyName: true, user: { select: { name: true, email: true } } },
            take: LIMIT,
          })
          : Promise.resolve([]),

        // 13. Contact inquiries ("Messages") — ADMIN only, platform-wide. Gated on the
        // same canManageMessages permission that guards GET /api/admin/messages.
        isAdmin && adminPerms?.canManageMessages
          ? prisma.contactInquiry.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
                { companyName: { contains: query, mode: 'insensitive' } },
                { message: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, name: true, email: true, status: true },
            take: LIMIT,
          })
          : Promise.resolve([]),
        // Quotations share billing publication and branch-access rules.
        contractorId || clientBranchIds.length > 0
          ? prisma.quotation.findMany({
            where: {
              ...(contractorId ? { branch: { client: { contractorId }, ...staffScope } } : { branchId: { in: clientBranchIds }, ...publishedFor(role) }),
              OR: [{ title: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }],
            },
            select: { id: true, title: true, status: true, branchId: true, branch: { select: { slug: true, client: { select: { id: true, slug: true, companyName: true } } } } },
            take: LIMIT,
          }) : Promise.resolve([]),
      ])

      // --- Format results ---
      type SearchResult = {
        id: string
        type: 'client' | 'branch' | 'work_order' | 'request' | 'contract' | 'invoice' | 'equipment' | 'certificate'
          | 'team_member' | 'branch_request' | 'appointment' | 'contractor' | 'inquiry' | 'quotation'
        title: string
        subtitle: string
        link: string
      }

      const isContractor = role === 'CONTRACTOR' || role === 'TEAM_MEMBER'

      // The contractor-scoped and client-scoped branch of each query above select
      // slightly different shapes (a client only ever sees their own data, so the nested
      // `client` relation and a couple of role-only fields are omitted for them) — these
      // types describe the union of both branches so the formatting below stays fully
      // typed instead of casting to `any`.
      type WithBranch = { slug: string | null; client?: { id: string; slug: string | null; companyName: string } }
      type BranchRow = { id: string; slug: string | null; name: string; displayName?: string | null; clientNickname?: string | null; address: string; client?: { id: string; slug: string | null; companyName?: string } }
      type WorkOrderRow = { id: string; description: string; workOrderNumber: number | null; stage: string; checklist: { branchId: string; branch: WithBranch } }
      type RequestRow = { id: string; title: string; status: string; requestNumber: number | null; branchId: string; branch: WithBranch }
      type ContractRow = { id: string; title: string; status: string; branchId: string; branch: WithBranch }
      type InvoiceRow = { id: string; title: string; invoiceNumber: string; status: string; branchId: string; branch: WithBranch }
      type EquipmentRow = { id: string; equipmentNumber: string; equipmentType: string; location: string | null; branchId: string; branch: WithBranch }
      type CertificateRow = { id: string; title: string; type: string; branchId: string; branch: WithBranch }
      type TeamMemberRow = { id: string; jobTitle: string | null; teamRole: string; user: { name: string | null; email: string } }
      type BranchRequestRow = { id: string; name: string; status: string; client?: { id: string; slug: string | null; companyName: string } }
      type AppointmentRow = { id: string; title: string; status: string; branchId: string; branch: WithBranch }
      type ContractorRow = { id: string; companyName: string | null; user: { name: string | null; email: string } }
      type InquiryRow = { id: string; name: string; email: string; status: string }

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
        ...(branches as BranchRow[]).map(b => ({
          id: b.id,
          type: 'branch' as const,
          title: b.displayName || b.clientNickname || b.name,
          subtitle: `${isContractor ? (b.client?.companyName + ' · ') : ''}${b.address}`,
          link: isContractor
            ? `/dashboard/clients/${b.client?.slug || b.client?.id}/branches/${b.slug || b.id}`
            : `/portal/branches/${b.slug || b.id}`,
        })),

        // Work Orders
        ...(workOrders as WorkOrderRow[]).map(wo => ({
          id: wo.id,
          type: 'work_order' as const,
          title: wo.workOrderNumber ? `WO-${String(wo.workOrderNumber).padStart(4, '0')} ${generatedField(wo, 'description', locale)}` : generatedField(wo, 'description', locale),
          subtitle: isContractor
            ? `${wo.checklist?.branch?.client?.companyName} · ${enumLabel(wo.stage, locale)}`
            : enumLabel(wo.stage, locale),
          link: isContractor
            ? `/dashboard/clients/${wo.checklist?.branch?.client?.slug || wo.checklist?.branch?.client?.id}/branches/${wo.checklist?.branch?.slug || wo.checklist?.branchId}?tab=checklists`
            : `/portal/branches/${wo.checklist?.branch?.slug || wo.checklist?.branchId}?tab=checklist`,
        })),

        // Requests
        ...(requests as RequestRow[]).map(r => ({
          id: r.id,
          type: 'request' as const,
          title: r.requestNumber ? `REQ-${String(r.requestNumber).padStart(4, '0')} ${r.title}` : r.title,
          subtitle: isContractor
            ? `${r.branch?.client?.companyName} · ${enumLabel(r.status, locale)}`
            : enumLabel(r.status, locale),
          link: isContractor
            ? `/dashboard/clients/${r.branch?.client?.slug || r.branch?.client?.id}/branches/${r.branch?.slug || r.branchId}?tab=requests`
            : `/portal/branches/${r.branch?.slug || r.branchId}?tab=requests`,
        })),

        // Contracts
        ...(contracts as ContractRow[]).map(c => ({
          id: c.id,
          type: 'contract' as const,
          title: c.title,
          subtitle: isContractor
            ? `${c.branch?.client?.companyName} · ${enumLabel(c.status, locale)}`
            : enumLabel(c.status, locale),
          link: isContractor
            ? `/dashboard/clients/${c.branch?.client?.slug || c.branch?.client?.id}/branches/${c.branch?.slug || c.branchId}?tab=contracts`
            : `/portal/branches/${c.branch?.slug || c.branchId}?tab=contracts`,
        })),

        ...quotations.map(q => ({
          id: q.id,
          type: 'quotation' as const,
          title: q.title,
          subtitle: enumLabel(q.status, locale),
          link: isContractor
            ? `/dashboard/clients/${q.branch.client.slug || q.branch.client.id}/branches/${q.branch.slug || q.branchId}?tab=billing`
            : `/portal/branches/${q.branch.slug || q.branchId}?tab=billing`,
        })),
        // Invoices
        ...(invoices as InvoiceRow[]).map(inv => ({
          id: inv.id,
          type: 'invoice' as const,
          title: inv.invoiceNumber ? `${inv.invoiceNumber} — ${inv.title}` : inv.title,
          subtitle: isContractor
            ? `${inv.branch?.client?.companyName} · ${enumLabel(inv.status, locale)}`
            : enumLabel(inv.status, locale),
          link: isContractor
            ? `/dashboard/clients/${inv.branch?.client?.slug || inv.branch?.client?.id}/branches/${inv.branch?.slug || inv.branchId}?tab=billing`
            : `/portal/branches/${inv.branch?.slug || inv.branchId}?tab=billing`,
        })),

        // Equipment
        ...(equipment as EquipmentRow[]).map(eq => ({
          id: eq.id,
          type: 'equipment' as const,
          title: `${eq.equipmentNumber} — ${enumLabel(eq.equipmentType, locale)}`,
          subtitle: isContractor
            ? `${eq.branch?.client?.companyName}${eq.location ? ' · ' + eq.location : ''}`
            : eq.location || enumLabel(eq.equipmentType, locale),
          link: isContractor
            ? `/dashboard/clients/${eq.branch?.client?.slug || eq.branch?.client?.id}/branches/${eq.branch?.slug || eq.branchId}?tab=equipment`
            : `/portal/branches/${eq.branch?.slug || eq.branchId}?tab=equipment`,
        })),

        // Certificates
        ...(certificates as CertificateRow[]).map(cert => ({
          id: cert.id,
          type: 'certificate' as const,
          title: generatedField(cert, 'title', locale),
          subtitle: isContractor
            ? `${cert.branch?.client?.companyName} · ${enumLabel(cert.type, locale)}`
            : enumLabel(cert.type, locale),
          link: isContractor
            ? `/dashboard/clients/${cert.branch?.client?.slug || cert.branch?.client?.id}/branches/${cert.branch?.slug || cert.branchId}?tab=certificates`
            : `/portal/branches/${cert.branch?.slug || cert.branchId}?tab=certificates`,
        })),

        // Team members (staff) — contractor-only roster, no per-member deep link
        ...(teamMembers as TeamMemberRow[]).map(m => ({
          id: m.id,
          type: 'team_member' as const,
          title: m.user?.name || m.user?.email,
          subtitle: m.jobTitle || enumLabel(m.teamRole, locale),
          link: `/dashboard/team`,
        })),

        // Branch requests — pending/rejected asks for a new branch
        ...(branchRequests as BranchRequestRow[]).map(br => ({
          id: br.id,
          type: 'branch_request' as const,
          title: br.name,
          subtitle: isContractor
            ? `${br.client?.companyName} · ${enumLabel(br.status, locale)}`
            : enumLabel(br.status, locale),
          link: isContractor ? `/dashboard` : `/portal`,
        })),

        // Appointments
        ...(appointments as AppointmentRow[]).map(a => ({
          id: a.id,
          type: 'appointment' as const,
          title: a.title,
          subtitle: isContractor
            ? `${a.branch?.client?.companyName} · ${enumLabel(a.status, locale)}`
            : enumLabel(a.status, locale),
          link: isContractor
            ? `/dashboard/clients/${a.branch?.client?.slug || a.branch?.client?.id}/branches/${a.branch?.slug || a.branchId}?tab=calendar`
            : `/portal/branches/${a.branch?.slug || a.branchId}?tab=calendar`,
        })),

        // Contractors — ADMIN only
        ...(contractors as ContractorRow[]).map(c => ({
          id: c.id,
          type: 'contractor' as const,
          title: c.companyName || c.user?.name || c.user?.email,
          subtitle: c.user?.email,
          link: `/admin/contractors?q=${encodeURIComponent(c.companyName || c.user?.email || '')}`,
        })),

        // Contact inquiries ("Messages") — ADMIN only
        ...(inquiries as InquiryRow[]).map(i => ({
          id: i.id,
          type: 'inquiry' as const,
          title: i.name,
          subtitle: `${i.email} · ${enumLabel(i.status, locale)}`,
          link: `/admin/messages?id=${i.id}`,
        })),
      ]

      return formatted
    }
    // Permission and publication changes must not leave stale sensitive search results.
    const results = session.user.role === 'TEAM_MEMBER' || session.user.role === 'CLIENT' || session.user.role === 'ADMIN'
      ? await loadResults()
      : await getCached(`v3:${cacheKey}:${locale}`, loadResults, 30)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
