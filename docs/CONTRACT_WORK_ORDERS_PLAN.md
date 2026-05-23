# Contract Work Orders Auto-Generation Plan

## Overview

When a contract is created and signed by the client, automatically generate maintenance work orders based on the contract systems and their visit schedules. These work orders will appear on the Kanban board for tracking and completion.

---

## Phase 1: Schema Updates

### Status: ✅ Completed (May 24, 2026)

### Tasks:

- [x] Add `dateMode` field to `ContractSystem` model
  - Values: "MANUAL" or "AUTOMATIC"
  - Default: "MANUAL"

- [x] Add `contractSystemId` field to `ChecklistItem` model
  - Optional foreign key linking work order to contract system
  - Allows tracking which work orders belong to which system

- [x] Run `npx prisma db push`
- [x] Run `npx prisma generate`
- [x] Update TypeScript interfaces
  - Updated `contracts-list.tsx`
  - Updated `client-branch-contracts.tsx`

### Schema Changes:

```prisma
model ContractSystem {
  id          String                   @id @default(cuid())
  contractId  String
  contract    Contract                 @relation(fields: [contractId], references: [id], onDelete: Cascade)
  name        String
  description String?
  frequency   ContractSystemFrequency
  visitDates  String[]
  dateMode    String                   @default("MANUAL")  // NEW
  order       Int                      @default(0)
  createdAt   DateTime                 @default(now())
  updatedAt   DateTime                 @updatedAt
  
  workOrders  ChecklistItem[]          // NEW relation
  
  @@index([contractId])
}

model ChecklistItem {
  // ... existing fields ...
  contractSystemId  String?           // NEW
  contractSystem    ContractSystem?   @relation(fields: [contractSystemId], references: [id])
  
  @@index([contractSystemId])         // NEW
}
```

### Files to Update:
- `prisma/schema.prisma`

---

## Phase 2: Contract Form UI - Date Mode Toggle

### Status: ✅ Completed (May 24, 2026)

### Tasks:

- [x] Add toggle switch for each system: "Manual Dates" vs "Auto-Calculate"
- [x] **Manual mode:** Show all date inputs (current behavior)
- [x] **Automatic mode:** 
  - Show only first date input (others disabled)
  - Auto-calculate and display remaining dates based on frequency
  - Dates are read-only (calculated)
- [x] Update form state to include `dateMode`
- [x] Update create/edit contract API calls to send `dateMode`
- [x] Added `calculateAutoDates()` helper function
- [x] Updated both Create and Edit contract dialogs

### Auto-Calculate Logic:

| Frequency | Visits/Year | Date Increment |
|-----------|-------------|----------------|
| MONTHLY | 12 | +1 month |
| QUARTERLY | 4 | +3 months |
| SEMI_ANNUALLY | 2 | +6 months |
| ANNUALLY | 1 | +12 months |

### Files to Update:
- `src/components/modules/contracts-list.tsx` (Create & Edit dialogs)

---

## Phase 3: Auto-Generate Work Orders on Client Signature

### Status: ✅ Completed (May 24, 2026)

### Tasks:

- [x] Modify client signature endpoint to trigger work order generation
- [x] Create `Checklist` for the contract (if not exists)
- [x] For each `ContractSystem`:
  - For each `visitDate`:
    - Create `ChecklistItem` with:
      - `type` = "SCHEDULED"
      - `workOrderType` = "MAINTENANCE"
      - `description` = "{System Name} - {Frequency} Visit {N}"
      - `scheduledDate` = visitDate
      - `stage` = "SCHEDULED"
      - `contractSystemId` = system ID
      - `workOrderNumber` = auto-incremented
- [x] Handle case where contract already has work orders (skip if checklist exists)
- [x] Used transaction for atomic operation

### Files Updated:
- `src/app/api/branches/[branchId]/contracts/[contractId]/route.ts` (PATCH - start_sign action)

---

## Phase 4: Kanban Board Display Updates

