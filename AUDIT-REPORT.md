# System-Wide Audit Report

**Date:** August 20, 2026  
**Status:** Complete  
**TypeScript:** 0 errors | **ESLint:** 0 errors

---

## 1. i18n / Translation Issues

### 1.1 Partially Translated Components (Bugs)

| File | Line | Issue |
|------|------|-------|
| `equipment-list.tsx` | 412 | `getStatusDisplay` uses `status.replace(/_/g, ' ')` — shows raw English "ACTIVE", "EXPIRING SOON" etc. instead of translated labels |
| `equipment-list.tsx` | 553 | Equipment type badge uses `equipmentType.replace(/_/g, ' ')` — raw English instead of translated type |
| `equipment-list.tsx` | 258 | Certificate title creation uses `equipmentType.replace(/_/g, ' ')` — raw English |
| `requests-list.tsx` | 408, 1708, 2013, 2021 | Hardcoded "SAR" currency string instead of translation key |
| `requests-list.tsx` | 930-932 | `formatWorkOrderType` returns `tr.service` but falls back to raw type string without translation |
| `calendar-view.tsx` | 50-55 | `STAGE_LABELS` hardcoded: "Scheduled", "In Progress", "For Review", "Completed" |
| `calendar-view.tsx` | 330 | `'Ad-hoc'` / `'Scheduled'` hardcoded in badge |
| `certificates-list.tsx` | 360, 636 | `equipmentType.replace(/_/g, ' ')` — raw English |

### 1.2 Completely Untranslated Module Components

| Component | Hardcoded Strings | Priority |
|-----------|------------------|----------|
| `contracts-list.tsx` | 65 | High |
| `checklist-kanban.tsx` | 56 | High |
| `certificates-list.tsx` | 27 | High |
| `invoices-list.tsx` | 25 | High |
| `quotations-list.tsx` | 25 | High |
| `column-detail-modal.tsx` | 24 | Medium |
| `billing-work-orders-display.tsx` | 4 | Medium |
| `calendar-view.tsx` | 9 | Medium |
| `request-comments.tsx` | 6 | Medium |
| `payment-submit-dialog.tsx` | 5 | Medium |
| `contract-attachments-section.tsx` | 3 | Medium |
| `contract-work-orders-display.tsx` | 3 | Medium |
| `payment-verify-dialog.tsx` | 2 | Medium |

### 1.3 Untranslated Print Components

| Component | Hardcoded Strings |
|-----------|------------------|
| `work-order-print.tsx` | 117 |
| `request-quote-print.tsx` | 37 |
| `work-order-print-view.tsx` | 36 |

### 1.4 Untranslated Report Components

| Component | Hardcoded Strings |
|-----------|------------------|
| `installation-report-form.tsx` | 20 |
| `maintenance-report-form.tsx` | 18 |
| `service-report-form.tsx` | 14 |

### 1.5 Untranslated Profile/Form Components

| Component | Hardcoded Strings |
|-----------|------------------|
| `contractor-profile-form.tsx` | 18 |
| `branch-profile-form.tsx` | 16 |
| `client-profile-form.tsx` | 15 |
| `company-profile-form.tsx` | 13 |

### 1.6 Untranslated Page Components

| Page | Hardcoded Strings |
|------|------------------|
| `portal/branches/[branchId]/client-branch-requests.tsx` | 117 |
| `portal/branches/[branchId]/client-branch-contracts.tsx` | 22 |
| `admin/backfill-work-order-numbers/page.tsx` | 17 |
| `portal/branches/[branchId]/client-branch-invoices.tsx` | 14 |
| `portal/branches/[branchId]/client-branch-quotations.tsx` | 12 |
| `(marketing)/contact/page.tsx` | 10 |
| `portal/branches/[branchId]/client-branch-reports.tsx` | 10 |
| `admin/generate-slugs/page.tsx` | 8 |
| `dashboard/team/team-member-dialog.tsx` | 6 |
| `reset-password/page.tsx` | 6 |
| `portal/branch-request-form.tsx` | 5 |
| `verify-email/page.tsx` | 5 |
| `dashboard/clients/[clientSlug]/page.tsx` | 5 |
| `dashboard/clients/[clientSlug]/branches/new/add-branch-form.tsx` | 4 |
| `change-password/page.tsx` | 3 |
| `forgot-password/page.tsx` | 3 |
| `portal/branches/[branchId]/client-branch-appointments.tsx` | 3 |
| `dashboard/pending-branch-requests.tsx` | 2 |
| `(marketing)/install/install-content.tsx` | 2 |
| `admin/contractors/page.tsx` | 1 |
| `not-found.tsx` | 1 |

