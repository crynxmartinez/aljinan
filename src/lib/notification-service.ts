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
    title: 'طلب خدمة جديد',
    message: `طلب جديد: ${requestTitle}`,
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
    title: 'أمر عمل جاهز للمراجعة',
    message: `أمر العمل "${workOrderDescription}" جاهز للمراجعة`,
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
    title: 'بدء أمر العمل',
    message: `بدأ العمل على "${workOrderDescription}"`,
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
    title: 'إكمال أمر العمل',
    message: `تم إكمال أمر العمل "${workOrderDescription}"`,
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
    title: 'رفض أمر العمل',
    message: `رفض العميل أمر العمل "${workOrderDescription}"`,
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
    title: 'تعيين أمر عمل جديد',
    message: `تم تعيينك: "${workOrderDescription}"`,
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
    title: 'تحديد سعر أمر العمل',
    message: `تم تحديد سعر ر.س ${price.toFixed(2)} لـ "${workOrderDescription}"`,
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
    title: 'التوقيع مطلوب',
    message: `توقيعك مطلوب لـ "${workOrderDescription}"`,
    link,
    relatedId: workOrderId,
    relatedType: 'WORK_ORDER',
    priority: 'high',
    showPopup: true
  })
}
