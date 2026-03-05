/**
 * Audit Logging System
 * 
 * Tracks all important actions for security, compliance, and debugging
 */

import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// Audit event types
export type AuditEventType =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_LOGIN_FAILED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'CLIENT_ARCHIVED'
  | 'BRANCH_CREATED'
  | 'BRANCH_UPDATED'
  | 'BRANCH_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_APPROVED'
  | 'PROJECT_COMPLETED'
  | 'WORK_ORDER_CREATED'
  | 'WORK_ORDER_UPDATED'
  | 'WORK_ORDER_DELETED'
  | 'WORK_ORDER_ARCHIVED'
  | 'WORK_ORDER_RESTORED'
  | 'REQUEST_CREATED'
  | 'REQUEST_UPDATED'
  | 'REQUEST_QUOTED'
  | 'REQUEST_ACCEPTED'
  | 'REQUEST_REJECTED'
  | 'INVOICE_CREATED'
  | 'INVOICE_UPDATED'
  | 'INVOICE_PAID'
  | 'EQUIPMENT_CREATED'
  | 'EQUIPMENT_UPDATED'
  | 'EQUIPMENT_DELETED'
  | 'FILE_UPLOADED'
  | 'FILE_DOWNLOADED'
  | 'PERMISSION_DENIED'
  | 'SECURITY_ALERT'

// Audit log entry
export interface AuditLogEntry {
  eventType: AuditEventType
  userId?: string
  userRole?: UserRole
  userEmail?: string
  resourceType?: string
  resourceId?: string
  action: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // In production, you would save this to a database table or external service
    // For now, we'll log to console and could extend to save to DB
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
      // Sanitize sensitive data
      details: entry.details ? sanitizeAuditDetails(entry.details) : undefined
    }
    
    // Log to console (in production, save to database or external service)
    console.log('[AUDIT]', JSON.stringify(logEntry))
    
    // TODO: Save to database table or external logging service
    // await prisma.auditLog.create({ data: logEntry })
    
  } catch (error) {
    // Never let audit logging break the application
    console.error('[AUDIT ERROR]', error)
  }
}

/**
 * Sanitize audit details to remove sensitive information
 */
function sanitizeAuditDetails(details: Record<string, any>): Record<string, any> {
  const sanitized = { ...details }
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard']
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  }
  
  return sanitized
}

/**
 * Log user login
 */
export async function logUserLogin(
  userId: string,
  userRole: UserRole,
  userEmail: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'USER_LOGIN',
    userId,
    userRole,
    userEmail,
    action: 'User logged in',
    ipAddress,
    userAgent,
    success: true
  })
}

/**
 * Log failed login attempt
 */
export async function logFailedLogin(
  email: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'USER_LOGIN_FAILED',
    userEmail: email,
    action: 'Failed login attempt',
    errorMessage: reason,
    ipAddress,
    userAgent,
    success: false
  })
}

/**
 * Log user logout
 */
export async function logUserLogout(
  userId: string,
  userRole: UserRole,
  userEmail: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'USER_LOGOUT',
    userId,
    userRole,
    userEmail,
    action: 'User logged out',
    success: true
  })
}

/**
 * Log resource creation
 */
export async function logResourceCreated(
  userId: string,
  userRole: UserRole,
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    eventType: `${resourceType.toUpperCase()}_CREATED` as AuditEventType,
    userId,
    userRole,
    resourceType,
    resourceId,
    action: `Created ${resourceType}`,
    details,
    success: true
  })
}

/**
 * Log resource update
 */
export async function logResourceUpdated(
  userId: string,
  userRole: UserRole,
  resourceType: string,
  resourceId: string,
  changes?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    eventType: `${resourceType.toUpperCase()}_UPDATED` as AuditEventType,
    userId,
    userRole,
    resourceType,
    resourceId,
    action: `Updated ${resourceType}`,
    details: { changes },
    success: true
  })
}

/**
 * Log resource deletion
 */
export async function logResourceDeleted(
  userId: string,
  userRole: UserRole,
  resourceType: string,
  resourceId: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    eventType: `${resourceType.toUpperCase()}_DELETED` as AuditEventType,
    userId,
    userRole,
    resourceType,
    resourceId,
    action: `Deleted ${resourceType}`,
    details: reason ? { reason } : undefined,
    success: true
  })
}

/**
 * Log permission denied
 */
export async function logPermissionDenied(
  userId: string,
  userRole: UserRole,
  action: string,
  resourceType?: string,
  resourceId?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'PERMISSION_DENIED',
    userId,
    userRole,
    resourceType,
    resourceId,
    action: `Permission denied: ${action}`,
    success: false
  })
}

/**
 * Log security alert
 */
export async function logSecurityAlert(
  userId: string | undefined,
  alert: string,
  details?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'SECURITY_ALERT',
    userId,
    action: alert,
    details,
    ipAddress,
    success: false
  })
}

/**
 * Log file upload
 */
export async function logFileUpload(
  userId: string,
  userRole: UserRole,
  filename: string,
  fileSize: number,
  mimeType: string,
  resourceType?: string,
  resourceId?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'FILE_UPLOADED',
    userId,
    userRole,
    resourceType,
    resourceId,
    action: 'File uploaded',
    details: {
      filename,
      fileSize,
      mimeType
    },
    success: true
  })
}

/**
 * Log invoice payment
 */
export async function logInvoicePayment(
  userId: string,
  userRole: UserRole,
  invoiceId: string,
  amount: number,
  paymentMethod?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'INVOICE_PAID',
    userId,
    userRole,
    resourceType: 'invoice',
    resourceId: invoiceId,
    action: 'Invoice paid',
    details: {
      amount,
      paymentMethod
    },
    success: true
  })
}

/**
 * Log work order archive
 */
export async function logWorkOrderArchive(
  userId: string,
  userRole: UserRole,
  workOrderId: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'WORK_ORDER_ARCHIVED',
    userId,
    userRole,
    resourceType: 'work_order',
    resourceId: workOrderId,
    action: 'Work order archived',
    details: reason ? { reason } : undefined,
    success: true
  })
}

/**
 * Log work order restore
 */
export async function logWorkOrderRestore(
  userId: string,
  userRole: UserRole,
  workOrderId: string,
  newStage: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'WORK_ORDER_RESTORED',
    userId,
    userRole,
    resourceType: 'work_order',
    resourceId: workOrderId,
    action: 'Work order restored from archive',
    details: { newStage },
    success: true
  })
}
