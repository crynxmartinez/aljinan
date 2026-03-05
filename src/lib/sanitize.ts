/**
 * Input Sanitization
 * 
 * Cleans user input to prevent XSS, code injection, and other attacks
 */

/**
 * Sanitize HTML input
 * Removes dangerous tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '')
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  
  // Remove object and embed tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
  sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
  
  // Remove form tags (prevent form injection)
  sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
  
  return sanitized
}

/**
 * Sanitize plain text input
 * For fields that should never contain HTML
 */
export function sanitizePlainText(input: string): string {
  if (!input) return ''
  
  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Decode HTML entities to prevent double-encoding attacks
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  return sanitized
}

/**
 * Sanitize filename
 * Prevents directory traversal and dangerous filenames
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'unnamed'
  
  // Remove path separators
  let sanitized = filename.replace(/[\/\\]/g, '')
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '')
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '')
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop()
    const name = sanitized.substring(0, 250 - (ext?.length || 0))
    sanitized = ext ? `${name}.${ext}` : name
  }
  
  // If empty after sanitization, use default
  if (!sanitized) {
    sanitized = 'unnamed'
  }
  
  return sanitized
}

/**
 * Sanitize URL
 * Prevents javascript: and data: protocol attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''
  
  const trimmed = url.trim().toLowerCase()
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return ''
    }
  }
  
  // Only allow http, https, mailto
  if (!trimmed.match(/^(https?:\/\/|mailto:|\/)/)) {
    return ''
  }
  
  return url.trim()
}

/**
 * Sanitize SQL input (extra layer on top of Prisma)
 * Removes SQL injection attempts
 */
export function sanitizeSql(input: string): string {
  if (!input) return ''
  
  // Remove SQL comments
  let sanitized = input.replace(/--.*$/gm, '')
  sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '')
  
  // Remove common SQL injection patterns
  sanitized = sanitized.replace(/;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC|EXECUTE)\s/gi, '')
  
  // Remove UNION attacks
  sanitized = sanitized.replace(/\bUNION\b.*\bSELECT\b/gi, '')
  
  return sanitized
}

/**
 * Sanitize phone number
 * Keeps only digits, +, spaces, and dashes
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return ''
  
  // Keep only valid phone characters
  return phone.replace(/[^\d+\s-]/g, '').trim()
}

/**
 * Sanitize email
 * Basic email sanitization
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''
  
  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim()
  
  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '')
  
  // Remove spaces
  sanitized = sanitized.replace(/\s/g, '')
  
  return sanitized
}

/**
 * Sanitize number input
 * Ensures input is a valid number
 */
export function sanitizeNumber(input: string | number): number | null {
  if (typeof input === 'number') {
    return isNaN(input) ? null : input
  }
  
  if (!input) return null
  
  // Remove non-numeric characters except decimal point and minus
  const cleaned = input.toString().replace(/[^\d.-]/g, '')
  
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/**
 * Sanitize JSON input
 * Prevents JSON injection attacks
 */
export function sanitizeJson(input: string): string {
  if (!input) return ''
  
  try {
    // Parse and re-stringify to ensure valid JSON
    const parsed = JSON.parse(input)
    return JSON.stringify(parsed)
  } catch {
    // If invalid JSON, return empty string
    return ''
  }
}

/**
 * Batch sanitize object
 * Sanitizes all string values in an object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizer: (value: string) => string = sanitizePlainText
): T {
  const sanitized = { ...obj }
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizer(sanitized[key]) as any
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key], sanitizer)
    }
  }
  
  return sanitized
}
