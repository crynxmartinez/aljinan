import { randomInt } from 'crypto'

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  // Minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Maximum length (prevent DoS attacks)
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters')
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // At least one number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Optional: At least one special character (uncomment if needed)
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   errors.push('Password must contain at least one special character')
  // }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function generateStrongPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*'

  const allChars = uppercase + lowercase + numbers + special

  // Math.random is not a CSPRNG: its output is predictable from observed values, and these
  // are real account credentials.
  const pick = (set: string) => set[randomInt(set.length)]

  // Ensure at least one of each required type
  let password = ''
  password += pick(uppercase)
  password += pick(lowercase)
  password += pick(numbers)
  password += pick(special)

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += pick(allChars)
  }
  
  // Fisher-Yates with a cryptographic RNG. Sorting by a random comparator is not a
  // uniform shuffle and reintroduces Math.random.
  const chars = password.split('')
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0
  
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  
  if (score <= 3) return 'weak'
  if (score <= 5) return 'medium'
  return 'strong'
}
