# Sticker Inspection Feature - Implementation Plan

## Last Updated
January 22, 2026 - 6:01 PM

## Overview

Add a comprehensive **Sticker Inspection** service for equipment like fire extinguishers, HVAC systems, generators, etc. This includes equipment tracking, expiry notifications, and certificate/sticker management.

---

## Core Concept

- **One work order** = one inspection visit
- **Multiple equipment items** attached to that work order
- Equipment is a **permanent record** (reusable, trackable per branch)
- Both **client and technician** can add equipment
- **Expiry tracking** with dashboard widgets and notifications

---

## Equipment Record Structure

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique ID |
| branchId | String | FK to Branch |
| equipmentType | Enum | Fire Extinguisher, HVAC, Generator, etc. |
| equipmentNumber | String | Client's internal numbering/tag |
| brand | String? | Optional |
| model | String? | Optional |
| serialNumber | String? | Optional |
| location | String | "2nd Floor", "Kitchen", etc. |
| lastInspectionDate | DateTime? | Auto-updated after inspection |
| expiryDate | DateTime? | When next inspection is due |
| status | Enum | ACTIVE, EXPIRED, NEEDS_ATTENTION |
| certificateIssued | Boolean | Checkbox - cert given for this equipment |
| stickerApplied | Boolean | Checkbox - sticker placed on equipment |
| notes | String? | Any notes |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

## Complete Flow

```
1. CLIENT CREATES STICKER INSPECTION REQUEST
   ├── Service Type: Sticker Inspection
   ├── Adds equipment items (can add multiple)
   │   ├── Equipment Type (dropdown)
   │   ├── Equipment Number
   │   ├── Location
   │   └── Current Expiry Date (if known)
   ├── Frequency: Once / Monthly / Quarterly / Semi-Annually / Annually
   └── Preferred Date

2. CONTRACTOR REVIEWS & QUOTES
   └── Sends quote (price for the visit)

3. CLIENT ACCEPTS → WORK ORDER CREATED
   └── Equipment list attached to work order

4. TECHNICIAN PERFORMS INSPECTION
   ├── Views equipment list from request
   ├── Can ADD more equipment found on-site
   ├── Per equipment item:
   │   ├── Inspection result (Pass / Fail / Needs Repair)
   │   ├── New Expiry Date (set by technician)
   │   ├── ☑️ Certificate Issued (checkbox)
   │   ├── ☑️ Sticker Applied (checkbox)
   │   └── Notes/Deficiencies
   └── Signs work order

5. COMPLETION
   ├── Equipment records updated with new expiry dates
   ├── Certificates generated for checked items
   └── Sticker status recorded

6. ONGOING TRACKING
   ├── Dashboard widget: Equipment expiring soon
   ├── Notifications: "5 fire extinguishers expire in 30 days"
   └── Equipment list view (all equipment for branch)
```

---

## UI Sections & Color Theme

- **Color**: Amber/Orange theme for Sticker Inspection sections
- **Separate collapsible sections** in:
  - Contracts tab
  - Billing tab
  - Dashboard (widgets)

---

## Dashboard Additions

### Contractor Dashboard
- Widget: **"Equipment Expiring Soon"** (across all clients)
- Filter by: This week, This month, Next 30/60/90 days
- Click to see details

### Client Dashboard
- Widget: **"Your Equipment Status"**
- Shows: X equipment OK, Y expiring soon, Z expired
- Click to see full equipment list

---

## Implementation Tasks

### Phase A: Review Current State
- [ ] Check current schema (Equipment model, Request model)
- [ ] Check current Sticker Inspection form
- [ ] Check current work order handling for sticker inspections
- [ ] Identify what exists vs what needs to be built

**Status**: PENDING

---

### Phase B: Schema Updates
- [ ] Update Equipment model with new fields:
  - expiryDate
  - status (ACTIVE, EXPIRED, NEEDS_ATTENTION)
  - certificateIssued (Boolean)
  - stickerApplied (Boolean)
  - lastInspectionDate
  - inspectionResult (Pass/Fail/Needs Repair)
- [ ] Add EquipmentInspection junction table (links equipment to work order with inspection details)
- [ ] Run prisma db push

**Status**: PENDING

---

### Phase C: Client Request Form
- [ ] Update Sticker Inspection request form
- [ ] Equipment list UI (add multiple items)
- [ ] Fields: type, number, location, current expiry
- [ ] Allow adding/removing equipment items dynamically

**Status**: PENDING

---

