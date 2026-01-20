# Phase 5 Remaining Tasks: Simplified Requests, Recurring & Auto-Certificates

## Overview

This document outlines the remaining tasks to complete Phase 5 of the CFOP overhaul:
1. **Simplify request form** - Remove Issue Type, keep Service Type at top
2. **Add recurring frequency** to all service requests
3. **Add "Certificate Required" checkbox** with smart defaults
4. **Auto-generate certificates** when work orders are completed

---

## Form Simplification

### Before (Complex)
- Issue Type dropdown (30+ options) - REMOVED
- Service Type dropdown (4 options)
- Many fields

### After (Simplified)
```
Submit Service Request
├── Service Type *        [Dropdown: Service, Inspection, Maintenance, Installation]
├── Brief Description *   [Text input]
├── Additional Details    [Textarea]
├── Priority              [Dropdown: Low, Medium, High, Urgent]
├── Frequency             [Dropdown: Once, Monthly, Quarterly]
├── ☑️ Certificate Required  [Checkbox - auto-checked based on service type]
├── Preferred Date        [Date picker]
├── Preferred Time        [Dropdown: Morning, Afternoon, Evening, Anytime]
└── Photos                [Upload]
```

### Certificate Checkbox Logic
| Service Type | Default State | Reason |
|--------------|---------------|--------|
| INSPECTION | ✅ Checked | Compliance proof required |
| MAINTENANCE | ✅ Checked | Proof of preventive work |
| INSTALLATION | ✅ Checked | Proof of proper installation |
| SERVICE | ☐ Unchecked | Repairs usually don't need cert |

Client can toggle as needed.

---

## Current State

### What Already Exists:

#### Service Requests (Request Model)
- Client can submit service requests
- Has `issueType` field - **TO BE REMOVED**
- Has `workOrderType` field (Service Type)
- Contractor can view requests and send quotes
- Client can accept/reject quotes
- **Missing**: `recurringType`, `needsCertificate` fields

#### Work Orders (ChecklistItem Model)
- Has `recurringType` field: ONCE, MONTHLY, QUARTERLY
- Has inspection fields: `inspectionDate`, `systemsChecked`, `findings`, `deficiencies`, `recommendations`
- Has signature fields: `technicianSignature`, `supervisorSignature`
- Has photo uploads (InspectionPhoto relation)
- Technician fills inspection data in Kanban view

#### Certificates (Certificate Model)
- Manual creation by contractor
- Fields: type, title, description, fileUrl, issueDate, expiryDate, workOrderId
- **Only visible in client portal** - missing from contractor dashboard
- **No automatic generation** when work order is completed

---

## Task List

### Task 1: Schema Update
**File**: `prisma/schema.prisma`

Changes to Request model:
1. **Remove**: `issueType` field (no longer needed)
2. **Add**: `recurringType RecurringType @default(ONCE)`
3. **Add**: `needsCertificate Boolean @default(false)`

```prisma
model Request {
  // ... existing fields ...
  
  // REMOVE this line:
  // issueType           IssueType?
  
  // ADD these lines:
  recurringType       RecurringType   @default(ONCE)
  needsCertificate    Boolean         @default(false)
}
```

**Status**: Pending

---

### Task 2: Push Schema to Database
**Commands**:
```bash
npx prisma db push
npx prisma generate
```

**Status**: Pending

---

### Task 3: Update Client Submit Request Form
**File**: `src/app/portal/branches/[branchId]/client-branch-requests.tsx`

Changes:
1. **Remove** Issue Type dropdown completely
2. **Move** Service Type to top of form
3. **Add** Frequency dropdown (Once, Monthly, Quarterly)
4. **Add** "Certificate Required" checkbox
5. **Auto-check** certificate based on service type:
   - INSPECTION, MAINTENANCE, INSTALLATION → checked
   - SERVICE → unchecked
6. Update `newRequest` state to include new fields
7. Update API payload

**Status**: Pending

---

### Task 4: Update Request Detail Dialogs
**Files**: 
- `src/app/portal/branches/[branchId]/client-branch-requests.tsx` (client dialog)
- `src/components/modules/requests-list.tsx` (contractor dialog)

Changes:
1. **Remove** Issue Type badge display
2. **Add** Recurring badge (Monthly/Quarterly) if not ONCE
3. **Add** Certificate Required indicator
4. Update Request interface to match new schema

**Status**: Pending

---

### Task 5: Add Certificates Tab to Contractor Dashboard
**File**: `src/app/dashboard/clients/[clientId]/branches/[branchId]/branch-workspace.tsx`

Changes:
1. Import `CertificatesList` component
2. Import `Award` icon from lucide-react
3. Add to modules array: `{ id: 'certificates', label: 'Certificates', icon: Award }`
4. Add `TabsContent` for certificates:
```tsx
<TabsContent value="certificates" className="mt-0">
  <CertificatesList branchId={branchId} userRole="CONTRACTOR" />
</TabsContent>
```