### 1.7 Untranslated Layout/Other Components

| Component | Hardcoded Strings |
|-----------|------------------|
| `layout/impersonation-banner.tsx` | 1 ("Admin View — Viewing as") |
| `layout/route-error.tsx` | 2 ("This page could not be loaded", "Try again") |
| `dashboard/action-center-table.tsx` | 25 |
| `dashboard/expiring-equipment-widget.tsx` | (uses `_/g` replace) |
| `export/export-dialog.tsx` | 6 |
| `ui/address-picker.tsx` | 6 |
| `ui/technician-details-modal.tsx` | 6 |
| `filters/filter-panel.tsx` | 5 |
| `team-members/company-info-card.tsx` | 9 |
| `notifications/notification-center.tsx` | 3 |
| `notifications/notification-popup.tsx` | 3 |
| `admin/admin-charts.tsx` | 2 |
| `admin/recent-activity.tsx` | 1 |
| `search/global-search.tsx` | 1 |
| `ui/price-dialog.tsx` | 1 (confirm dialog) |

### 1.8 Untranslated `confirm()` Calls

| File | Line | Message |
|------|------|---------|
| `certificates-list.tsx` | 237 | `'Are you sure you want to delete this certificate?'` |
| `contracts-list.tsx` | 830 | `'Are you sure you want to delete this contract?'` |
| `invoices-list.tsx` | 207 | `'Are you sure you want to delete this invoice?'` |
| `quotations-list.tsx` | 199 | `'Are you sure you want to delete this quotation?'` |
| `price-dialog.tsx` | (2 matches) | Confirm dialogs |

---

## 2. Runtime Bugs & Logic Issues

### 2.1 `EQUIPMENT_TYPES` Recreated Every Render
**File:** `equipment-list.tsx:124`  
**Issue:** `const EQUIPMENT_TYPES = EQUIPMENT_TYPE_KEYS.map(...)` runs on every render, creating a new array each time. This causes unnecessary re-renders of components consuming this array (especially `Select` components).  
**Fix:** Wrap in `useMemo` with `[te]` dependency.

### 2.2 No `useMemo`/`useCallback` Anywhere in Module Components
**Files:** All components in `src/components/modules/`  
**Issue:** Only `column-detail-modal.tsx` uses `useMemo`. All other components compute derived data (filtered lists, grouped data, stats) on every render without memoization.  
**Impact:** Performance degradation with large datasets.

### 2.3 `checklist-kanban.tsx` Fetches Session via `/api/auth/session`
**File:** `checklist-kanban.tsx:669`  
**Issue:** Uses `fetch('/api/auth/session')` to get current user name instead of `useSession()` hook. This is an unnecessary network request.  
**Fix:** Use `useSession()` from `next-auth/react`.

### 2.4 `checklist-kanban.tsx` Auto-Refresh Could Cause Data Loss
**File:** `checklist-kanban.tsx:678-683`  
**Issue:** Auto-refreshes every 30 seconds via `setInterval`. If user is in the middle of editing (dialog open, form filled), a refresh could overwrite their unsaved changes.  
**Fix:** Skip auto-refresh when any dialog is open or form is dirty.

