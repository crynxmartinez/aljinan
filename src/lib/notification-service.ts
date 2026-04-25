import { prisma } from '@/lib/prisma'

export type NotificationType =
  | 'NEW_REQUEST'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'WORK_ORDER_CREATED'
  | 'WORK_ORDER_STARTED'
  | 'WORK_ORDER_FOR_REVIEW'
  | 'WORK_ORDER_COMPLETED'
  | 'WORK_ORDER_REJECTED'
  | 'WORK_ORDER_REMINDER'
  | 'WORK_ORDER_ASSIGNED'
  | 'WORK_ORDER_PRICE_SET'
  | 'SIGNATURE_REQUIRED'
  | 'CONTRACT_SIGNED'
  | 'PROJECT_APPROVED'
  | 'CERTIFICATE_GENERATED'
  | 'PAYMENT_RECEIVED'
  | 'GENERAL'

export type NotificationPriority = 'high' | 'medium' | 'low'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
  relatedId?: string | null
  relatedType?: string | null
  priority?: NotificationPriority
  showPopup?: boolean
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const {
      userId,
      type,
      title,
      message,
      link = null,
      relatedId = null,
      relatedType = null,
      priority = 'medium',
      showPopup = false
    } = params

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        relatedId,
        relatedType,
        priority,
        showPopup,
        isRead: false
      }
    })

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

/**
 * Create notification for new request (for contractor)
 */
export async function notifyNewRequest(contractorId: string, requestId: string, requestTitle: string, branchId: string) {
  return createNotification({
    userId: contractorId,
    type: 'NEW_REQUEST',
    title: 'New Service Request',
    message: `New request: ${requestTitle}`,
    link: `/dashboard/branches/${branchId}/requests`,
    relatedId: requestId,
    relatedType: 'REQUEST',
    priority: 'high',
    showPopup: true
  })
}

/**
 * Create notification for work order moved to FOR_REVIEW
 */
export async function notifyWorkOrderForReview(clientId: string, workOrderDescription: string, workOrderId: string, branchId: string) {
  return createNotification({
    userId: clientId,
    type: 'WORK_ORDER_FOR_REVIEW',
    title: 'Work Order Ready for Review',
    message: `Work order "${workOrderDescription}" is ready for your review`,
    link: `/portal/branches/${branchId}?tab=checklist`,
    relatedId: workOrderId,
    relatedType: 'WORK_ORDER',
    priority: 'high',
    showPopup: true
  })
}

/**
 * Create notification for work order started
 */
export async function notifyWorkOrderStarted(clientId: string, workOrderDescription: string, workOrderId: string, branchId: string) {
  return createNotification({
    userId: clientId,
    type: 'WORK_ORDER_STARTED',
    title: 'Work Order Started',
    message: `Work on "${workOrderDescription}" has started`,
    link: `/portal/branches/${branchId}?tab=checklist`,
    relatedId: workOrderId,
    relatedType: 'WORK_ORDER',
    priority: 'medium',
    showPopup: false
  })
}

/**
 * Create notification for work order completed
 */
export async function notifyWorkOrderCompleted(clientId: string, workOrderDescription: string, workOrderId: string, branchId: string) {
  return createNotification({
    userId: clientId,
    type: 'WORK_ORDER_COMPLETED',
    title: 'Work Order Completed',
    message: `Work order "${workOrderDescription}" has been completed`,
    link: `/portal/branches/${branchId}?tab=checklist`,
    relatedId: workOrderId,
    relatedType: 'WORK_ORDER',
    priority: 'high',
    showPopup: true
  })
}

/**
 * Create notification for work order rejected (moved back to IN_PROGRESS)
 */
export async function notifyWorkOrderRejected(contractorId: string, workOrderDescription: string, workOrderId: string, branchId: string) {
  return createNotification({
    userId: contractorId,
    type: 'WORK_ORDER_REJECTED',
    title: 'Work Order Rejected',
    message: `Client rejected work order "${workOrderDescription}"`,
    link: `/dashboard/branches/${branchId}/work-orders`,
    relatedId: workOrderId,
    relatedType: 'WORK_ORDER',
    priority: 'high',
    showPopup: true
  })
}

/**
 * Create notification for work order assigned to technician
 */
export async function notifyWorkOrderAssigned(technicianId: string, workOrderDescription: string, workOrderId: string, branchId: string) {
  return createNotification({
    userId: technicianId,
    type: 'WORK_ORDER_ASSIGNED',
    title: 'New Work Order Assigned',
    message: `You have been assigned: "${workOrderDescription}"`,
    link: `/dashboard/branches/${branchId}/work-orders`,
    relatedId: workOrderId,
    relatedType: 'WORK_ORDER',
    priority: 'high',
    showPopup: true
  })
}

/**
 * Create notification for price set on work order
 */
export async function notifyPriceSet(clientId: string, workOrderDescription: string, price: number, workOrderId: string, branchId: string) {
  return createNotification({
    userId: clientId,
    type: 'WORK_ORDER_PRICE_SET',
    title: 'Price Set for Work Order',
    message: `Price of SAR ${price.toFixed(2)} set for "${workOrderDescription}"`,
    link: `/portal/branches/${branchId}?tab=checklist`,
    relatedId: workOrderId,
    relatedType: 'WORK_ORDER',
    priority: 'medium',
    showPopup: false
  })
}

/**
 * Create notification for signature required
 */
export async function notifySignatureRequired(userId: string, workOrderDescription: string, workOrderId: string, branchId: string, role: 'CLIENT' | 'CONTRACTOR') {
  const link = role === 'CLIENT' 
    ? `/portal/branches/${branchId}?tab=checklist`
    : `/dashboard/branches/${branchId}?tab=checklist`

  return createNotification({
    userId,
    type: 'SIGNATURE_REQUIRED',
    title: 'Signature Required',
    message: `Your signature is required for "${workOrderDescription}"`,
    link,
    relatedId: workOrderId,
    relatedType: 'WORK_ORDER',
    priority: 'high',
    showPopup: true
  })
}
