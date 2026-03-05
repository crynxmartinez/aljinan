# PHASE 2: PERFORMANCE & DATABASE OPTIMIZATION
## Implementation Plan

**Timeline:** 10-14 days  
**Priority:** 🟠 HIGH - Prevents future problems  
**Estimated Time:** 30-40 hours  

---

## 🎯 YOUR REQUIREMENTS

### **1. Smart Caching (Your Requirement)**
- **What you want:** Cache data to load faster, but invalidate immediately when changes happen
- **Not what you want:** Hard cache that shows stale data after updates
- **Solution:** Cache with automatic invalidation on mutations

### **2. Kanban Archive Column (Your Requirement)**
- **What you want:** Add "Archive" column on the right side of Kanban board
- **Purpose:** Soft-deleted work orders go here instead of being permanently deleted
- **Behavior:** When user deletes a work order, it moves to Archive column
- **Can restore:** Yes, can move back from Archive to other stages

### **3. Other Phase 2 Items (You're good with these)**
- Database indexes
- Query optimization
- Data validation
- Pagination

---

## 📋 PHASE 2 TASKS BREAKDOWN

### **Task 1: Database Indexes** ⚡ (3-4 hours)
**Priority:** Critical for performance

**What we'll index:**
1. **ChecklistItem table:**
   - `checklistId` (already indexed via relation)
   - `stage` (for Kanban board filtering)
   - `scheduledDate` (for date sorting)
   - `isCompleted` (for filtering)
   - `deletedAt` (for soft delete filtering) - NEW
   - Composite: `(branchId, stage, deletedAt)` for fast Kanban queries

2. **Branch table:**
   - `clientId` (already indexed via relation)
   - `name` (for search)

3. **Project table:**
   - `branchId` (already indexed)
   - `status` (for filtering active projects)

4. **Request table:**
   - `branchId` (already indexed)
   - `status` (for filtering)
   - `createdAt` (for sorting)

5. **Equipment table:**
   - `branchId` (already indexed)
   - `expectedExpiry` (for expiring equipment queries)
   - `status` (for filtering)

**Implementation:**
```prisma
// Add to schema.prisma
@@index([stage])
@@index([scheduledDate])
@@index([deletedAt])
@@index([branchId, stage, deletedAt])
```

**Time:** 3-4 hours (including migration testing)

---

### **Task 2: Smart Caching with Auto-Invalidation** 🚀 (8-10 hours)
**Priority:** High - Major performance boost

**Your Requirement:** Cache should update immediately when data changes

**Strategy:**
1. **What to cache:**
   - Dashboard statistics (counts, summaries)
   - User permissions and roles
   - Branch lists
   - Project lists
   - Work order lists (Kanban board)

2. **Cache duration:**
   - Dashboard stats: 5 minutes
   - User data: 10 minutes
   - Lists: 2 minutes

3. **Auto-invalidation triggers:**
   - When work order created → invalidate Kanban cache
   - When work order updated → invalidate Kanban cache
   - When work order deleted → invalidate Kanban cache
   - When project created → invalidate project list cache
   - When branch created → invalidate branch list cache

**Implementation approach:**

**Option A: Simple In-Memory Cache (Recommended for now)**
- Use Next.js built-in caching with `revalidateTag`
- No external dependencies
- Automatic invalidation
- Works with Vercel

**Option B: Redis Cache (Future upgrade)**
- Better for multiple servers
- Persistent cache
- More control

**We'll use Option A (Simple) with these features:**

```typescript
// Cache with tags for invalidation
export async function getCachedKanbanItems(branchId: string) {
  return fetch(`/api/branches/${branchId}/checklist-items`, {
    next: {
      revalidate: 120, // 2 minutes
      tags: [`kanban-${branchId}`]
    }
  })
}

// Invalidate cache when data changes
import { revalidateTag } from 'next/cache'

export async function updateWorkOrder(branchId: string, data: any) {
  // Update database
  await prisma.checklistItem.update(...)
  
  // Invalidate cache immediately
  revalidateTag(`kanban-${branchId}`)
  revalidateTag(`dashboard-${branchId}`)
}
```

**Files to create:**
- `src/lib/cache.ts` - Cache utilities
- `src/lib/cache-tags.ts` - Cache tag definitions

**Files to modify:**
- All API routes that fetch lists
- All API routes that mutate data (POST, PATCH, DELETE)

**Time:** 8-10 hours

---

### **Task 3: Soft Deletes + Kanban Archive Column** 🗄️ (6-8 hours)
**Priority:** High - Your specific requirement

