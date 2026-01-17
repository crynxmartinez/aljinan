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