### 2.5 `formatWorkOrderType` Doesn't Translate All Types
**File:** `requests-list.tsx:930-932`  
**Issue:** Returns `tr.service` for null type, but for other types just does `type.charAt(0) + type.slice(1).toLowerCase()` — raw English.  
**Fix:** Use a translation map for all work order types.

---

## 3. API Route Issues

### 3.1 `GET /api/equipment/check-expiry` — No Auth
**File:** `api/equipment/check-expiry/route.ts:153`  
**Issue:** The GET endpoint has no authentication check. While it only returns a help message, it's still an exposed endpoint.  
**Risk:** Low (returns static text only).

### 3.2 `POST /api/equipment/check-expiry` — Weak Auth
**File:** `api/equipment/check-expiry/route.ts:13`  
**Issue:** Auth is optional — "If CRON_SECRET is set, verify it". If `CRON_SECRET` env var is not configured, the endpoint is completely open and can trigger bulk notification creation.  
**Fix:** Make CRON_SECRET required, or add session auth as fallback.

### 3.3 No Request Body Validation on Most API Routes
**Files:** Most API routes in `src/app/api/`  
**Issue:** Routes parse JSON body with `await req.json()` but don't validate schema. Invalid data could cause Prisma errors or unexpected behavior.  
**Fix:** Add Zod or manual validation for request bodies.

### 3.4 Excessive `any` Types in API Routes
**Files:** 331 matches across 107 files  
**Issue:** Pervasive use of `any` type, especially in API responses and request body parsing.  
**Impact:** No type safety on API boundaries.

---

## 4. Security Issues

### 4.1 No SQL Injection Risk (Good)
No `prisma.$queryRaw` or `prisma.$executeRaw` usage found. All queries use Prisma's typed query builder.

### 4.2 No `dangerouslySetInnerHTML` XSS Risk (Good)
Only used in SEO schema components (structured data, not user input).

### 4.3 No `eval()` Usage (Good)
No `eval()` found in application code.

### 4.4 `dangerouslySetInnerHTML` in SEO Components
**Files:** `seo/faq-schema.tsx`, `seo/local-business-schema.tsx`, `seo/organization-schema.tsx`, `seo/service-schema.tsx`  
**Note:** These render JSON-LD structured data. Should verify the content is not user-generated.

### 4.5 All API Routes Use `getServerSession` (Good)
All 77 API route files use `getServerSession(authOptions)` for auth checks.

### 4.6 Error Responses May Leak Internal Details
**Files:** Many API routes  
**Issue:** Catch blocks return `error: 'Failed to ...'` but some may include Prisma error details in the response.

---

## 5. Performance Issues

### 5.1 Missing `loading.tsx` Files
**Issue:** Only 2 `loading.tsx` files exist (`dashboard/loading.tsx`, `dashboard/clients/loading.tsx`). All other route segments lack streaming/suspense loading states.  
**Impact:** Users see blank pages while server components load data.

### 5.2 N+1 Query Potential in Dashboard Stats
**File:** `dashboard/page.tsx`  
**Issue:** `getDashboardStats` fetches contractor with nested clients/branches, then runs 8 separate count queries. While parallelized with `Promise.all`, the initial query loads all client/branch data into memory just to extract branch IDs.

### 5.3 `checklist-kanban.tsx` 30-Second Polling
**File:** `checklist-kanban.tsx:679`  
**Issue:** Polls every 30 seconds regardless of page visibility.  
**Fix:** Use `document.visibilityState` to pause polling when tab is inactive, or use WebSocket/SSE.

### 5.4 No Pagination on List Components
**Files:** All module list components (requests, equipment, contracts, invoices, quotations, certificates, documents)  
**Issue:** All items are fetched and rendered at once with no pagination or virtualization.  
**Impact:** Performance degradation with large datasets (100+ items).

### 5.5 Missing Database Indexes (Potential)
**Issue:** Without checking the Prisma schema, queries filtering on `branchId + status` or `branchId + stage` may lack composite indexes.  
**Action:** Review `schema.prisma` for missing indexes on frequently queried fields.

