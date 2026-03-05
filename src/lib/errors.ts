/**
 * Centralized Error Handling
 * 
 * Provides helpful, specific error messages with suggestions for users
 */

export interface AppError {
  message: string
  code: string
  suggestion?: string
  field?: string
}

// Error codes for tracking and support
export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'AUTH_001',
  SESSION_EXPIRED: 'AUTH_002',
  INVALID_CREDENTIALS: 'AUTH_003',
  
  // Permissions
  PERMISSION_DENIED: 'PERM_001',
  INSUFFICIENT_ROLE: 'PERM_002',
  
  // Validation
  REQUIRED_FIELD: 'VAL_001',
  INVALID_EMAIL: 'VAL_002',
  INVALID_PHONE: 'VAL_003',
  INVALID_DATE: 'VAL_004',
  INVALID_PRICE: 'VAL_005',
  DATE_RANGE_INVALID: 'VAL_006',
  FILE_TOO_LARGE: 'VAL_007',
  FILE_TYPE_INVALID: 'VAL_008',
  
  // Business Logic
  QUOTATION_NOT_FOUND: 'BIZ_001',
  PROJECT_NOT_FOUND: 'BIZ_002',
  WORK_ORDER_NOT_FOUND: 'BIZ_003',
  INVALID_STATUS_TRANSITION: 'BIZ_004',
  DUPLICATE_ENTRY: 'BIZ_005',
  
  // System
  DATABASE_ERROR: 'SYS_001',
  NETWORK_ERROR: 'SYS_002',
  RATE_LIMIT_EXCEEDED: 'SYS_003',
  
  // Generic
  UNKNOWN_ERROR: 'ERR_000',
} as const

/**
 * Create a user-friendly error response
 */
export function createError(
  message: string,
  code: string,
  suggestion?: string,
  field?: string
): AppError {
  return {
    message,
    code,
    suggestion,
    field,
  }
}

/**
 * Authentication Errors
 */
export const authErrors = {
  unauthorized: () => createError(
    'You must be logged in to access this resource',
    ERROR_CODES.UNAUTHORIZED,
    'Please log in and try again'
  ),
  
  sessionExpired: () => createError(
    'Your session has expired',
    ERROR_CODES.SESSION_EXPIRED,
    'Please log in again to continue'
  ),
  
  invalidCredentials: () => createError(
    'Invalid email or password',
    ERROR_CODES.INVALID_CREDENTIALS,
    'Please check your credentials and try again'
  ),
}

/**
 * Permission Errors
 */
export const permissionErrors = {
  denied: (action: string) => createError(
    `You don't have permission to ${action}`,
    ERROR_CODES.PERMISSION_DENIED,
    'Contact your administrator if you need access'
  ),
  
  insufficientRole: (requiredRole: string) => createError(
    `This action requires ${requiredRole} role`,
    ERROR_CODES.INSUFFICIENT_ROLE,
    'Contact your administrator to request role upgrade'
  ),
}

/**
 * Validation Errors
 */
export const validationErrors = {
  required: (field: string) => createError(
    `${field} is required`,
    ERROR_CODES.REQUIRED_FIELD,
    `Please provide a ${field.toLowerCase()}`,
    field
  ),
  
  invalidEmail: (email: string) => createError(
    'Invalid email address',
    ERROR_CODES.INVALID_EMAIL,
    `"${email}" is not a valid email format. Example: user@example.com`,
    'email'
  ),
  
  invalidPhone: (phone: string) => createError(
    'Invalid phone number',
    ERROR_CODES.INVALID_PHONE,
    `"${phone}" is not a valid Saudi phone number. Format: +966XXXXXXXXX or 05XXXXXXXX`,
    'phone'
  ),
  
  invalidDate: (field: string) => createError(
    `Invalid date for ${field}`,
    ERROR_CODES.INVALID_DATE,
    'Please provide a valid date in YYYY-MM-DD format',
    field
  ),
  
  invalidPrice: (price: number) => createError(
    'Invalid price',
    ERROR_CODES.INVALID_PRICE,
    `Price must be positive and have maximum 2 decimal places. You entered: ${price}`,
    'price'
  ),
  
  dateRangeInvalid: () => createError(
    'End date must be after start date',
    ERROR_CODES.DATE_RANGE_INVALID,
    'Please select an end date that comes after the start date'
  ),
  
  fileTooLarge: (size: number, maxSize: number) => createError(
    'File too large',
    ERROR_CODES.FILE_TOO_LARGE,
    `Maximum file size is ${maxSize / (1024 * 1024)}MB. Your file is ${(size / (1024 * 1024)).toFixed(2)}MB. Please compress or choose a smaller file.`
  ),
  
  fileTypeInvalid: (type: string, allowed: string[]) => createError(
    'Invalid file type',
    ERROR_CODES.FILE_TYPE_INVALID,
    `File type "${type}" is not allowed. Allowed types: ${allowed.join(', ')}`
  ),
}

