# CFOP Platform Overhaul Plan

> **Created:** January 18, 2026  
> **Status:** ✅ IMPLEMENTATION COMPLETE

---

## Overview

Major overhaul of the CFOP (Client Facing Operations Platform) to align with industry standards for field service management. Key changes include:

- Contract-based project structure
- Kanban-style checklist with stages
- Calendar view for scheduling
- Streamlined quotation → contract → invoice flow

---

## Phase 1: Navigation & Structure

- [x] **1.1** Navigation Overhaul: Make Client clickable with its own Client Dashboard
- [x] **1.2** Notifications Page: Add Activity Log as contractor landing page (top of left menu)
- [x] **1.3** Branch Dashboard Redesign: Replace cards with collapsible Projects table
- [x] **1.4** Menu Restructure: `Dashboard | Checklist | Requests | Calendar | Quotations | Invoices | Contracts`

---

## Phase 2: Schema Updates

- [x] **2.1** Checklist: Add `stage` field (requested, scheduled, in_progress, for_review, completed)
- [x] **2.2** Checklist: Add `type` field (scheduled, adhoc)
- [x] **2.3** Project: Update model (start_date, end_date, auto_renew, status: PENDING/ACTIVE/DONE/CLOSED)
- [x] **2.4** Constraint: Only one ACTIVE project per branch
- [x] **2.5** Rename: Payment → Invoice throughout system

---

## Phase 3: UI Components

- [x] **3.1** Checklist Page: Kanban board (stages as columns, color-coded) - only APPROVED work orders
- [x] **3.2** Calendar Page: Calendar view + task list below - only APPROVED work orders

---

## Phase 4: Business Logic / Flows

- [x] **4.1** Project Creation Flow: Creates project + auto-generates Request for client review
- [x] **4.2** Negotiation Flow: Client adds work orders ↔ Contractor adds prices (back and forth)
- [x] **4.3** Quotation Flow: Shows PENDING only; on approval → Contracts + Invoice + Checklist + Calendar
- [x] **4.4** Ad-hoc Flow: Request → Quotation → Approval → Contract + Checklist + Calendar + Invoice
- [x] **4.5** Invoice Logic: Project DONE only after end date + invoice PAID → CLOSED
- [x] **4.6** Template Feature: Use past contract as template for new project

---

## Data Flow Diagrams

### Main Project Flow

```
Contractor creates Project
(name, start/end date, work orders with prices)
        ↓
Auto-creates Request → Client sees in Requests tab
        ↓
Client: "Add Work Order" ←→ Contractor: adds price (negotiation loop)
        ↓
Client: "Proceed to Quotation" → Quotation auto-generated
        ↓
Client: "Accept Contract"
        ↓
┌─────────────────────────────────────────────────────────────┐
│ Project: PENDING → ACTIVE                                   │
│ Quotation → Contracts (SIGNED)                              │
│ Work Orders → Checklist (Kanban) + Calendar                 │
│ Invoice created (PENDING)                                   │
└─────────────────────────────────────────────────────────────┘
```

### Ad-hoc Request Flow

```
Client submits ad-hoc Request (during ACTIVE project)
        ↓
Contractor creates Quotation (with price)
        ↓
Client approves
        ↓
Added to: Contract + Checklist + Calendar + Invoice
```

### Project Completion Flow

```
End date reached → Project: DONE
        ↓
Invoice: PAID
        ↓
Project: CLOSED
        ↓
Contractor can create new Project (use old as template)
```

---

## Project Status Flow

```
PENDING → ACTIVE → DONE → CLOSED
   ↑         ↑        ↑       ↑
   │         │        │       └── Invoice PAID
   │         │        └── End date reached
   │         └── Client accepted quotation
   └── Contractor created project
```

---

## Tab Visibility Rules

| Tab | What Shows |
|-----|------------|
| **Dashboard** | Project overview, collapsible table |
| **Checklist** | Kanban - only APPROVED work orders |
| **Requests** | Pending requests (project proposals + ad-hoc) |
| **Calendar** | Only APPROVED work orders with scheduled dates |
| **Quotations** | PENDING quotations only |
| **Invoices** | All invoices (pending + paid) |
| **Contracts** | SIGNED/AGREED contracts |

---

## Checklist (Kanban) Stages

| Stage | Description | Color |
|-------|-------------|-------|
| **Requested** | Client submitted ad-hoc request | Yellow |
| **Scheduled** | Task confirmed with date | Blue |
| **In Progress** | Technician working on it | Orange |
| **For Review** | Work done, awaiting client confirmation | Purple |
| **Completed** | Task closed | Green |

---

## Key Business Rules