---

## 6. UI/UX Defects

### 6.1 `confirm()` Used Instead of Custom Dialogs
**Files:** 8 component files  
**Issue:** Native `confirm()` dialogs are used for delete confirmations. These are not translatable, not stylable, and look different across browsers.  
**Fix:** Replace with `AlertDialog` component (already available in the codebase).

### 6.2 Missing Error Boundaries in Some Route Segments
**Found:** Error boundaries exist for `admin/`, `dashboard/`, `portal/`, `(marketing)/`, and `global-error.tsx`.  
**Missing:** No error boundary at root `app/` level (only `global-error.tsx` which handles the entire app crash).

### 6.3 No Empty State Illustrations
**Issue:** Empty states use plain text and icons. No illustrations or guided actions.  
**Impact:** Poor user experience for first-time users.

### 6.4 No Responsive Design Testing
**Issue:** Many components use fixed widths (e.g., `w-[180px]`, `w-[200px]` for filter selects) which may cause overflow on mobile.

### 6.5 `LanguageToggle` Doesn't Show Loading State
**File:** `language-toggle.tsx`  
**Issue:** When `router.refresh()` is called after language switch, there's no visual feedback while server components re-render.  
**Fix:** Add a brief loading state or transition.

---

## 7. Code Quality Issues

### 7.1 Excessive `any` Usage
**Count:** 331 matches across 107 files  
**Worst offenders:** `translations.ts` (55, expected for i18n), `api/search/route.ts` (22), `company-profile-form.tsx` (14), `contractor-profile-form.tsx` (11)

### 7.2 No Unit Tests
**Issue:** No test files found in the codebase. No testing framework configured.

### 7.3 Inconsistent Error Handling
**Issue:** Some API routes return `{ error: 'message' }` with `status: 500`, others return `{ error: 'Internal server error' }`. No standardized error response format.

### 7.4 Inconsistent API Client Usage
**Issue:** Some components use `fetch()` directly, others use an `api` client (`@/lib/api-client`). No consistent pattern.

---

## 8. Combined Action Plan

### Phase 1: Fix i18n Bugs in Already-Translated Components (Quick Wins)
1. Fix `equipment-list.tsx` — `getStatusDisplay` to use translated status labels
2. Fix `equipment-list.tsx` — Equipment type badge to use `EQUIPMENT_TYPES` lookup
3. Fix `equipment-list.tsx` — Certificate title to use translated type
4. Fix `requests-list.tsx` — Replace hardcoded "SAR" with translation key
5. Fix `requests-list.tsx` — `formatWorkOrderType` to use translation map
6. Fix `calendar-view.tsx` — Translate `STAGE_LABELS` and type badges
7. Fix `certificates-list.tsx` — Equipment type display to use translated labels
8. Translate `confirm()` calls in certificates, contracts, invoices, quotations

### Phase 2: Translate Remaining Module Components
1. `contracts-list.tsx` (65 strings)
2. `checklist-kanban.tsx` (56 strings)
3. `certificates-list.tsx` (27 strings)
4. `invoices-list.tsx` (25 strings)
5. `quotations-list.tsx` (25 strings)
6. `column-detail-modal.tsx` (24 strings)
7. `calendar-view.tsx` (9 strings)
8. `request-comments.tsx` (6 strings)
9. `payment-submit-dialog.tsx` (5 strings)
10. `billing-work-orders-display.tsx` (4 strings)
11. `contract-attachments-section.tsx` (3 strings)
12. `contract-work-orders-display.tsx` (3 strings)
13. `payment-verify-dialog.tsx` (2 strings)

### Phase 3: Translate Print & Report Components
1. `work-order-print.tsx` (117 strings)
2. `request-quote-print.tsx` (37 strings)
3. `work-order-print-view.tsx` (36 strings)
4. `installation-report-form.tsx` (20 strings)
5. `maintenance-report-form.tsx` (18 strings)
6. `service-report-form.tsx` (14 strings)