**Your Requirement:** Archive column on Kanban board for deleted work orders

**Database Changes:**

1. **Add `deletedAt` field to ChecklistItem:**
```prisma
model ChecklistItem {
  // ... existing fields
  deletedAt       DateTime?      // Soft delete timestamp
  deletedBy       String?        // User who deleted it
  deletedReason   String?        // Optional: why it was deleted
}
```

2. **Add `ARCHIVED` stage:**
```prisma
enum ChecklistItemStage {
  REQUESTED
  SCHEDULED
  IN_PROGRESS
  FOR_REVIEW
  COMPLETED
  ARCHIVED        // NEW - for soft-deleted items
}
```

**Kanban Board Changes:**

**Current columns:**
1. Requested
2. Scheduled
3. In Progress
4. For Review
5. Completed

**New columns:**
1. Requested
2. Scheduled
3. In Progress
4. For Review
5. Completed
6. **Archive** ← NEW (rightmost column)

**Behavior:**

**When user clicks "Delete" on work order:**
```typescript
// Instead of hard delete:
// await prisma.checklistItem.delete({ where: { id } })

// Do soft delete (move to Archive):
await prisma.checklistItem.update({
  where: { id },
  data: {
    stage: 'ARCHIVED',
    deletedAt: new Date(),
    deletedBy: userId,
  }
})

// Invalidate cache
revalidateTag(`kanban-${branchId}`)
```

**Archive column features:**
- Shows all soft-deleted work orders
- Grayed out appearance
- Can restore (move back to previous stage)
- Can permanently delete (admin only)
- Shows deletion date and who deleted it

**UI Changes:**

1. **Add Archive column to Kanban:**
```typescript
const STAGES = [
  { id: 'REQUESTED', label: 'Requested', ... },
  { id: 'SCHEDULED', label: 'Scheduled', ... },
  { id: 'IN_PROGRESS', label: 'In Progress', ... },
  { id: 'FOR_REVIEW', label: 'For Review', ... },
  { id: 'COMPLETED', label: 'Completed', ... },
  { id: 'ARCHIVED', label: 'Archive', color: 'text-gray-500', bgColor: 'bg-gray-50', icon: Archive },
]
```

2. **Archive column styling:**
- Gray background
- Archive icon
- "Restore" button on each card
- "Permanently Delete" button (admin only)

3. **Work order card in Archive shows:**
- Original stage (where it was before archiving)
- Deleted date
- Deleted by (user name)
- Restore button

**Files to modify:**
- `prisma/schema.prisma` - Add deletedAt, ARCHIVED stage
- `src/components/modules/checklist-kanban.tsx` - Add Archive column
- `src/app/api/branches/[branchId]/checklist-items/route.ts` - Include archived items
- All DELETE endpoints for work orders - Change to soft delete

**Time:** 6-8 hours

---

### **Task 4: Query Optimization** ⚡ (8-10 hours)
**Priority:** High - Reduces database load

**Current Issues:**
- N+1 query problems (fetching related data in loops)
- Fetching unnecessary fields
- Multiple separate queries that could be combined

**Optimization Strategy:**

1. **Use Prisma `include` and `select` properly:**

**Before (N+1 problem):**
```typescript
// Fetches branches
const branches = await prisma.branch.findMany()

// Then fetches work orders for each branch (N queries)
for (const branch of branches) {
  const workOrders = await prisma.checklistItem.findMany({
    where: { checklist: { branch: { id: branch.id } } }
  })
}
```

**After (1 query):**
```typescript
const branches = await prisma.branch.findMany({
  include: {
    checklists: {
      include: {
        items: {
          where: { deletedAt: null }, // Exclude archived
          orderBy: { scheduledDate: 'asc' }
        }
      }
    }
  }
})
```

2. **Only fetch needed fields:**

**Before:**
```typescript
const users = await prisma.user.findMany()
// Returns ALL fields including password hash
```