1. **One active project per branch** - Cannot create new project if one is ACTIVE
2. **Project completion requires invoice payment** - DONE → CLOSED only after invoice PAID
3. **Template feature** - Past contracts can be used as templates for new projects
4. **Quotation approval triggers visibility** - Work orders only appear in Checklist/Calendar after approval
5. **Ad-hoc requests follow full flow** - Request → Quotation → Approval → Contract + Checklist + Calendar + Invoice

---

## Notes

- MVP: Email notifications replaced with popup modal showing login credentials
- Contractor is the primary user who creates clients, branches, and projects
- Client can only request (ad-hoc) and approve/reject quotations

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-18 | Initial plan created |
| 2026-01-18 | Phase 1-4 implementation complete |
| 2026-01-20 | Added Phase 5: Inspection Reports & Certificates |
| 2026-01-20 | Phase 6: Client & Facility Management complete |

---

## Phase 5: Inspection Reports & Certificates

> **Status:** 🔲 PLANNING  
> **Priority:** Critical (Civil Defense compliance)

### Overview

Extend work order cards with inspection report fields. Generate PDF reports and certificates for Civil Defense compliance.

---

### What This Feature Does

**Inspection Report** - Documentation of technician's work:
- Date & time of inspection
- Systems checked (what equipment was inspected)
- Findings (what they observed)
- Deficiencies (problems found)
- Recommendations (what should be done)
- Photos (evidence of work)
- Technician signature (digital)
- Supervisor signature (digital approval)

**Certificates** - Official documents proving compliance:
| Type | Description | How Created |
|------|-------------|-------------|
| Preventive Maintenance | Proves regular maintenance done | Auto-generated |
| Completion Certificate | Proves specific job complete | Auto-generated |
| Compliance Certificate | Proves building meets standards | Auto-generated |
| Civil Defense Certificate | Official government certificate | Uploaded (external) |

**Client Access:**
- Download PDF reports
- Download certificates
- Share with Civil Defense inspectors

---

### How It Fits Into Current System

```
Work Order Card (Checklist/Kanban)
├── EXISTING: Description, Notes, Date, Price, Stage
│
└── NEW: Inspection Report Fields
    ├── Systems Checked (multi-select or text)
    ├── Findings (text)
    ├── Deficiencies (text)
    ├── Recommendations (text)
    ├── Photos (upload multiple)
    ├── Technician Signature (signature pad)
    ├── Supervisor Signature (signature pad)
    └── [Generate Report PDF] [Generate Certificate PDF]
```

**Progressive Data Entry by Stage:**
| Stage | What Technician Adds |
|-------|---------------------|
| In Progress | Start adding findings, upload photos |
| For Review | Add deficiencies, recommendations, technician signature |
| Completed | Supervisor signature → generate report/certificate |

---

### Implementation Phases

#### 5.1 Schema Updates
- [ ] Add inspection fields to ChecklistItem model (findings, deficiencies, recommendations)
- [ ] Create InspectionPhoto model (multiple photos per work order)
- [ ] Add signature fields (technicianSignature, supervisorSignature as text/URL)
- [ ] Create Certificate model (type, fileUrl, issueDate, expiryDate, projectId)

#### 5.2 File Storage Setup
- [ ] Configure file storage for photos and signatures
- [ ] Create upload API endpoints

#### 5.3 API Routes
- [ ] PATCH work order with inspection fields
- [ ] POST/DELETE photos for work order
- [ ] POST signature upload
- [ ] GET/POST certificates
- [ ] GET generate PDF report
- [ ] GET generate PDF certificate

#### 5.4 UI - Work Order Dialog
- [ ] Extend work order dialog with inspection fields
- [ ] Add photo upload component (multiple)
- [ ] Add signature pad component
- [ ] Show/hide fields based on stage
- [ ] Add "Generate Report PDF" button
- [ ] Add "Generate Certificate PDF" button

#### 5.5 UI - Certificates Management
- [ ] Add Certificates section in branch workspace
- [ ] List all certificates (auto-generated + uploaded)
- [ ] Upload Civil Defense certificates
- [ ] Download/view certificates

#### 5.6 PDF Generation
- [ ] Create inspection report PDF template
- [ ] Create certificate PDF templates (PM, Completion, Compliance)
- [ ] Include company branding (logo, colors)

#### 5.7 Client Portal
- [ ] Client can view completed work orders with reports
- [ ] Client can download PDF reports
- [ ] Client can view/download certificates
- [ ] Optional: Add "Reports" tab for easy access

---

### Questions to Resolve Before Implementation

1. **File Storage:** Where to store photos/documents?
   - [ ] Supabase Storage
   - [ ] Cloudinary
   - [ ] AWS S3
   - [ ] Other: ___________

