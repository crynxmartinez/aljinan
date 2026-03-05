/**
 * File Upload Security
 * 
 * Validates and secures file uploads to prevent malicious files
 */

import { sanitizeFilename } from './sanitize'

// Allowed file types (whitelist approach)
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf'],
  all: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
}

// Allowed file extensions
export const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  documents: ['.pdf'],
  all: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']
}

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,      // 10MB for images
  document: 10 * 1024 * 1024,   // 10MB for documents
  default: 10 * 1024 * 1024     // 10MB default
}

/**
 * Validate file type
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: string[] = ALLOWED_FILE_TYPES.all
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }
  
  return { valid: true }
}

/**
 * Validate file extension
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[] = ALLOWED_EXTENSIONS.all
): { valid: boolean; error?: string } {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File extension ${ext} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
    }
  }
  
  return { valid: true }
}

/**
 * Validate file size
 */
export function validateFileSize(
  size: number,
  maxSize: number = FILE_SIZE_LIMITS.default
): { valid: boolean; error?: string } {
  if (size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1)
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`
    }
  }
  
  if (size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    }
  }
  
  return { valid: true }
}

/**
 * Validate filename
 */
export function validateFilename(filename: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!filename) {
    return { valid: false, error: 'Filename is required' }
  }
  
  // Check for dangerous patterns
  if (filename.includes('..')) {
    return { valid: false, error: 'Filename contains invalid characters (..)' }
  }
  
  if (filename.includes('/') || filename.includes('\\')) {
    return { valid: false, error: 'Filename contains path separators' }
  }
  
  // Sanitize filename
  const sanitized = sanitizeFilename(filename)
  
  if (!sanitized || sanitized === 'unnamed') {
    return { valid: false, error: 'Invalid filename' }
  }
  
  return { valid: true, sanitized }
}

/**
 * Check for double extensions (e.g., file.pdf.exe)
 */
export function checkDoubleExtension(filename: string): { valid: boolean; error?: string } {
  const parts = filename.split('.')
  
  if (parts.length > 2) {
    // Check if any part before the last is an executable extension
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar']
    
    for (let i = 0; i < parts.length - 1; i++) {
      const ext = '.' + parts[i].toLowerCase()
      if (dangerousExtensions.includes(ext)) {
        return {
          valid: false,
          error: 'File appears to have a double extension, which is not allowed'
        }
      }
    }
  }
  
  return { valid: true }
}

/**
 * Comprehensive file validation
 */
export function validateFile(
  filename: string,
  mimeType: string,
  size: number,
  options: {
    allowedTypes?: string[]
    allowedExtensions?: string[]
    maxSize?: number
  } = {}
): { valid: boolean; errors: string[]; sanitizedFilename?: string } {
  const errors: string[] = []
  
  // Validate filename
  const filenameValidation = validateFilename(filename)
  if (!filenameValidation.valid) {
    errors.push(filenameValidation.error!)
    return { valid: false, errors }
  }
  
  const sanitizedFilename = filenameValidation.sanitized!
  
  // Check double extension
  const doubleExtValidation = checkDoubleExtension(sanitizedFilename)
  if (!doubleExtValidation.valid) {
    errors.push(doubleExtValidation.error!)
  }
  
  // Validate file type
  const typeValidation = validateFileType(mimeType, options.allowedTypes)
  if (!typeValidation.valid) {
    errors.push(typeValidation.error!)
  }
  
  // Validate file extension
  const extValidation = validateFileExtension(sanitizedFilename, options.allowedExtensions)
  if (!extValidation.valid) {
    errors.push(extValidation.error!)
  }
  
  // Validate file size
  const sizeValidation = validateFileSize(size, options.maxSize)
  if (!sizeValidation.valid) {
    errors.push(sizeValidation.error!)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedFilename
  }
}

/**
 * Generate safe filename with timestamp
 */
export function generateSafeFilename(originalFilename: string, prefix: string = ''): string {
  const sanitized = sanitizeFilename(originalFilename)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  
  const ext = sanitized.substring(sanitized.lastIndexOf('.'))
  const name = sanitized.substring(0, sanitized.lastIndexOf('.'))
  
  const safeName = prefix 
    ? `${prefix}_${timestamp}_${random}${ext}`
    : `${name}_${timestamp}_${random}${ext}`
  
  return safeName
}

/**
 * File upload error helper
 */
export function fileUploadError(errors: string[]) {
  return {
    error: 'File validation failed',
    details: errors,
    code: 'FILE_VALIDATION_FAILED',
    status: 400
  }
}
