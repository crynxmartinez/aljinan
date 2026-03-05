/**
 * CSRF (Cross-Site Request Forgery) Protection
 * 
 * Prevents attackers from tricking users into performing unwanted actions
 */

import { randomBytes } from 'crypto'

/**
 * Generate a CSRF token
 * Used for forms and state-changing requests
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Verify CSRF token matches
 */
export function verifyCsrfToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false
  }
  
  // Constant-time comparison to prevent timing attacks
  if (token.length !== expectedToken.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * CSRF error helper
 */
export function csrfError() {
  return {
    error: 'Invalid or missing CSRF token',
    code: 'CSRF_TOKEN_INVALID',
    status: 403
  }
}