### Status: ✅ Completed (May 24, 2026)

### Tasks:

- [x] Contract maintenance work orders appear in Kanban columns
- [x] Add visual indicator (badge) for contract-linked work orders
  - Purple badge showing contract title
- [x] Added `contractSystemId` and `contractTitle` to ChecklistItem interface
- [x] Updated API to include contractSystem relation
- [x] Clicking card opens maintenance progress report (already works)

### Files Updated:
- `src/components/modules/checklist-kanban.tsx` - Added contract badge to cards
- `src/app/api/branches/[branchId]/checklist-items/route.ts` - Added contractSystem include

---

## Phase 5: Verify Maintenance Progress Report Fields

### Status: ✅ Completed (May 24, 2026)

### Tasks:

- [x] Check existing maintenance work order fields
- [x] Verified these fields are available in `MaintenanceReportData`:
  - `tasksPerformed` - Array of tasks with completion status and notes
  - `equipmentCondition` - good/fair/poor/critical
  - `measurements` - Array with values, units, ranges, status
  - `consumablesUsed` - Array of items and quantities
  - `nextMaintenanceDate` - Next scheduled maintenance
- [x] No additional fields needed - existing structure is comprehensive

### Files Verified:
- `src/types/reports.ts` - MaintenanceReportData interface
- `src/components/reports/maintenance-report-form.tsx` - Form component

---

## Phase 6: Contract Edit Protection

### Status: ✅ Completed (May 24, 2026)

### Tasks:

- [x] On contract edit, check for completed work orders
- [x] **Completed work orders:** Block entire edit with error message
- [x] **Scheduled work orders:** Delete them, allow edit
- [x] **Empty checklist:** Delete to allow regeneration on re-signature
- [x] Return locked systems info in API error response

### Business Rules:

| Work Order Stage | Can Edit System? | Action |
|------------------|------------------|--------|
| SCHEDULED | ✅ Yes | Delete work orders, allow edit |
| IN_PROGRESS | ⚠️ Warning | Allow (will need manual handling) |
| COMPLETED | ❌ No | Block edit with error |

### Files Updated:
- `src/app/api/branches/[branchId]/contracts/[contractId]/route.ts` (PATCH)

---

## Phase 7: Contract Payments in Billing

### Status: ✅ Completed (May 24, 2026)

### Tasks:

- [x] Add contract payments to billing view
- [x] Show payment schedule (1st, 2nd, 3rd, 4th payments)
- [x] Created API for fetching contract payments
- [x] Created API for submitting/verifying payment proof
- [x] Added payment proof fields to ContractPayment model
- [x] Track payment status (PENDING, PENDING_VERIFICATION, PAID)

### Files Created/Updated:
- `src/app/api/branches/[branchId]/contract-payments/route.ts` (new - GET)
- `src/app/api/branches/[branchId]/contract-payments/[paymentId]/route.ts` (new - PATCH)
- `src/components/modules/billing-view.tsx` (updated - added Contract Payments section)
- `prisma/schema.prisma` (updated - added payment proof fields)

---

## Completion Log

| Phase | Status | Completed Date | Notes |
|-------|--------|----------------|-------|
| Phase 1 | ✅ | May 24, 2026 | Schema updates for dateMode and contractSystemId |
| Phase 2 | ✅ | May 24, 2026 | Date mode toggle in contract forms |
| Phase 3 | ✅ | May 24, 2026 | Auto-generate work orders on client signature |
| Phase 4 | ✅ | May 24, 2026 | Kanban board display with contract badges |
| Phase 5 | ✅ | May 24, 2026 | Verified maintenance report fields |
| Phase 6 | ✅ | May 24, 2026 | Contract edit protection for completed work orders |
| Phase 7 | ✅ | May 24, 2026 | Contract payments in billing view |

---

## Notes

- Re-signature requirement on edit is already implemented
- Contract payments are separate from work order payments
- Each contract system can have different frequency and visit dates
