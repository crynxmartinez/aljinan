import { notificationData } from '@/lib/i18n/notification-messages'
import type { Database } from '@/lib/atomic-mutation'
import { prisma } from '@/lib/prisma'
import { resolveNotificationLink } from '@/lib/notification-links'

export type NotificationType =
  | 'NEW_REQUEST'
  | 'REQUEST_QUOTED'
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
  | 'QUOTATION_SENT'
  | 'QUOTATION_APPROVED'
  | 'QUOTATION_REJECTED'
  | 'APPOINTMENT_SCHEDULED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'BRANCH_REQUEST_CREATED'
  | 'BRANCH_REQUEST_APPROVED'
  | 'BRANCH_REQUEST_REJECTED'
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
export async function createNotification(params: CreateNotificationParams, db: Database = prisma) {
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

    const notification = await db.notification.create({
      data: notificationData({
        userId,
        type,
        title,
        message,
        link: await resolveNotificationLink(link, db),
        relatedId,
        relatedType,
        priority,
        showPopup,
        isRead: false
      })
    })

    return notification
}

/**
 * Create notification for new request (for contractor)
 */
export async function notifyNewRequest(contractorId: string, requestId: string, requestTitle: string, branchId: string, db: Database = prisma) {
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
  }, db)
}

/**
 * Create notification for work order moved to FOR_REVIEW
 */
export async function notifyWorkOrderForReview(clientId: string, workOrderDescription: string, workOrderId: string, branchId: string, db: Database = prisma) {
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
  }, db)
}

/**
 * Create notification for work order started
 */
export async function notifyWorkOrderStarted(clientId: string, workOrderDescription: string, workOrderId: string, branchId: string, db: Database = prisma) {
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
  }, db)
}

/**
 * Create notification for work order completed
 */
export async function notifyWorkOrderCompleted(clientId: string, workOrderDescription: string, workOrderId: string, branchId: string, db: Database = prisma) {
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
  }, db)
}

/**
 * Create notification for work order rejected (moved back to IN_PROGRESS)
 */
export async function notifyWorkOrderRejected(contractorId: string, workOrderDescription: string, workOrderId: string, branchId: string, db: Database = prisma) {
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
  }, db)
}

/**
 * Create notification for work order assigned to technician
 */
export async function notifyWorkOrderAssigned(technicianId: string, workOrderDescription: string, workOrderId: string, branchId: string, db: Database = prisma) {
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
  }, db)
}

/**
 * Create notification for price set on work order
 */
export async function notifyPriceSet(clientId: string, workOrderDescription: string, price: number, workOrderId: string, branchId: string, db: Database = prisma) {
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
  }, db)
}

/**
 * Create notification for signature required
 */
export async function notifySignatureRequired(userId: string, workOrderDescription: string, workOrderId: string, branchId: string, role: 'CLIENT' | 'CONTRACTOR', db: Database = prisma) {
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
  }, db)
}

/**
 * Create notification for a contractor's quote on a request (for client)
 */
