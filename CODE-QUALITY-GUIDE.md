# Code Quality Guide

## Overview
This guide documents code quality standards, patterns, and best practices for the Aljinan platform.

---

## TypeScript Configuration

### Current Settings
- **Strict Mode:** Enabled ✅
- **Target:** ES2017
- **Module:** ESNext
- **Path Aliases:** `@/*` → `./src/*`

### Type Safety Rules
```typescript
// ✅ Good: Explicit types
function calculateTotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ❌ Bad: Implicit any
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

---

## Code Organization

### Directory Structure
```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── portal/            # Client portal
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── modules/          # Feature-specific components
├── lib/                   # Utilities and helpers
│   ├── auth.ts           # Authentication
│   ├── prisma.ts         # Database client
│   ├── permissions.ts    # Access control
│   ├── validation.ts     # Data validation
│   ├── sanitize.ts       # Input sanitization
│   ├── errors.ts         # Error handling
│   └── cache.ts          # Cache utilities
└── types/                 # TypeScript type definitions
```

---

## Naming Conventions

### Files
- **Components:** PascalCase (`UserProfile.tsx`)
- **Utilities:** camelCase (`formatDate.ts`)
- **API Routes:** kebab-case (`work-orders/route.ts`)
- **Types:** PascalCase (`UserTypes.ts`)

### Variables & Functions
```typescript
// ✅ Good: Descriptive names
const isUserAuthenticated = await checkAuth()
const formattedPrice = formatCurrency(price)
const userPermissions = await getUserPermissions(userId)

// ❌ Bad: Unclear names
const flag = await check()
const val = format(p)
const perms = await get(id)
```

### Constants
```typescript
// ✅ Good: UPPER_SNAKE_CASE for constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png']
const DEFAULT_PAGE_SIZE = 20

// ❌ Bad: camelCase for constants
const maxFileSize = 5242880
const allowedTypes = ['image/jpeg', 'image/png']
```

---

## API Route Patterns

### Standard Structure
```typescript
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canEditResource } from '@/lib/permissions'
import { validateRequired } from '@/lib/validation'
import { sanitizePlainText } from '@/lib/sanitize'
import { logResourceUpdated } from '@/lib/audit-log'
import { authErrors, validationErrors, safeError } from '@/lib/errors'

export async function POST(request: Request) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(authErrors.unauthorized(), { status: 401 })
    }

    // 2. Parse & Validate Input
    const body = await request.json()
    const { title, description } = body
    
    const titleValidation = validateRequired(title, 'Title')
    if (!titleValidation.valid) {
      return NextResponse.json(
        validationErrors.required('Title'),
        { status: 400 }
      )
    }

    // 3. Sanitize Input
    const sanitizedTitle = sanitizePlainText(title)
    const sanitizedDescription = description ? sanitizePlainText(description) : null

    // 4. Check Permissions
    const hasPermission = await canEditResource(session.user.id, session.user.role, resourceId)
    if (!hasPermission) {
      return NextResponse.json(
        permissionErrors.denied('edit this resource'),
        { status: 403 }
      )
    }

    // 5. Database Operation
    const resource = await prisma.resource.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        createdById: session.user.id,
      }
    })

    // 6. Audit Log
    await logResourceUpdated(
      session.user.id,
      session.user.role,
      'resource',
      resource.id,
      { title: sanitizedTitle }
    )

    // 7. Return Response
    return NextResponse.json(resource, { status: 201 })
    
  } catch (error) {
    console.error('Error creating resource:', error)
    const appError = safeError(error)
    return NextResponse.json(appError, { status: 500 })
  }
}
```

---

## Component Patterns

### Server Components (Default)
```typescript
// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getServerSession()
  const data = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  return <div>{data.name}</div>
}
```

### Client Components
```typescript
'use client'

import { useState } from 'react'
import { LoadingButton } from '@/components/ui/loading-button'