**After:**
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    // Don't fetch password, createdAt, etc.
  }
})
```

3. **Batch queries where possible:**
```typescript
// Use Promise.all for independent queries
const [branches, projects, requests] = await Promise.all([
  prisma.branch.findMany(...),
  prisma.project.findMany(...),
  prisma.request.findMany(...)
])
```

**Files to audit and optimize:**
- `src/app/api/branches/[branchId]/checklist-items/route.ts`
- `src/app/api/dashboard/action-center/route.ts`
- `src/app/api/branches/[branchId]/projects/route.ts`
- All GET endpoints

**Time:** 8-10 hours

---

### **Task 5: Data Validation** ✅ (6-8 hours)
**Priority:** Medium - Prevents bad data

**Validation Rules:**

1. **Dates:**
   - End date must be after start date
   - Scheduled date cannot be in the past (when creating)
   - Expiry date must be future date

2. **Prices:**
   - Must be positive numbers
   - Max 2 decimal places
   - Cannot be negative

3. **Emails:**
   - Must be valid email format
   - Must be unique

4. **Phone numbers:**
   - Must be valid format
   - Optional: Saudi Arabia format validation

5. **Required fields:**
   - Branch name required
   - Work order description required
   - Equipment number required

**Implementation:**

Create validation utility:
```typescript
// src/lib/validation.ts

export function validateDateRange(start: Date, end: Date) {
  if (end <= start) {
    throw new Error('End date must be after start date')
  }
}

export function validatePrice(price: number) {
  if (price < 0) {
    throw new Error('Price cannot be negative')
  }
  if (!/^\d+(\.\d{1,2})?$/.test(price.toString())) {
    throw new Error('Price must have max 2 decimal places')
  }
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format')
  }
}
```

**Files to modify:**
- Create `src/lib/validation.ts`
- Update all POST/PATCH endpoints to validate input
- Add validation to form submissions

**Time:** 6-8 hours

---

### **Task 6: Pagination** 📄 (4-6 hours)
**Priority:** Medium - Improves load times

**Current Issue:**
- Loading all work orders at once (could be thousands)
- Loading all branches at once
- Loading all requests at once

**Solution:**
- Load 50 items per page
- Add "Next" and "Previous" buttons
- Show total count

**Implementation:**

```typescript
// API endpoint with pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.checklistItem.findMany({
      skip,
      take: limit,
      orderBy: { scheduledDate: 'asc' }
    }),
    prisma.checklistItem.count()
  ])

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  })
}
```

**UI Component:**
```typescript
<div className="flex items-center justify-between">
  <Button 
    disabled={!pagination.hasPrev}
    onClick={() => setPage(page - 1)}
  >
    Previous
  </Button>
  
  <span>Page {pagination.page} of {pagination.totalPages}</span>
  
  <Button 
    disabled={!pagination.hasNext}
    onClick={() => setPage(page + 1)}
  >
    Next
  </Button>
</div>
```

**Where to add pagination:**
- Work orders list (if showing all, not Kanban)
- Branches list (if > 50)
- Requests list
- Equipment list
- Notifications list

**Files to modify:**
- API routes that return lists
- List components

**Time:** 4-6 hours

---

## 📊 PHASE 2 IMPLEMENTATION ORDER

**Week 1 (Days 1-3):**
1. ✅ Task 1: Database Indexes (3-4h)
2. ✅ Task 3: Soft Deletes + Archive Column (6-8h)

**Week 1 (Days 4-5):**
3. ✅ Task 2: Smart Caching (8-10h)

**Week 2 (Days 6-8):**
4. ✅ Task 4: Query Optimization (8-10h)

**Week 2 (Days 9-10):**
5. ✅ Task 5: Data Validation (6-8h)
6. ✅ Task 6: Pagination (4-6h)

**Total Time:** 35-46 hours (fits in 10-14 days)

---

## 🎯 EXPECTED RESULTS

**Performance Improvements:**
- Dashboard load: 3-5s → 0.5s (5-10x faster)
- Kanban board load: 2-3s → 0.5s (4-6x faster)
- List pages: 5-10s → 1s (5-10x faster)
- Database queries per page: 100+ → 10-20 (80-90% reduction)

**User Experience:**
- ✅ Instant cache updates when data changes (your requirement)
- ✅ Archive column for deleted work orders (your requirement)
- ✅ Can restore archived work orders
- ✅ Fast page loads even with thousands of records
- ✅ Clean, validated data
- ✅ No accidental permanent deletes

**Cost Savings:**
- Database load: -60% to -70%
- Estimated savings: $100-160/month
- With caching cost: Net savings $70-130/month

---

## 🚀 READY TO START?

**I recommend starting with:**
1. **Task 3 first** (Soft Deletes + Archive) - Your specific requirement
2. **Task 1 second** (Database Indexes) - Quick win, big impact
3. **Task 2 third** (Smart Caching) - Your other requirement

This way you'll see immediate benefits and your specific features first.

**Should I start implementing Task 3 (Archive column)?**

Or would you like me to start with a different task?