**Status**: Pending

---

### Task 6: Implement Auto-Certificate Generation
**File**: API endpoint that handles work order stage changes

Trigger: When work order stage changes to **COMPLETED** AND `needsCertificate` is true

Logic:
1. Check if `needsCertificate` flag is true on the linked request
2. If true, create Certificate record:

```typescript
const certificate = await prisma.certificate.create({
  data: {
    branchId: workOrder.checklist.branchId,
    projectId: workOrder.checklist.projectId,
    workOrderId: workOrder.id,
    type: mapWorkOrderTypeToCertificateType(workOrder.workOrderType),
    title: `${workOrder.workOrderType} Certificate - ${workOrder.description}`,
    description: `Findings: ${workOrder.findings}\n\nRecommendations: ${workOrder.recommendations}`,
    fileUrl: '', // PDF generated later or uploaded
    issueDate: new Date(),
    expiryDate: calculateExpiryDate(workOrder.recurringType),
    issuedById: session.user.id,
  }
})
```

**Type Mapping**:
| Work Order Type | Certificate Type |
|-----------------|------------------|
| INSPECTION | INSPECTION |
| MAINTENANCE | PREVENTIVE_MAINTENANCE |
| SERVICE | COMPLETION |
| INSTALLATION | COMPLETION |

**Expiry Calculation**:
| Recurring Type | Expiry Date |
|----------------|-------------|
| ONCE | null (no expiry) |
| MONTHLY | issueDate + 1 month |
| QUARTERLY | issueDate + 3 months |

**Status**: Pending

---

### Task 7: Add "View Certificate" Button to Completed Work Orders
**File**: `src/components/modules/checklist-kanban.tsx`

Changes:
1. For COMPLETED work orders with `needsCertificate = true`
2. Fetch linked certificate (by workOrderId)
3. Show "View Certificate" button in work order dialog
4. Button opens certificate detail or downloads PDF

**Status**: Pending

---

### Task 8: Build, Test, and Push to GitHub
**Commands**:
```bash
npx next build
git add -A
git commit -m "Phase 5: Simplify request form, add recurring & auto-certificates"
git push
```

**Status**: Pending

---

## Flow Diagrams

### Service Request Flow (Simplified)
```
Client submits request
    ↓
[Service Type, Description, Priority, Frequency, Certificate Required, Date, Photos]
    ↓
Contractor reviews request
    ↓
Contractor sends quote (price + date)
    ↓
Client accepts/rejects
    ↓
If accepted → Work order created
    - Inherits: recurringType, needsCertificate
    ↓
Technician completes work
    - Fills: findings, deficiencies, recommendations
    - Uploads photos
    - Signs
    ↓
Work order marked COMPLETED
    ↓
If needsCertificate = true:
    → Certificate AUTO-GENERATED
    ↓
Certificate visible in:
  - Work order card (View Certificate button)
  - Certificates tab (list view)
  - Client portal
```

### Certificate Auto-Generation Logic
```
On work order COMPLETED:
    ↓
Check needsCertificate flag
    ↓
If true:
    ↓
    Get work order details
    (type, findings, recommendations, recurringType)
    ↓
    Map workOrderType → certificateType
    ↓
    Calculate expiryDate from recurringType
    ↓
    Create Certificate record
    ↓
    Link via workOrderId
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Remove issueType, add recurringType & needsCertificate |
| `client-branch-requests.tsx` | Simplify form, add new fields |
| `requests-list.tsx` | Update contractor dialog, remove issueType |
| `branch-workspace.tsx` | Add Certificates tab |
| `checklist-kanban.tsx` | Add View Certificate button |
| API routes | Handle auto-certificate generation |

---

## Notes

- IssueType enum can remain in schema for now (not breaking)
- Certificates can still be manually created/edited
- PDF generation is separate (on-demand)
- Client sees certificates in their portal
- Contractor manages certificates in dashboard

---

---

## Flow Analysis: Current State vs Required

### ✅ WHAT EXISTS (Working):

| Step | Feature | Status |
|------|---------|--------|
| 1 | Client creates request | ✅ Works |
| 2 | Contractor sees request | ✅ Works |
| 3 | Contractor sends quote (price + date) | ✅ Works (single date only) |
| 4 | Client sees quote | ✅ Works |
| 5 | Client accepts/rejects quote | ✅ Works |
| 6 | Work order created on accept | ✅ Works |
| 7 | Kanban for work orders | ✅ Works |
| 8 | Technician fills inspection data | ✅ Works (findings, deficiencies, recommendations) |
| 9 | Technician signature | ✅ Works |
| 10 | Billing view | ✅ Works |
| 11 | Payment submission (client) | ✅ Works |
| 12 | Payment verification (contractor) | ✅ Works |
| 13 | Contracts list | ✅ Works |
| 14 | Project approval | ✅ Works |

### ❌ WHAT'S MISSING:

| # | Feature | Description |
|---|---------|-------------|
| A | **Recurring quote flow** | When monthly/quarterly selected, contractor sets first date → system auto-generates dates for all occurrences. Price × occurrences = total |
| B | **Work orders tree in quote** | Client sees L-shaped tree showing all work order dates when viewing quote |
| C | **Client signature on quote acceptance** | Client signs when accepting quote (digital signature) |
| D | **Client signature on work completion** | Client reviews and signs in FOR_REVIEW stage to approve work |
| E | **Supervisor signature in Kanban** | Supervisor can sign work orders (field exists, no UI) |
| F | **Auto-certificate generation** | When both signatures done + needsCertificate=true → create certificate |
| G | **View Certificate button** | On completed work order card in Kanban |
| H | **Certificates tab (contractor)** | Add to contractor dashboard |
| I | **Contract shows work orders** | Contract view shows all work orders from project |
| J | **Contract auto-complete** | When all work orders paid → contract can be signed/completed |

---

## Complete Flow (Target State)

```
1. CLIENT CREATES REQUEST
   ├── Service Type: [Service, Inspection, Maintenance, Installation]
   ├── Description
   ├── Priority
   ├── Frequency: [Once, Monthly, Quarterly]
   ├── ☑️ Certificate Required (auto-checked for Inspection/Maintenance/Installation)
   ├── Preferred Date
   └── Photos