export async function notifyRequestQuoted(clientId: string, requestTitle: string, requestId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: clientId,
    type: 'REQUEST_QUOTED',
    title: 'عرض سعر جديد',
    message: `تم إرسال عرض سعر لطلبك "${requestTitle}"`,
    link: `/portal/branches/${branchId}?tab=requests`,
    relatedId: requestId,
    relatedType: 'REQUEST',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for a client accepting a request's quote (for contractor)
 */
export async function notifyRequestApproved(contractorId: string, clientId: string, requestTitle: string, requestId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: contractorId,
    type: 'REQUEST_APPROVED',
    title: 'قبول عرض السعر',
    message: `وافق العميل على عرض السعر لـ "${requestTitle}"`,
    link: `/dashboard/clients/${clientId}/branches/${branchId}?tab=requests`,
    relatedId: requestId,
    relatedType: 'REQUEST',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for a client rejecting a request's quote (for contractor)
 */
export async function notifyRequestRejected(contractorId: string, clientId: string, requestTitle: string, requestId: string, branchId: string, rejectionNote?: string | null, db: Database = prisma) {
  return createNotification({
    userId: contractorId,
    type: 'REQUEST_REJECTED',
    title: 'رفض عرض السعر',
    message: rejectionNote
      ? `رفض العميل عرض السعر لـ "${requestTitle}": ${rejectionNote}`
      : `رفض العميل عرض السعر لـ "${requestTitle}"`,
    link: `/dashboard/clients/${clientId}/branches/${branchId}?tab=requests`,
    relatedId: requestId,
    relatedType: 'REQUEST',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for a quotation being sent to the client
 */
export async function notifyQuotationSent(clientId: string, quotationTitle: string, quotationId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: clientId,
    type: 'QUOTATION_SENT',
    title: 'عرض سعر جديد',
    message: `تم إرسال عرض السعر "${quotationTitle}" للمراجعة`,
    link: `/portal/branches/${branchId}?tab=quotations`,
    relatedId: quotationId,
    relatedType: 'QUOTATION',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for a client approving a quotation (for contractor)
 */
export async function notifyQuotationApproved(contractorId: string, clientId: string, quotationTitle: string, quotationId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: contractorId,
    type: 'QUOTATION_APPROVED',
    title: 'الموافقة على عرض السعر',
    message: `وافق العميل على عرض السعر "${quotationTitle}"`,
    link: `/dashboard/clients/${clientId}/branches/${branchId}?tab=quotations`,
    relatedId: quotationId,
    relatedType: 'QUOTATION',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for a client rejecting a quotation (for contractor)
 */
export async function notifyQuotationRejected(contractorId: string, clientId: string, quotationTitle: string, quotationId: string, branchId: string, rejectionNote?: string | null, db: Database = prisma) {
  return createNotification({
    userId: contractorId,
    type: 'QUOTATION_REJECTED',
    title: 'رفض عرض السعر',
    message: rejectionNote
      ? `رفض العميل عرض السعر "${quotationTitle}": ${rejectionNote}`
      : `رفض العميل عرض السعر "${quotationTitle}"`,
    link: `/dashboard/clients/${clientId}/branches/${branchId}?tab=quotations`,
    relatedId: quotationId,
    relatedType: 'QUOTATION',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for a new appointment scheduled by the contractor (for client)
 */
export async function notifyAppointmentScheduled(clientId: string, appointmentTitle: string, appointmentId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: clientId,
    type: 'APPOINTMENT_SCHEDULED',
    title: 'موعد جديد',
    message: `تم تحديد موعد: "${appointmentTitle}"`,
    link: `/portal/branches/${branchId}?tab=calendar`,
    relatedId: appointmentId,
    relatedType: 'APPOINTMENT',
    priority: 'medium',
    showPopup: true
  }, db)
}

/**
 * Create notification for a client confirming an appointment (for contractor)
 */
export async function notifyAppointmentConfirmed(contractorId: string, clientId: string, appointmentTitle: string, appointmentId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: contractorId,
    type: 'APPOINTMENT_CONFIRMED',
    title: 'تأكيد الموعد',
    message: `أكد العميل الموعد: "${appointmentTitle}"`,
    link: `/dashboard/clients/${clientId}/branches/${branchId}?tab=calendar`,
    relatedId: appointmentId,
    relatedType: 'APPOINTMENT',
    priority: 'medium',
    showPopup: false
  }, db)
}

/**
 * Create notification for a client cancelling an appointment (for contractor)
 */
export async function notifyAppointmentCancelled(contractorId: string, clientId: string, appointmentTitle: string, appointmentId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: contractorId,
    type: 'APPOINTMENT_CANCELLED',
    title: 'إلغاء الموعد',
    message: `ألغى العميل الموعد: "${appointmentTitle}"`,
    link: `/dashboard/clients/${clientId}/branches/${branchId}?tab=calendar`,
    relatedId: appointmentId,
    relatedType: 'APPOINTMENT',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for a client requesting to reschedule an appointment (for contractor)
 */
export async function notifyAppointmentRescheduleRequested(contractorId: string, clientId: string, appointmentTitle: string, appointmentId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: contractorId,
    type: 'APPOINTMENT_RESCHEDULED',
    title: 'طلب إعادة جدولة',
    message: `طلب العميل إعادة جدولة الموعد: "${appointmentTitle}"`,
    link: `/dashboard/clients/${clientId}/branches/${branchId}?tab=calendar`,
    relatedId: appointmentId,
    relatedType: 'APPOINTMENT',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for the contractor changing an appointment's date/time (for client)
 */
export async function notifyAppointmentTimeChanged(clientId: string, appointmentTitle: string, appointmentId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: clientId,
    type: 'APPOINTMENT_RESCHEDULED',
    title: 'تغيير موعد',
    message: `تم تغيير موعد: "${appointmentTitle}"`,
    link: `/portal/branches/${branchId}?tab=calendar`,
    relatedId: appointmentId,
    relatedType: 'APPOINTMENT',
    priority: 'medium',
    showPopup: true
  }, db)
}

/**
 * Create notification for a new branch request (for contractor)
 */
export async function notifyBranchRequestCreated(contractorId: string, branchName: string, branchRequestId: string, db: Database = prisma) {
  return createNotification({
    userId: contractorId,
    type: 'BRANCH_REQUEST_CREATED',
    title: 'طلب فرع جديد',
    message: `طلب العميل إنشاء فرع جديد: "${branchName}"`,
    link: `/dashboard`,
    relatedId: branchRequestId,
    relatedType: 'BRANCH_REQUEST',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for an approved branch request (for client)
 */
export async function notifyBranchRequestApproved(clientId: string, branchName: string, branchRequestId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: clientId,
    type: 'BRANCH_REQUEST_APPROVED',
    title: 'الموافقة على طلب الفرع',
    message: `تمت الموافقة على طلب الفرع "${branchName}"`,
    link: `/portal/branches/${branchId}`,
    relatedId: branchRequestId,
    relatedType: 'BRANCH_REQUEST',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for a rejected branch request (for client)
 */
export async function notifyBranchRequestRejected(clientId: string, branchName: string, branchRequestId: string, rejectionNote?: string | null, db: Database = prisma) {
  return createNotification({
    userId: clientId,
    type: 'BRANCH_REQUEST_REJECTED',
    title: 'رفض طلب الفرع',
    message: rejectionNote
      ? `تم رفض طلب الفرع "${branchName}": ${rejectionNote}`
      : `تم رفض طلب الفرع "${branchName}"`,
    link: `/portal`,
    relatedId: branchRequestId,
    relatedType: 'BRANCH_REQUEST',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for a client signing a contract (for contractor)
 */
export async function notifyContractSigned(contractorId: string, clientId: string, contractTitle: string, contractId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: contractorId,
    type: 'CONTRACT_SIGNED',
    title: 'توقيع العقد',
    message: `وقع العميل العقد "${contractTitle}"`,
    link: `/dashboard/clients/${clientId}/branches/${branchId}?tab=contracts`,
    relatedId: contractId,
    relatedType: 'Contract',
    priority: 'high',
    showPopup: true
  }, db)
}

/**
 * Create notification for a contract being completed (for contractor)
 */
export async function notifyContractCompleted(contractorId: string, clientId: string, contractTitle: string, contractId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: contractorId,
    type: 'CONTRACT_SIGNED',
    title: 'اكتمال العقد',
    message: `تم إكمال العقد "${contractTitle}"`,
    link: `/dashboard/clients/${clientId}/branches/${branchId}?tab=contracts`,
    relatedId: contractId,
    relatedType: 'Contract',
    priority: 'medium',
    showPopup: true
  }, db)
}

/**
 * Create notification for an auto-generated or issued certificate (for client)
 */
export async function notifyCertificateGenerated(clientId: string, certificateTitle: string, certificateId: string, branchId: string, db: Database = prisma) {
  return createNotification({
    userId: clientId,
    type: 'CERTIFICATE_GENERATED',
    title: 'إصدار شهادة',
    message: `تم إصدار شهادة: "${certificateTitle}"`,
    link: `/portal/branches/${branchId}?tab=certificates`,
    relatedId: certificateId,
    relatedType: 'Certificate',
    priority: 'medium',
    showPopup: true
  }, db)
}
