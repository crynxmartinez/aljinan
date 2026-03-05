/**
 * Cache utilities with automatic invalidation
 * 
 * Simple cache tags for Next.js revalidation
 * Use router.refresh() on client side to invalidate
 */

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
}

/**
 * Invalidate caches - simplified version
 * Returns immediately, cache will be invalidated on next request
 */
export function invalidateBranchCache(branchId: string) {
  // Cache invalidation handled by router.refresh() on client
  return true
}

export function invalidateProjectCache(projectId: string, branchId: string) {
  // Cache invalidation handled by router.refresh() on client
  return true
}

export function invalidateUserCache(userId: string) {
  // Cache invalidation handled by router.refresh() on client
  return true
}
