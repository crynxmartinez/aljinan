import { prisma } from '@/lib/prisma'
import { verifyBranchAccess } from '@/lib/permissions'
import { publishedFor } from '@/lib/publication'

/** Resolve sharing from actual attachments, never from caller-supplied entity metadata.
 * Also covers older Upload rows whose branchId was never populated.
 */
export async function canReadAttachment(uploadId: string, userId: string, role: string): Promise<boolean> {
  const url = `/api/files/${uploadId}`
  const [contracts, certificates, requests, requestPhotos, reportPhotos, invoices, payments, workOrders, branchCertificates] = await Promise.all([
    prisma.contract.findMany({ where: { ...publishedFor(role), OR: [{ fileUrl: url }, { certificateUrl: url }] }, select: { branchId: true } }),
    prisma.certificate.findMany({ where: { fileUrl: url, ...(role === 'CLIENT' ? { OR: [{ contractId: null }, { contract: { status: { not: 'DRAFT' } } }] } : {}) }, select: { branchId: true } }),
    prisma.request.findMany({ where: { quotationUrl: url }, select: { branchId: true } }),
    prisma.requestPhoto.findMany({ where: { url }, select: { request: { select: { branchId: true } } } }),
    prisma.inspectionPhoto.findMany({ where: { url }, select: { checklistItem: { select: { checklist: { select: { branchId: true } } } } } }),
    prisma.invoice.findMany({ where: { paymentProofUrl: url, ...publishedFor(role) }, select: { branchId: true } }),
    prisma.contractPayment.findMany({ where: { paymentProofUrl: url, contract: publishedFor(role) }, select: { contract: { select: { branchId: true } } } }),
    prisma.checklistItem.findMany({ where: { OR: [{ paymentProofUrl: url }, { reportUrl: url }], deletedAt: null }, select: { checklist: { select: { branchId: true } } } }),
    prisma.branch.findMany({ where: { cdCertificateUrl: url }, select: { id: true } }),
  ])
  const branches = new Set([
    ...contracts, ...certificates, ...requests, ...invoices, ...branchCertificates.map(row => ({ branchId: row.id })),
    ...requestPhotos.map(row => row.request), ...reportPhotos.map(row => row.checklistItem.checklist),
    ...payments.map(row => row.contract), ...workOrders.map(row => row.checklist),
  ].map(row => row.branchId))
  for (const branchId of branches) {
    if (await verifyBranchAccess(branchId, userId, role)) return true
  }
  return false
}