/**
 * Business Logic Errors
 */
export const businessErrors = {
  notFound: (resource: string, id?: string) => createError(
    `${resource} not found`,
    ERROR_CODES.QUOTATION_NOT_FOUND,
    id ? `No ${resource.toLowerCase()} found with ID: ${id}` : `The requested ${resource.toLowerCase()} does not exist`
  ),
  
  invalidStatusTransition: (from: string, to: string) => createError(
    'Invalid status change',
    ERROR_CODES.INVALID_STATUS_TRANSITION,
    `Cannot change status from "${from}" to "${to}". Please follow the correct workflow.`
  ),
  
  duplicateEntry: (field: string, value: string) => createError(
    'Duplicate entry',
    ERROR_CODES.DUPLICATE_ENTRY,
    `A record with ${field} "${value}" already exists. Please use a different ${field}.`,
    field
  ),
  
  quotationNotApproved: () => createError(
    'Quotation must be approved first',
    ERROR_CODES.INVALID_STATUS_TRANSITION,
    'Please approve the quotation before proceeding with this action'
  ),
  
  projectNotActive: () => createError(
    'Project must be active',
    ERROR_CODES.INVALID_STATUS_TRANSITION,
    'This action can only be performed on active projects'
  ),
}

/**
 * System Errors
 */
export const systemErrors = {
  database: () => createError(
    'Database error occurred',
    ERROR_CODES.DATABASE_ERROR,
    'Please try again. If the problem persists, contact support with error code: ' + ERROR_CODES.DATABASE_ERROR
  ),
  
  network: () => createError(
    'Network error',
    ERROR_CODES.NETWORK_ERROR,
    'Please check your internet connection and try again'
  ),
  
  rateLimit: (retryAfter?: number) => createError(
    'Too many requests',
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    retryAfter 
      ? `Please wait ${retryAfter} seconds before trying again`
      : 'Please wait a moment before trying again'
  ),
  
  unknown: (originalError?: string) => createError(
    'An unexpected error occurred',
    ERROR_CODES.UNKNOWN_ERROR,
    originalError 
      ? `Error details: ${originalError}. Please contact support with error code: ${ERROR_CODES.UNKNOWN_ERROR}`
      : `Please try again. If the problem persists, contact support with error code: ${ERROR_CODES.UNKNOWN_ERROR}`
  ),
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: AppError, status: number = 400) {
  return {
    error: error.message,
    code: error.code,
    suggestion: error.suggestion,
    field: error.field,
    status,
  }
}

/**
 * Parse and enhance Prisma errors
 */
export function parsePrismaError(error: any): AppError {
  // Unique constraint violation
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field'
    return businessErrors.duplicateEntry(field, 'this value')
  }
  
  // Foreign key constraint violation
  if (error.code === 'P2003') {
    return createError(
      'Related record not found',
      ERROR_CODES.DATABASE_ERROR,
      'The referenced record does not exist. Please check your input.'
    )
  }
  
  // Record not found
  if (error.code === 'P2025') {
    return businessErrors.notFound('Record')
  }
  
  // Generic database error
  return systemErrors.database()
}

/**
 * Safe error handler - never expose sensitive info
 */
export function safeError(error: unknown): AppError {
  // Already an AppError
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    return error as AppError
  }
  
  // Prisma error
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return parsePrismaError(error)
  }
  
  // Standard Error
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    if (process.env.NODE_ENV === 'production') {
      return systemErrors.unknown()
    }
    return systemErrors.unknown(error.message)
  }
  
  // Unknown error type
  return systemErrors.unknown()
}
