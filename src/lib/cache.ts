/**
 * Cache utilities with Redis and automatic invalidation
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client (only if credentials are available)
let redis: Redis | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

// Cache tag prefixes
export const CACHE_TAGS = {
  DASHBOARD: (userId: string) => `dashboard-${userId}`,
  BRANCHES: (clientId: string) => `branches-${clientId}`,
  BRANCH: (branchId: string) => `branch-${branchId}`,
  PROJECTS: (branchId: string) => `projects-${branchId}`,
  PROJECT: (projectId: string) => `project-${projectId}`,
  WORK_ORDERS: (branchId: string) => `work-orders-${branchId}`,
  REQUESTS: (branchId: string) => `requests-${branchId}`,
  EQUIPMENT: (branchId: string) => `equipment-${branchId}`,
  NOTIFICATIONS: (userId: string) => `notifications-${userId}`,
  USER: (userId: string) => `user-${userId}`,
  CONTRACTOR_CLIENTS: (userId: string) => `contractor:clients:${userId}`,
  BRANCH_ACCESS: (branchId: string, userId: string, role: string) => `branch:access:${branchId}:${userId}:${role}`,
  SEARCH: (userId: string, query: string) => `search:${userId}:${query}`,
}

/**
 * Get cached data or fetch and cache it
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60 // seconds
): Promise<T> {
  // If Redis is not configured, just fetch
  if (!redis) {
    return fetcher()
  }

  try {
    // Try cache first
    const cached = await redis.get<T>(key)
    if (cached !== null) {
      return cached
    }
    
    // Fetch and cache
    const data = await fetcher()
    await redis.setex(key, ttl, data)
    return data
  } catch (error) {
    // If Redis fails, fallback to direct fetch
    console.error('Redis error:', error)
    return fetcher()
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string) {
  if (!redis) return true

  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    return true
  } catch (error) {
    console.error('Cache invalidation error:', error)
    return false
  }
}

/**
 * Invalidate specific cache key
 */
export async function invalidateCacheKey(key: string) {
  if (!redis) return true

  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error('Cache invalidation error:', error)
    return false
  }
}

/**
 * Invalidate caches - simplified version
 * Returns immediately, cache will be invalidated on next request
 */
export async function invalidateBranchCache(branchId: string) {
  await invalidateCache(`*branch*${branchId}*`)
  return true
}

export async function invalidateProjectCache(projectId: string, branchId: string) {
  await invalidateCache(`*project*${projectId}*`)
  await invalidateCache(`*branch*${branchId}*`)
  return true
}

export async function invalidateUserCache(userId: string) {
  await invalidateCache(`*user*${userId}*`)
  await invalidateCache(`*contractor*${userId}*`)
  return true
}

export { redis }
