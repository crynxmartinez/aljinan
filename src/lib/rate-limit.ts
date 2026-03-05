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

// In-memory store for development (fallback)
class MemoryStore {
  private store = new Map<string, { count: number; reset: number }>()

  async get(key: string) {
    const item = this.store.get(key)
    if (!item) return null
    if (Date.now() > item.reset) {
      this.store.delete(key)
      return null
    }
    return item.count
  }

  async set(key: string, count: number, ttl: number) {
    this.store.set(key, { count, reset: Date.now() + ttl * 1000 })
  }

  async incr(key: string) {
    const item = this.store.get(key)
    if (!item) return 1
    item.count++
    return item.count
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
  const key = `ratelimit:${identifier}`
  const count = (await memoryStore.get(key)) || 0

  if (count >= limit) {
    return { success: false, remaining: 0 }
  }

  await memoryStore.incr(key)
  await memoryStore.set(key, count + 1, window)

  return { success: true, remaining: limit - count - 1 }
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
