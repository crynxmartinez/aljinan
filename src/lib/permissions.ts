/**
 * Centralized Access Control System
 * 
 * All permission checks in one place for consistency and maintainability
 */

import { prisma } from './prisma'
import { getCached, invalidateCache, CACHE_TAGS } from './cache'
import { UserRole } from '@prisma/client'

/** Seconds an access decision may be reused. Short, because it gates authorization. */
const BRANCH_ACCESS_CACHE_TTL = 60

/**
 * Check if a user may access a branch.
 *
 * Argument order differs from verifyBranchAccess for historical reasons; both resolve to
 * the same rules. Prefer verifyBranchAccess in route handlers — it is cached.
 */
export async function canAccessBranch(
  userId: string,
  userRole: UserRole,
  branchId: string
): Promise<boolean> {
  return verifyBranchAccess(branchId, userId, userRole)
}

/**
 * The single source of truth for branch-level access. Every route that takes a branchId
 * must call this before reading or writing anything scoped to that branch.
 *
 *   CONTRACTOR   — branches belonging to their own clients only
 *   CLIENT       — their own branches only
 *   TEAM_MEMBER  — only branches explicitly assigned via TeamMemberBranch
 *   ADMIN        — denied. Platform admins operate through the admin console, not
 *                  tenant data. Support access goes through impersonation, which is
 *                  permission-checked and audited.
 *
 * Cached briefly, so a revocation can take up to CACHE_TTL to be observed. Call
 * invalidateBranchAccessCache() from any path that changes assignments.
 */
export async function verifyBranchAccess(
  branchId: string,
  userId: string,
  role: string
): Promise<boolean> {
  if (!branchId || !userId) return false

  const cacheKey = CACHE_TAGS.BRANCH_ACCESS(branchId, userId, role)

  return getCached(cacheKey, async () => {
    if (role === 'CONTRACTOR') {
      const contractor = await prisma.contractor.findUnique({
        where: { userId },
        select: {
          id: true,
          clients: {
            select: {
              branches: {
                where: { id: branchId },
                select: { id: true }
              }
            }
          }
        }
      })
      return contractor?.clients.some(c => c.branches.length > 0) ?? false
    }

    if (role === 'CLIENT') {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: {
          client: {
            select: { userId: true }
          }
        }
      })
      return branch?.client.userId === userId
    }

    if (role === 'TEAM_MEMBER') {
      const access = await prisma.teamMemberBranch.findFirst({
        where: {
          teamMember: { userId },
          branchId
        },
        select: { id: true }
      })
      return !!access
    }

    return false
  }, BRANCH_ACCESS_CACHE_TTL)
}

/**
 * Drop cached access decisions for a user. Call after changing a team member's branch
 * assignments, or after archiving a user, so revocation is observed promptly.
 */
export async function invalidateBranchAccessCache(userId: string) {
  await invalidateCache(`branch:access:*:${userId}:*`)
}

/**
 * Check if user can access a specific contract
 */
export async function canAccessContract(
  userId: string,
  userRole: UserRole,
  contractId: string
): Promise<boolean> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { branchId: true }
  })

  if (!contract) return false

  return canAccessBranch(userId, userRole, contract.branchId)
}

/**
 * Check if user can edit a work order
 */
export async function canEditWorkOrder(
  userId: string,
  userRole: UserRole,
  workOrderId: string
): Promise<boolean> {
  // Fetch work order with branch info
  const workOrder = await prisma.checklistItem.findUnique({
    where: { id: workOrderId },
    select: {
      stage: true,
      checklist: {
        select: {
          branchId: true,
          branch: {
            select: {
              client: {
                select: { userId: true }
              }
            }
          }
        }
      }
    }
  })

  if (!workOrder?.checklist) return false

  // Clients can edit work orders in FOR_REVIEW stage (to approve/reject)
  if (userRole === 'CLIENT') {
    // Check if this is the client's work order
    const isOwnWorkOrder = workOrder.checklist.branch.client.userId === userId
    // Client can only edit if work order is in FOR_REVIEW stage
    return isOwnWorkOrder && workOrder.stage === 'FOR_REVIEW'
  }

  // Contractors and team members: allowed if they can reach the branch at all
  return canAccessBranch(userId, userRole, workOrder.checklist.branchId)
}

/**
 * Check if user can delete/archive a work order
 */
