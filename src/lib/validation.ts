/**
 * Data validation utilities
 * Ensures clean, consistent data across the application
 */

/**
 * Validate date range
 * End date must be after start date
 */
export function validateDateRange(startDate: Date, endDate: Date): { valid: boolean; error?: string } {
  if (endDate <= startDate) {
    return { valid: false, error: 'End date must be after start date' }
  }
  return { valid: true }
}

/**
 * Validate price
 * Must be positive and have max 2 decimal places
 */
export function validatePrice(price: number): { valid: boolean; error?: string } {
  if (price < 0) {
    return { valid: false, error: 'Price cannot be negative' }
  }
  
  // Check for max 2 decimal places
  const decimalPlaces = (price.toString().split('.')[1] || '').length
  if (decimalPlaces > 2) {
    return { valid: false, error: 'Price must have maximum 2 decimal places' }
  }
  
  return { valid: true }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  return { valid: true }
}

/**
 * Validate phone number (Saudi Arabia format)
 * Accepts: +966XXXXXXXXX, 05XXXXXXXX, 5XXXXXXXX
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '')
  
  // Saudi phone patterns
  const patterns = [
    /^\+9665\d{8}$/,  // +966 5XX XXX XXX
    /^05\d{8}$/,       // 05X XXX XXXX
    /^5\d{8}$/,        // 5X XXX XXXX
  ]
  
  const isValid = patterns.some(pattern => pattern.test(cleaned))
  
  if (!isValid) {
    return { valid: false, error: 'Invalid phone number format. Use Saudi format: +966XXXXXXXXX or 05XXXXXXXX' }
  }
  
  return { valid: true }
}

/**
 * Validate required string field
 */
export function validateRequired(value: string | null | undefined, fieldName: string): { valid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: `${fieldName} is required` }
  }
  return { valid: true }
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): { valid: boolean; error?: string } {
  if (value.length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` }
  }
  if (value.length > max) {
    return { valid: false, error: `${fieldName} must be at most ${max} characters` }
  }
  return { valid: true }
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: number, fieldName: string): { valid: boolean; error?: string } {
  if (value <= 0) {
    return { valid: false, error: `${fieldName} must be a positive number` }
  }
  return { valid: true }
}

/**
 * Validate future date
 * Date must be in the future
 */
export function validateFutureDate(date: Date, fieldName: string): { valid: boolean; error?: string } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  if (checkDate < now) {
    return { valid: false, error: `${fieldName} must be a future date` }
  }
  
  return { valid: true }
}

/**
 * Sanitize string input
 * Removes leading/trailing whitespace and normalizes spaces
 */
export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/**
 * Validate and sanitize email
 */
export function validateAndSanitizeEmail(email: string): { valid: boolean; email?: string; error?: string } {
  const sanitized = email.trim().toLowerCase()
  const validation = validateEmail(sanitized)
  
  if (!validation.valid) {
    return { valid: false, error: validation.error }
  }
  
  return { valid: true, email: sanitized }
}

/**
 * Batch validation helper
 * Runs multiple validations and returns all errors
 */
export function validateAll(
  validations: Array<{ valid: boolean; error?: string }>
): { valid: boolean; errors: string[] } {
  const errors = validations
    .filter(v => !v.valid)
    .map(v => v.error!)
  
  return {
    valid: errors.length === 0,
    errors
  }
}
