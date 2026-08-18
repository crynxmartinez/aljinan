import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create Redis client
// For development without Upstash, we'll use a simple in-memory store
// In production, you should use Upstash Redis
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined

/**
 * Fixed-window fallback used when Upstash is not configured.
 *
 * This is per-process, so on serverless it is only as effective as the number of warm
 * instances is small. It exists so local development behaves sensibly, NOT as a
 * production control — configure UPSTASH_REDIS_REST_URL for that.
 *
 * The previous implementation re-extended the window on every call and had an incr()
 * that never created a missing entry, so limits neither expired nor applied correctly.
 */
class MemoryStore {
  private store = new Map<string, { count: number; reset: number }>()
  private lastSweep = 0

  hit(key: string, limit: number, windowSeconds: number): { success: boolean; remaining: number } {
    const now = Date.now()
    this.sweep(now)

    const item = this.store.get(key)

    if (!item || now >= item.reset) {
      this.store.set(key, { count: 1, reset: now + windowSeconds * 1000 })
      return { success: true, remaining: limit - 1 }
    }

    if (item.count >= limit) {
      return { success: false, remaining: 0 }
    }

    item.count++
    return { success: true, remaining: limit - item.count }
  }

  /** Drop expired entries occasionally so the map cannot grow without bound. */
  private sweep(now: number) {
    if (now - this.lastSweep < 60_000) return
    this.lastSweep = now
    for (const [key, item] of this.store) {
      if (now >= item.reset) this.store.delete(key)
    }
  }
}

const memoryStore = new MemoryStore()

// Rate limiters for different use cases
export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
      analytics: true,
    })
  : null

export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
      analytics: true,
    })
  : null

export const fileUploadRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 uploads per hour
      analytics: true,
    })
  : null

// Fallback rate limiting for development (in-memory)
export async function checkRateLimit(
  identifier: string,
  limit: number,
  window: number // in seconds
): Promise<{ success: boolean; remaining: number }> {
  return memoryStore.hit(`ratelimit:${identifier}`, limit, window)
}

// Helper function to get client IP
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return 'unknown'
}

// Helper to check login rate limit
export async function checkLoginRateLimit(identifier: string) {
  if (loginRateLimit) {
    const { success, remaining } = await loginRateLimit.limit(identifier)
    return { success, remaining }
  }
  
  // Fallback: 5 attempts per 15 minutes (900 seconds)
  return checkRateLimit(identifier, 5, 900)
}

// Helper to check API rate limit
export async function checkApiRateLimit(identifier: string) {
  if (apiRateLimit) {
    const { success, remaining } = await apiRateLimit.limit(identifier)
    return { success, remaining }
  }
  
  // Fallback: 100 requests per minute (60 seconds)
  return checkRateLimit(identifier, 100, 60)
}

// Helper to check file upload rate limit
export async function checkFileUploadRateLimit(identifier: string) {
  if (fileUploadRateLimit) {
    const { success, remaining } = await fileUploadRateLimit.limit(identifier)
    return { success, remaining }
  }
  
  // Fallback: 20 uploads per hour (3600 seconds)
  return checkRateLimit(identifier, 20, 3600)
}

/**
 * Route-level rate limit guard.
 *
 * Returns a 429 response to hand straight back to the caller, or null to continue:
 *
 *   const limited = await enforceRateLimit(request, { name: 'contact', limit: 5, window: 3600 })
 *   if (limited) return limited
 *
 * Keys on the caller's IP by default. Pass `identifier` to key on something more stable
 * (an email for password reset, a user id for authenticated work) so an attacker cannot
 * sidestep the limit by rotating addresses.
 */
export async function enforceRateLimit(
  request: Request,
  opts: { name: string; limit: number; window: number; identifier?: string }
): Promise<Response | null> {
  const who = opts.identifier?.toLowerCase().trim() || getClientIp(request)
  const { success } = await checkRateLimit(`${opts.name}:${who}`, opts.limit, opts.window)

  if (success) return null

  const retryAfter = Math.ceil(opts.window / 60)
  return Response.json(
    { error: `Too many requests. Please try again in about ${retryAfter} minute(s).` },
    { status: 429, headers: { 'Retry-After': String(opts.window) } }
  )
}
