/**
 * Centralized Access Control System
 * 
 * All permission checks in one place for consistency and maintainability
 */

import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

/**
 * Check if user can access a specific branch
 */
export async function canAccessBranch(
  userId: string,
  userRole: UserRole,
  branchId: string
): Promise<boolean> {
  // Contractors can access all branches
  if (userRole === 'CONTRACTOR') {
    return true
  }

  // Clients can only access their own branches
  if (userRole === 'CLIENT') {
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

  // Team members can only access branches they're assigned to
  if (userRole === 'TEAM_MEMBER') {
    const access = await prisma.teamMemberBranch.findFirst({
      where: {
        teamMember: { userId },
        branchId
      }
    })
    return !!access
  }

  return false
}

/**
 * Check if user can access a specific project
 */
export async function canAccessProject(
  userId: string,
  userRole: UserRole,
  projectId: string
): Promise<boolean> {
  // Contractors can access all projects
  if (userRole === 'CONTRACTOR') {
    return true
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { branchId: true }
  })

  if (!project) return false

  return canAccessBranch(userId, userRole, project.branchId)
}

/**
 * Check if user can edit a work order
 */
export async function canEditWorkOrder(
  userId: string,
  userRole: UserRole,
  workOrderId: string
): Promise<boolean> {
  // Only contractors and team members can edit work orders
  if (userRole === 'CLIENT') {
    return false
  }

  if (userRole === 'CONTRACTOR') {
    return true
  }

  // Team members can edit if they have access to the branch
  const workOrder = await prisma.checklistItem.findUnique({
    where: { id: workOrderId },
    select: {
      checklist: {
        select: {
          project: {
            select: { branchId: true }
          }
        }
      }
    }
  })

  if (!workOrder?.checklist.project) return false

  return canAccessBranch(userId, userRole, workOrder.checklist.project.branchId)
}

/**
 * Check if user can delete/archive a work order
 */
export async function canDeleteWorkOrder(
  userId: string,
  userRole: UserRole,
  workOrderId: string
): Promise<boolean> {
  // Only contractors can delete work orders
  return userRole === 'CONTRACTOR'
}

/**
 * Check if user can approve a project
 */
export async function canApproveProject(
  userId: string,
  userRole: UserRole,
  projectId: string
): Promise<boolean> {
  // Only clients can approve projects
  if (userRole !== 'CLIENT') {
    return false
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
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

  return project?.branch.client.userId === userId
}

/**
 * Check if user can access a request
 */
export async function canAccessRequest(
  userId: string,
  userRole: UserRole,
  requestId: string
): Promise<boolean> {
  // Contractors can access all requests
  if (userRole === 'CONTRACTOR') {
    return true
  }

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

  // Contractors can edit all requests
  if (userRole === 'CONTRACTOR') {
    return true
  }

  // Clients can edit their own requests
  if (userRole === 'CLIENT' && request.createdById === userId) {
    return true
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
  // Contractors can access all invoices
  if (userRole === 'CONTRACTOR') {
    return true
  }

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
  // Contractors can access all equipment
  if (userRole === 'CONTRACTOR') {
    return true
  }

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
  // Contractors have access to all branches
  if (userRole === 'CONTRACTOR') {
    const branches = await prisma.branch.findMany({
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