### Phase 4: Translate Profile/Form Components
1. `contractor-profile-form.tsx` (18 strings)
2. `branch-profile-form.tsx` (16 strings)
3. `client-profile-form.tsx` (15 strings)
4. `company-profile-form.tsx` (13 strings)

### Phase 5: Translate Page Components
1. `portal/branches/[branchId]/client-branch-requests.tsx` (117 strings)
2. `portal/branches/[branchId]/client-branch-contracts.tsx` (22 strings)
3. `admin/backfill-work-order-numbers/page.tsx` (17 strings)
4. `portal/branches/[branchId]/client-branch-invoices.tsx` (14 strings)
5. `portal/branches/[branchId]/client-branch-quotations.tsx` (12 strings)
6. `(marketing)/contact/page.tsx` (10 strings)
7. `portal/branches/[branchId]/client-branch-reports.tsx` (10 strings)
8. `admin/generate-slugs/page.tsx` (8 strings)
9. `dashboard/team/team-member-dialog.tsx` (6 strings)
10. `reset-password/page.tsx` (6 strings)
11. `portal/branch-request-form.tsx` (5 strings)
12. `verify-email/page.tsx` (5 strings)
13. Remaining pages with 1-4 strings each

### Phase 6: Translate Remaining Layout/Dashboard Components
1. `dashboard/action-center-table.tsx` (25 strings)
2. `export/export-dialog.tsx` (6 strings)
3. `ui/address-picker.tsx` (6 strings)
4. `ui/technician-details-modal.tsx` (6 strings)
5. `filters/filter-panel.tsx` (5 strings)
6. `team-members/company-info-card.tsx` (9 strings)
7. `notifications/notification-center.tsx` (3 strings)
8. `notifications/notification-popup.tsx` (3 strings)
9. `layout/impersonation-banner.tsx` (1 string)
10. `layout/route-error.tsx` (2 strings)
11. `admin/admin-charts.tsx` (2 strings)
12. `admin/recent-activity.tsx` (1 string)
13. `search/global-search.tsx` (1 string)
14. `ui/price-dialog.tsx` (1 string)
15. `dashboard/expiring-equipment-widget.tsx`

### Phase 7: Runtime Bug Fixes
1. Wrap `EQUIPMENT_TYPES` in `useMemo` in `equipment-list.tsx`
2. Replace `fetch('/api/auth/session')` with `useSession()` in `checklist-kanban.tsx`
3. Skip auto-refresh in `checklist-kanban.tsx` when dialogs are open
4. Replace `confirm()` with `AlertDialog` component across all modules

### Phase 8: Performance Improvements
1. Add `loading.tsx` files for all route segments
2. Add pagination to list components (requests, equipment, contracts, etc.)
3. Pause polling when tab is inactive in `checklist-kanban.tsx`
4. Add `useMemo` for derived data in module components
5. Review Prisma schema for missing database indexes

### Phase 9: API Hardening
1. Add request body validation (Zod schemas) to API routes
2. Standardize error response format across all API routes
3. Make `CRON_SECRET` required for `equipment/check-expiry` POST
4. Reduce `any` types in API routes with proper TypeScript types

### Phase 10: Code Quality
1. Add unit tests for critical components
2. Standardize API client usage (use `api-client` everywhere)
3. Add error boundaries at root level
4. Add loading state to `LanguageToggle`

---

## Summary Statistics

| Category | Count |
|----------|-------|
| TypeScript errors | 0 |
| ESLint errors | 0 |
| i18n bugs in translated components | 8 |
| Untranslated module components | 13 |
| Untranslated print/report components | 6 |
| Untranslated profile/form components | 4 |
| Untranslated page components | 21+ |
| Untranslated layout components | 15+ |
| Runtime bugs | 5 |
| API issues | 4 |
| Security issues | 1 (low risk) |
| Performance issues | 5 |
| UI/UX defects | 5 |
| Code quality issues | 4 |
| **Total untranslated strings** | **~600+** |