export async function canDeleteWorkOrder(
  _userId: string,
  userRole: UserRole,
  _workOrderId: string
): Promise<boolean> {
  // Only contractors can delete work orders
  return userRole === 'CONTRACTOR'
}

/**
 * Check if user can approve a contract
 */
export async function canApproveContract(
  userId: string,
  userRole: UserRole,
  contractId: string
): Promise<boolean> {
  // Only clients can approve contracts
  if (userRole !== 'CLIENT') {
    return false
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: {
      branch: {
        select: {
          client: {
            select: { userId: true }
          }
        }
      }
    }
  })

  return contract?.branch.client.userId === userId
}

/**
 * Check if user can access a request
 */
export async function canAccessRequest(
  userId: string,
  userRole: UserRole,
  requestId: string
): Promise<boolean> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { branchId: true }
  })

  if (!request) return false

  return canAccessBranch(userId, userRole, request.branchId)
}

/**
 * Check if user can edit a request
 */
export async function canEditRequest(
  userId: string,
  userRole: UserRole,
  requestId: string
): Promise<boolean> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      createdById: true,
      createdByRole: true,
      branchId: true
    }
  })

  if (!request) return false

  // Everyone must be able to reach the branch first.
  if (!(await canAccessBranch(userId, userRole, request.branchId))) {
    return false
  }

  if (userRole === 'CONTRACTOR') {
    return true
  }

  // Clients may edit only requests they raised themselves
  if (userRole === 'CLIENT') {
    return request.createdById === userId
  }

  return false
}

/**
 * Check if user can access an invoice
 */
export async function canAccessInvoice(
  userId: string,
  userRole: UserRole,
  invoiceId: string
): Promise<boolean> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { branchId: true }
  })

  if (!invoice) return false

  return canAccessBranch(userId, userRole, invoice.branchId)
}

/**
 * Check if user can pay an invoice
 */
export async function canPayInvoice(
  userId: string,
  userRole: UserRole,
  invoiceId: string
): Promise<boolean> {
  // Only clients can pay invoices
  if (userRole !== 'CLIENT') {
    return false
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      branch: {
        select: {
          client: {
            select: { userId: true }
          }
        }
      }
    }
  })

  return invoice?.branch.client.userId === userId
}

/**
 * Check if user can manage team members
 */
export async function canManageTeamMembers(
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  // Only contractors can manage team members
  return userRole === 'CONTRACTOR'
}

/**
 * Check if user can manage clients
 */
export async function canManageClients(
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  // Only contractors can manage clients
  return userRole === 'CONTRACTOR'
}

/**
 * Check if user can access equipment
 */
export async function canAccessEquipment(
  userId: string,
  userRole: UserRole,
  equipmentId: string
): Promise<boolean> {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { branchId: true }
  })

  if (!equipment) return false

  return canAccessBranch(userId, userRole, equipment.branchId)
}

/**
 * Check if user can edit equipment
 */
export async function canEditEquipment(
  userId: string,
  userRole: UserRole,
  equipmentId: string
): Promise<boolean> {
  // Only contractors and team members can edit equipment
  if (userRole === 'CLIENT') {
    return false
  }

  return canAccessEquipment(userId, userRole, equipmentId)
}

/**
 * Get all branches user has access to
 */
export async function getUserAccessibleBranches(
  userId: string,
  userRole: UserRole
): Promise<string[]> {
  // Contractors: branches belonging to their own clients only
  if (userRole === 'CONTRACTOR') {
    const branches = await prisma.branch.findMany({
      where: { client: { contractor: { userId } } },
      select: { id: true }
    })
    return branches.map(b => b.id)
  }

  // Clients have access to their own branches
  if (userRole === 'CLIENT') {
    const branches = await prisma.branch.findMany({
      where: {
        client: { userId }
      },
      select: { id: true }
    })
    return branches.map(b => b.id)
  }

  // Team members have access to assigned branches
  if (userRole === 'TEAM_MEMBER') {
    const access = await prisma.teamMemberBranch.findMany({
      where: {
        teamMember: { userId }
      },
      select: { branchId: true }
    })
    return access.map(a => a.branchId)
  }

  return []
}

/**
 * Permission denied error helper
 */
export function permissionDeniedError(action: string = 'perform this action') {
  return {
    error: `You do not have permission to ${action}`,
    code: 'PERMISSION_DENIED',
    status: 403
  }
}
