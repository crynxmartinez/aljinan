# Feature Development Checklist

Use this checklist for every new feature to prevent build errors.

## ✅ Before Committing

### 1. **Database Changes**
- [ ] Updated Prisma schema
- [ ] Ran `npx prisma db push` or migration
- [ ] Ran `npx prisma generate`
- [ ] Verified new fields are in Prisma Client types

### 2. **API Routes (Next.js 16)**
- [ ] Used `Promise<{ param: string }>` for params type
- [ ] Used `await params` before destructuring
- [ ] Tested API endpoint locally
- [ ] Added proper error handling

### 3. **TypeScript Interfaces**
- [ ] Updated all interfaces that use the new fields
- [ ] Checked all components that consume the data
- [ ] Updated data mapping/transformation functions
- [ ] Verified no missing properties in types

### 4. **Type Checking**
- [ ] Ran `npm run type-check` (or `npx tsc --noEmit`)
- [ ] Fixed all TypeScript errors
- [ ] No `@ts-ignore` or `any` types added

### 5. **Linting**
- [ ] Ran `npm run lint`
- [ ] Fixed all linting errors
- [ ] No unused imports or variables

### 6. **Testing**
- [ ] Tested feature locally
- [ ] Tested on different screen sizes (if UI)
- [ ] Tested error states
- [ ] Tested loading states

### 7. **Validation**
- [ ] Ran `npm run validate` (type-check + lint)
- [ ] All checks pass ✅

## ✅ Common Pitfalls to Avoid

### **Pitfall 1: Forgetting to Update Data Mappers**
```typescript
// ❌ BAD: Added field to interface but not to mapper
interface Branch {
  id: string
  name: string
  newField: string  // ← Added here
}

const data = branches.map(b => ({
  id: b.id,
  name: b.name,
  // ❌ Missing newField!
}))

// ✅ GOOD: Update mapper too
const data = branches.map(b => ({
  id: b.id,
  name: b.name,
  newField: b.newField,  // ← Added here too
}))
```

### **Pitfall 2: Using Old Next.js Patterns**
```typescript
// ❌ BAD: Next.js 15 pattern
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
}

// ✅ GOOD: Next.js 16 pattern
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
}
```

### **Pitfall 3: Not Running Type Check Locally**
```bash
# ❌ BAD: Commit without checking
git add .
git commit -m "new feature"
git push

# ✅ GOOD: Validate first
npm run validate
git add .
git commit -m "new feature"
git push
```

## 🚀 Quick Commands

```bash
# Full validation before commit
npm run validate

# Just type checking
npm run type-check

# Just linting
npm run lint

# Prisma workflow
npx prisma db push
npx prisma generate
```

## 📝 Feature-Specific Checklists

### **Adding a New Database Field**
1. [ ] Update `schema.prisma`
2. [ ] Run `npx prisma db push`
3. [ ] Run `npx prisma generate`
4. [ ] Update TypeScript interfaces
5. [ ] Update data mappers/transformers
6. [ ] Update API responses
7. [ ] Update UI components
8. [ ] Run `npm run type-check`

### **Adding a New API Route**
1. [ ] Use Next.js 16 async params pattern
2. [ ] Add authentication check
3. [ ] Add authorization check
4. [ ] Add input validation
5. [ ] Add error handling
6. [ ] Test with Postman/curl
7. [ ] Run `npm run type-check`

### **Adding a New UI Component**
1. [ ] Define prop types
2. [ ] Add loading states
3. [ ] Add error states
4. [ ] Add empty states
5. [ ] Test responsiveness
6. [ ] Run `npm run type-check`

## 🎯 Remember

**"If it doesn't pass `npm run validate`, it doesn't get committed!"**