2. **Company Branding for PDFs:**
   - [ ] Logo file available? (URL or file)
   - [ ] Brand colors: ___________
   - [ ] Company name for header: ___________

3. **Report Editing:**
   - [ ] Locked after supervisor signs (recommended)
   - [ ] Editable anytime

4. **Systems Checked Field:**
   - [ ] Predefined list (Fire Alarm, Sprinklers, Extinguishers, Smoke Detectors, Exit Signs, etc.)
   - [ ] Free text
   - [ ] Both (predefined + custom)

5. **Certificate Expiry:**
   - [ ] Auto-set expiry (e.g., 1 year from issue)
   - [ ] Manual expiry date
   - [ ] No expiry

---

### Data Flow

```
Technician picks up work order
        ↓
Stage: IN_PROGRESS
- Adds findings as they work
- Uploads photos
        ↓
Stage: FOR_REVIEW
- Adds deficiencies found
- Adds recommendations
- Signs (technician signature)
        ↓
Supervisor reviews
- Approves and signs (supervisor signature)
        ↓
Stage: COMPLETED
- Report PDF can be generated
- Certificate PDF can be generated
        ↓
Client Portal
- Views completed work order
- Downloads report PDF
- Downloads certificate PDF
- Shares with Civil Defense
```

---

### Notes

- Civil Defense certificates are uploaded (external documents), not generated
- Auto-generated certificates use company branding
- Photos should be compressed before upload to save storage
- Signatures stored as base64 or uploaded as images

---

## Phase 6: Client & Facility Management

> **Status:** ✅ COMPLETE  
> **Priority:** High (Foundation for Civil Defense compliance)

### Overview

Extend Client and Branch models with additional profile fields for Civil Defense compliance and better facility management.

---

### Current Structure

```
Contractor (You)
    └── Client (Company - e.g., Saudi Aramco)
            ├── Branch (Facility - e.g., Dhahran HQ)
            ├── Branch (Facility - e.g., Riyadh Office)
            └── Branch (Facility - e.g., Jeddah Warehouse)
```

---

### New Fields to Add

#### Client Profile (Company Level)

| Field | Type | Description |
|-------|------|-------------|
| `crNumber` | String | Commercial Registration number |
| `vatNumber` | String | VAT registration number |
| `billingAddress` | String | Billing/invoice address |
| `contractStartDate` | DateTime | When contract with contractor started |
| `contractExpiryDate` | DateTime | When contract expires |
| `contacts` | JSON | Array of contact persons: [{name, phone, email, whatsapp}] |

#### Branch Profile (Facility Level)

| Field | Type | Description |
|-------|------|-------------|
| `municipality` | String | Municipality / Civil Defense region |
| `buildingType` | Enum | Type of building (see list below) |
| `floorCount` | Int | Number of floors |
| `areaSize` | Float | Area in square meters |
| `cdCertificateNumber` | String | Civil Defense certificate number |
| `cdCertificateExpiry` | DateTime | When CD certificate expires |
| `cdCertificateUrl` | String | Uploaded certificate file URL |

#### Building Types Enum

```
OFFICE, RETAIL, WAREHOUSE, INDUSTRIAL, RESIDENTIAL, HOSPITAL,
EDUCATIONAL, HOTEL, RESTAURANT, MALL, MIXED_USE, PARKING,
MOSQUE, GOVERNMENT, SPORTS, DATA_CENTER, OTHER
```

---

### Who Can Edit

| Role | Client Profile | Branch Profile |
|------|----------------|----------------|
| **Contractor** | ✅ Full edit | ✅ Full edit |
| **Client** | ✅ Edit own profile | ✅ Edit own branches |
| **Supervisor** | ❌ View only | ❌ View only |
| **Technician** | ❌ View only | ❌ View only |

---

### Implementation Phases

#### 6.1 Schema Updates
- [ ] Add new fields to Client model
- [ ] Add new fields to Branch model
- [ ] Create BuildingType enum
- [ ] Run Prisma migration

#### 6.2 API Routes
- [ ] Update Client PATCH endpoint with new fields
- [ ] Update Branch PATCH endpoint with new fields
- [ ] Add role-based edit permissions

#### 6.3 UI - Client Profile Page
- [ ] Create/update client profile form
- [ ] Add contact persons management (add/remove contacts)
- [ ] Show contract dates

#### 6.4 UI - Branch Profile Page
- [ ] Create/update branch profile form
- [ ] Add building type dropdown
- [ ] Add CD certificate fields
- [ ] Show certificate expiry with warning if near expiry

#### 6.5 Client Portal
- [ ] Client can view/edit their company profile
- [ ] Client can view/edit their branch details

#### 6.6 Test & Deploy
- [ ] Run build test
- [ ] Push to GitHub