### Phase D: Contractor/Technician Work Order View
- [ ] Display equipment list in work order dialog
- [ ] Allow technician to ADD more equipment
- [ ] Per-equipment inspection form:
  - Result dropdown (Pass/Fail/Needs Repair)
  - New expiry date picker
  - Certificate issued checkbox
  - Sticker applied checkbox
  - Notes field
- [ ] Save inspection results to equipment records

**Status**: PENDING

---

### Phase E: Equipment List Page
- [ ] Create Equipment List component
- [ ] Show all equipment for a branch
- [ ] Columns: Type, Number, Location, Last Inspection, Expiry, Status
- [ ] Status badges: OK (green), Expiring Soon (amber), Expired (red)
- [ ] Add to contractor branch workspace tabs
- [ ] Add to client portal

**Status**: PENDING

---

### Phase F: Dashboard Widgets
- [ ] Contractor: "Equipment Expiring Soon" widget
- [ ] Client: "Your Equipment Status" widget
- [ ] Filter options (timeframe)
- [ ] Click-through to equipment list

**Status**: PENDING

---

### Phase G: Notifications
- [ ] Create notification trigger for expiring equipment
- [ ] Check daily: equipment expiring in 30/14/7 days
- [ ] Send to both contractor and client
- [ ] Notification type: EQUIPMENT_EXPIRING

**Status**: PENDING

---

### Phase H: Testing & Deployment
- [ ] Test full flow: request → quote → work order → inspection → completion
- [ ] Test equipment tracking and expiry
- [ ] Test dashboard widgets
- [ ] Build and push to GitHub

**Status**: PENDING

---

## Files to Modify/Create

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Update Equipment model, add EquipmentInspection |
| `src/app/portal/.../client-branch-requests.tsx` | Update Sticker Inspection form |
| `src/components/modules/checklist-kanban.tsx` | Equipment inspection UI in work order |
| `src/components/modules/equipment-list.tsx` | NEW - Equipment list component |
| `src/app/dashboard/.../branch-workspace.tsx` | Add Equipment tab |
| `src/app/portal/.../page.tsx` | Add Equipment section to client portal |
| `src/components/dashboard/...` | Dashboard widgets |
| `src/app/api/equipment/...` | Equipment CRUD APIs |
| `src/app/api/notifications/...` | Expiry notification logic |

---

## Notes

- Equipment records persist across inspections (permanent per branch)
- Each inspection updates the equipment's expiry date
- Certificates can be generated per equipment or per visit
- Sticker checkbox tracks physical sticker placement
- Amber color theme distinguishes from regular service requests

---

## Current Progress

**Last completed**: Phase A - Review ✅

**Next step**: Phase B - Schema Updates

---

## Phase A Review Findings (January 22, 2026)

### ✅ WHAT ALREADY EXISTS:

#### Schema (prisma/schema.prisma)
- `STICKER_INSPECTION` in WorkOrderType enum ✅
- `EquipmentType` enum with 13 types (Fire Extinguisher, HVAC, etc.) ✅
- `Equipment` model with basic fields ✅
- `RecurringType` has SEMI_ANNUALLY, ANNUALLY ✅
- Equipment linked to Request via `requestId` ✅
- Equipment can link to work order via `workOrderId` ✅

#### Current Equipment Model Fields:
- id, requestId, workOrderId ✅
- equipmentNumber, equipmentType, location ✅
- dateAdded, expectedExpiry, lastInspected ✅
- isInspected (boolean) ✅
- notes ✅

#### Client Request Form (client-branch-requests.tsx)
- Sticker Inspection service type option ✅
- Equipment list UI with add/remove ✅
- Equipment form fields: number, type, location, dateAdded, expectedExpiry, notes ✅
- Amber color theme for sticker inspection section ✅
- Auto-sets recurring to ANNUALLY for sticker inspection ✅
- Auto-checks needsCertificate ✅

#### Separate Collapsible Sections
- Contracts tab: Sticker Inspections section (amber) ✅
- Billing tab: Sticker Inspections section ✅

### ❌ WHAT'S MISSING:

#### Schema Needs:
1. `branchId` on Equipment - for permanent records per branch (currently only linked via request)
2. `status` enum - ACTIVE, EXPIRED, NEEDS_ATTENTION
3. `certificateIssued` boolean - checkbox per equipment
4. `stickerApplied` boolean - checkbox per equipment  
5. `inspectionResult` enum - PASS, FAIL, NEEDS_REPAIR

#### Features Needed:
1. **Technician UI** - view/add/edit equipment in work order dialog
2. **Equipment List page** - permanent records per branch
3. **Dashboard widgets** - expiring equipment
4. **Expiry notifications** - alert when equipment expires soon
5. **Equipment persistence** - equipment should persist after inspection (not just tied to request)