export function CreateForm() {
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await fetch('/api/resource', { method: 'POST' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <LoadingButton loading={loading} type="submit">
        Create
      </LoadingButton>
    </form>
  )
}
```

---

## Error Handling

### Use Centralized Errors
```typescript
// ✅ Good: Use error library
import { validationErrors, businessErrors } from '@/lib/errors'

if (!email) {
  return NextResponse.json(
    validationErrors.required('Email'),
    { status: 400 }
  )
}

if (project.status !== 'ACTIVE') {
  return NextResponse.json(
    businessErrors.projectNotActive(),
    { status: 400 }
  )
}

// ❌ Bad: Generic errors
if (!email) {
  return NextResponse.json({ error: 'Missing field' }, { status: 400 })
}

if (project.status !== 'ACTIVE') {
  return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
}
```

---

## Security Best Practices

### Always Sanitize Input
```typescript
import { sanitizePlainText, sanitizeEmail } from '@/lib/sanitize'

// ✅ Good: Sanitize all user input
const name = sanitizePlainText(body.name)
const email = sanitizeEmail(body.email)

// ❌ Bad: Direct database insertion
await prisma.user.create({
  data: { name: body.name, email: body.email }
})
```

### Always Check Permissions
```typescript
import { canEditWorkOrder } from '@/lib/permissions'

// ✅ Good: Check permissions
const hasPermission = await canEditWorkOrder(userId, userRole, workOrderId)
if (!hasPermission) {
  return NextResponse.json(permissionErrors.denied('edit work order'), { status: 403 })
}

// ❌ Bad: No permission check
await prisma.workOrder.update({ where: { id }, data })
```

### Always Validate Input
```typescript
import { validateEmail, validatePrice } from '@/lib/validation'

// ✅ Good: Validate before processing
const emailValidation = validateEmail(email)
if (!emailValidation.valid) {
  return NextResponse.json(validationErrors.invalidEmail(email), { status: 400 })
}

// ❌ Bad: No validation
await sendEmail(email)
```

---

## Performance Best Practices

### Database Queries
```typescript
// ✅ Good: Select only needed fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
  }
})

// ❌ Bad: Select all fields
const user = await prisma.user.findUnique({
  where: { id }
})
```

### Batch Operations
```typescript
// ✅ Good: Batch create
await prisma.workOrder.createMany({
  data: workOrders
})

// ❌ Bad: Loop with individual creates
for (const order of workOrders) {
  await prisma.workOrder.create({ data: order })
}
```

---

## Testing Guidelines

### API Route Testing
```typescript
// Test authentication
// Test validation
// Test permissions
// Test business logic
// Test error handling
```

### Component Testing
```typescript
// Test rendering
// Test user interactions
// Test loading states
// Test error states
```

---

## Documentation Standards

### Function Documentation
```typescript
/**
 * Calculate the total value of invoice items
 * 
 * @param items - Array of invoice items
 * @returns Total value in SAR
 * 
 * @example
 * const total = calculateInvoiceTotal([
 *   { price: 100, quantity: 2 },
 *   { price: 50, quantity: 1 }
 * ])
 * // Returns: 250
 */
function calculateInvoiceTotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}
```

---

## Git Commit Messages

### Format
```
Type: Brief description

✅ What was added/changed
✅ Why it was needed
✅ Impact/benefits

Details:
- Specific change 1
- Specific change 2

✅ Build: Status
✅ Ready for: Deployment
```

### Types
- **Feature:** New feature
- **Fix:** Bug fix
- **Refactor:** Code refactoring
- **Perf:** Performance improvement
- **Security:** Security improvement
- **Docs:** Documentation
- **Style:** Code style/formatting
- **Test:** Tests

---

## Code Review Checklist

- [ ] TypeScript types are explicit
- [ ] Input is sanitized
- [ ] Input is validated
- [ ] Permissions are checked
- [ ] Errors use error library
- [ ] Audit logs are added
- [ ] No sensitive data in logs
- [ ] Database queries are optimized
- [ ] Loading states are shown
- [ ] Error states are handled
- [ ] Code is documented
- [ ] Tests are added
- [ ] Build passes
- [ ] No console.logs in production

---

## Maintenance

### Regular Tasks
- Review and update dependencies monthly
- Check for security vulnerabilities weekly
- Monitor performance metrics daily
- Review error logs daily
- Update documentation as needed

### Performance Monitoring
- Check Vercel Analytics weekly
- Review slow API endpoints
- Optimize database queries
- Monitor bundle size

---

**Last Updated:** March 5, 2026  
**Version:** 1.0