2. CONTRACTOR REVIEWS REQUEST
   └── Clicks "Send Quote"

3. CONTRACTOR CREATES QUOTATION
   ├── If ONCE:
   │   └── Set price + date
   ├── If MONTHLY/QUARTERLY:
   │   ├── Set first date
   │   ├── Set price per occurrence
   │   └── System auto-generates:
   │       ├── Work Order 1 - Jan 15, 2026 - $500
   │       ├── Work Order 2 - Feb 15, 2026 - $500
   │       ├── Work Order 3 - Mar 15, 2026 - $500
   │       └── Total: $1,500
   └── Send to client

4. CLIENT REVIEWS QUOTE
   ├── Sees price breakdown
   ├── Sees work order tree (L-shaped for recurring):
   │   └── Monthly Inspection
   │       ├── Jan 15, 2026 - $500
   │       ├── Feb 15, 2026 - $500
   │       └── Mar 15, 2026 - $500
   ├── Accept → Signs digitally
   └── Reject → Provide reason

5. ON ACCEPT
   ├── Request removed from Requests tab
   ├── Work orders created in Checklist (SCHEDULED stage)
   ├── Contract created (linked to project)
   └── Notifications sent

6. WORK EXECUTION (Per Work Order)
   ├── Contractor/Technician moves to IN_PROGRESS
   ├── Technician fills:
   │   ├── Inspection date
   │   ├── Systems checked
   │   ├── Findings
   │   ├── Deficiencies
   │   └── Recommendations
   ├── Technician uploads photos
   └── Technician signs

7. REVIEW STAGE
   ├── Moves to FOR_REVIEW
   ├── Supervisor reviews and signs
   ├── Client reviews and signs (accepting the work)
   └── When both signed → moves to COMPLETED

8. COMPLETION
   ├── If needsCertificate = true:
   │   └── Certificate AUTO-GENERATED
   │       ├── Linked to work order
   │       ├── Contains findings/recommendations
   │       └── Expiry based on recurring type
   └── Certificate accessible from:
       ├── Work order card (View Certificate button)
       └── Certificates tab

9. BILLING
   ├── Work orders appear in Billing tab
   ├── Client submits payment (upload proof)
   ├── Contractor verifies payment
   └── Status: UNPAID → PENDING_VERIFICATION → PAID

10. CONTRACT COMPLETION
    ├── Contract shows all work orders
    ├── When all work orders PAID:
    │   └── Contract can be signed/completed
    └── Client can download certificates from contract
```

---

## Revised Task List

### Phase 5A: Form Simplification & Schema
1. Schema: Remove issueType, add recurringType, needsCertificate to Request
2. Update Submit Request form (remove issue type, add recurring, certificate checkbox)
3. Update request detail dialogs

### Phase 5B: Recurring Quote Flow
4. Update contractor quote dialog to handle recurring (auto-generate dates)
5. Update client quote view to show work order tree

### Phase 5C: Signatures
6. Add client signature on quote acceptance
7. Add supervisor signature UI in Kanban
8. Add client signature in FOR_REVIEW stage

### Phase 5D: Certificates
9. Add Certificates tab to contractor dashboard
10. Implement auto-certificate generation on completion
11. Add View Certificate button to completed work orders

### Phase 5E: Contract Integration
12. Show work orders in contract view
13. Auto-complete contract when all paid

---

## Last Updated
January 20, 2026 - 6:05 PM
