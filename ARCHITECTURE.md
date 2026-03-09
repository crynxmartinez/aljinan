# Tasheel - System Architecture

This document provides a comprehensive overview of Tasheel's system architecture, database schema, and technical design decisions.

---

## 📐 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Web Browser (Desktop/Mobile)                                │
│  - Marketing Website (Public)                                │
│  - Contractor Dashboard (Authenticated)                      │
│  - Client Portal (Authenticated)                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Next.js 16 App Router                                       │
│  - Server Components (RSC)                                   │
│  - Client Components (Interactive UI)                        │
│  - Layouts & Templates                                       │
│  - Metadata & SEO                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  API Routes (Next.js)                                        │
│  - Authentication (NextAuth.js)                              │
│  - Business Logic                                            │
│  - Data Validation                                           │
│  - Rate Limiting                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM                                                  │
│  - Type-safe queries                                         │
│  - Migrations                                                │
│  - Relations                                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  - PostgreSQL (Vercel Postgres)                              │
│  - Vercel Blob Storage (Files)                               │
│  - Upstash Redis (Rate Limiting)                             │
│  - Sentry (Error Tracking)                                   │
│  - Vercel Analytics                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Entity Relationship Overview

```
User (Authentication)
  ├── Contractor (1:1)
  │   ├── Clients (1:N)
  │   └── TeamMembers (1:N)
  ├── Client (1:1)
  │   ├── Branches (1:N)
  │   └── BranchRequests (1:N)
  └── TeamMember (1:1)
      └── BranchAccess (N:N via TeamMemberBranch)

Branch (Client Location)
  ├── Projects (1:N)
  ├── Requests (1:N)
  ├── Equipment (1:N)
  ├── Quotations (1:N)
  ├── Appointments (1:N)
  ├── Invoices (1:N)
  ├── Contracts (1:N)
  ├── Checklists (1:N)
  └── Certificates (1:N)

Project (Contract)
  ├── Requests (1:N)
  ├── Quotations (1:N)
  ├── Appointments (1:N)
  ├── Invoices (1:N)
  ├── Contracts (1:N)
  ├── Checklists (1:N)
  ├── Certificates (1:N)
  └── Activities (1:N)

Checklist (Inspection Template)
  └── ChecklistItems (1:N) [Work Orders]
      └── InspectionPhotos (1:N)

Request (Service Request)
  ├── RequestPhotos (1:N)
  ├── RequestComments (1:N)
  └── Equipment (1:N)
```

---

## 📊 Core Database Models

### 1. User & Authentication

**User Model**
```prisma
model User {
  id             String     @id @default(cuid())
  email          String     @unique
  password       String     // bcrypt hashed
  name           String?
  role           UserRole   // CONTRACTOR | CLIENT | TEAM_MEMBER
  status         UserStatus // PENDING | ACTIVE | ARCHIVED
  emailVerified  DateTime?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}
```

**Roles:**
- `CONTRACTOR` - Safety contractor (business owner)
- `CLIENT` - Client company user
- `TEAM_MEMBER` - Contractor's staff (supervisor/technician)

---

### 2. Contractor Profile

**Contractor Model**
```prisma
model Contractor {
  id                String        @id
  userId            String        @unique
  companyName       String?
  companyPhone      String?
  companyEmail      String?
  companyAddress    String?
  logoUrl           String?
  website           String?
  businessType      BusinessType? // LLC, CORPORATION, etc.
  yearEstablished   Int?
  
  // KSA Registration
  crNumber          String?       // Commercial Registration
  vatNumber         String?       // VAT Number
  licenseNumber     String?       // Civil Defense License
  licenseExpiry     DateTime?
  insuranceCertUrl  String?
  insuranceExpiry   DateTime?
  serviceAreas      Json?         // Array of cities
}
```

---

### 3. Client & Branch Management

**Client Model**
```prisma
model Client {
  id              String   @id
  userId          String   @unique
  contractorId    String
  companyName     String
  companyPhone    String?
  companyEmail    String?
  crNumber        String?
  vatNumber       String?
  billingAddress  String?
  contacts        Json?    // [{name, phone, email, whatsapp}]
}
```

**Branch Model** (Client Locations)
```prisma
model Branch {
  id                    String        @id
  clientId              String
  name                  String
  address               String
  city                  String?
  latitude              Float?
  longitude             Float?
  
  // Facility Profile
  municipality          String?
  buildingType          BuildingType? // OFFICE, RETAIL, HOSPITAL, etc.
  floorCount            Int?
  areaSize              Float?
  cdCertificateNumber   String?       // Civil Defense cert
  cdCertificateExpiry   DateTime?
  cdCertificateUrl      String?
}
```

**Building Types:**
- OFFICE, RETAIL, WAREHOUSE, INDUSTRIAL, RESIDENTIAL
- HOSPITAL, EDUCATIONAL, HOTEL, RESTAURANT, MALL
- MIXED_USE, PARKING, MOSQUE, GOVERNMENT, SPORTS, DATA_CENTER

---

### 4. Project & Contract Management

**Project Model** (Represents a contract)
```prisma
model Project {
  id            String        @id
  branchId      String
  title         String
  description   String?
  status        ProjectStatus // PENDING, ACTIVE, DONE, CLOSED, CANCELLED
  priority      RequestPriority
  startDate     DateTime?
  endDate       DateTime?
  autoRenew     Boolean       @default(false)
  totalValue    Float
  createdById   String
  createdByRole UserRole
  completedAt   DateTime?
}
```

**Project Lifecycle:**
1. `PENDING` - Created, awaiting client approval
2. `ACTIVE` - Client accepted, work in progress
3. `DONE` - End date reached, awaiting invoice payment
4. `CLOSED` - Invoice paid, project complete
5. `CANCELLED` - Cancelled by either party

---

### 5. Service Request System

**Request Model**
```prisma
model Request {
  id                  String          @id
  branchId            String
  projectId           String?
  title               String
  description         String?
  priority            RequestPriority // LOW, MEDIUM, HIGH, URGENT
  status              RequestStatus
  workOrderType       WorkOrderType?  // SERVICE, INSPECTION, MAINTENANCE
  
  // Client submission
  preferredDate       DateTime?
  preferredTimeSlot   String?         // "Morning", "Afternoon", "Evening"
  recurringType       RecurringType   // ONCE, MONTHLY, QUARTERLY
  needsCertificate    Boolean
  
  // Contractor quote
  quotedPrice         Float?
  quotedDate          DateTime?
  quotedById          String?
  quotedAt            DateTime?
  
  // Client response
  acceptedAt          DateTime?
  acceptedById        String?
  rejectedAt          DateTime?
  rejectionNote       String?
  
  // Link to work order
  workOrderId         String?         // ChecklistItem ID
}
```

**Request Flow:**
1. `REQUESTED` - Client submitted, waiting for contractor
2. `QUOTED` - Contractor set date & price, waiting for client
3. `SCHEDULED` - Client accepted, work order created
4. `IN_PROGRESS` - Technician working
5. `FOR_REVIEW` - Work done, pending supervisor review
6. `PENDING_APPROVAL` - Waiting final client approval
7. `COMPLETED` - Done
8. `CLOSED` - Archived

---

### 6. Work Order System (Kanban Board)

**ChecklistItem Model** (Work Orders)
```prisma
model ChecklistItem {
  id                    String             @id
  checklistId           String
  description           String
  notes                 String?
  stage                 ChecklistItemStage // SCHEDULED, IN_PROGRESS, FOR_REVIEW, COMPLETED
  type                  ChecklistItemType  // SCHEDULED, ADHOC
  workOrderType         WorkOrderType?
  recurringType         RecurringType
  parentItemId          String?            // For recurring tasks
  occurrenceIndex       Int?
  scheduledDate         DateTime?
  price                 Float?
  
  // Inspection Report
  inspectionDate        DateTime?
  systemsChecked        Json?              // ["Fire Alarm", "Sprinklers"]
  findings              String?
  deficiencies          String?
  recommendations       String?
  
  // Signatures
  technicianSignature   String?
  technicianSignedAt    DateTime?
  supervisorSignature   String?
  supervisorSignedAt    DateTime?
  clientSignature       String?
  clientSignedAt        DateTime?
  
  // Report
  reportGeneratedAt     DateTime?
  reportUrl             String?
  
  // Payment
  paymentStatus         PaymentStatus      // UNPAID, PENDING_VERIFICATION, PAID
  paymentProofUrl       String?
  paymentProofType      String?            // 'file' or 'link'
  paymentSubmittedAt    DateTime?
  paymentVerifiedAt     DateTime?
  
  // Archive (Soft Delete)
  deletedAt             DateTime?
  deletedBy             String?
  deletedReason         String?
}
```

**Kanban Stages:**
- `SCHEDULED` - Task confirmed with date
- `IN_PROGRESS` - Technician working on it
- `FOR_REVIEW` - Work done, awaiting client confirmation
- `COMPLETED` - Task closed
- `ARCHIVED` - Soft deleted (moved to archive)

---

### 7. Equipment Tracking (Sticker Inspections)

**Equipment Model**
```prisma
model Equipment {
  id                String           @id
  branchId          String
  requestId         String?
  workOrderId       String?
  
  // Identification
  equipmentNumber   String           // Client's tag (e.g., FE-001)
  equipmentType     EquipmentType    // FIRE_EXTINGUISHER, FIRE_ALARM_PANEL, etc.
  brand             String?
  model             String?
  serialNumber      String?
  location          String?          // "Floor 2, Kitchen"
  
  // Dates
  dateAdded         DateTime
  expectedExpiry    DateTime?        // Next inspection due
  lastInspected     DateTime?
  
  // Status
  status            EquipmentStatus  // ACTIVE, EXPIRING_SOON, EXPIRED, NEEDS_ATTENTION
  inspectionResult  InspectionResult // PASS, FAIL, NEEDS_REPAIR, PENDING
  isInspected       Boolean
  certificateIssued Boolean
  stickerApplied    Boolean
  
  // Notes
  notes             String?
  deficiencies      String?
}
```

**Equipment Types:**
- FIRE_EXTINGUISHER, FIRE_ALARM_PANEL, SPRINKLER_SYSTEM
- EMERGENCY_LIGHTING, EXIT_SIGN, FIRE_DOOR
- SMOKE_DETECTOR, HEAT_DETECTOR, GAS_DETECTOR
- KITCHEN_HOOD_SUPPRESSION, FIRE_PUMP, FIRE_HOSE_REEL

---

### 8. Certificate Management

**Certificate Model**
```prisma
model Certificate {
  id          String          @id
  branchId    String
  projectId   String?
  workOrderId String?
  type        CertificateType // PREVENTIVE_MAINTENANCE, COMPLETION, COMPLIANCE, INSPECTION, CIVIL_DEFENSE
  title       String
  description String?
  fileUrl     String          // PDF URL
  issueDate   DateTime
  expiryDate  DateTime?
  issuedBy    String?         // "Contractor Name" or "Civil Defense"
  issuedById  String?
  notes       String?
}
```

**Certificate Types:**
- `PREVENTIVE_MAINTENANCE` - Auto-generated after maintenance
- `COMPLETION` - Work completion certificate
- `COMPLIANCE` - Compliance certificate
- `INSPECTION` - Inspection certificate
- `CIVIL_DEFENSE` - Uploaded external certificate

---

### 9. Invoice & Payment System

**Invoice Model**
```prisma
model Invoice {
  id                    String        @id
  branchId              String
  projectId             String?
  quotationId           String?
  invoiceNumber         String?
  title                 String
  items                 InvoiceItem[]
  subtotal              Float
  taxRate               Float
  taxAmount             Float
  total                 Float
  amountPaid            Float
  status                InvoiceStatus // DRAFT, SENT, PAYMENT_PENDING, PAID, PARTIAL, OVERDUE
  dueDate               DateTime?
  
  // Payment proof
  paymentProofUrl       String?
  paymentProofType      String?       // 'file' or 'link'
  paymentProofFileName  String?
  paymentSubmittedAt    DateTime?
  paymentSubmittedById  String?
}
```

**Payment Flow:**
1. Contractor creates invoice → `DRAFT`
2. Contractor sends to client → `SENT`
3. Client uploads payment proof → `PAYMENT_PENDING`
4. Contractor verifies payment → `PAID`

---

### 10. Team Management

**TeamMember Model**
```prisma
model TeamMember {
  id            String          @id
  userId        String          @unique
  contractorId  String
  teamRole      TeamMemberRole  // SUPERVISOR, TECHNICIAN
  jobTitle      String?
  phone         String?
  branchAccess  TeamMemberBranch[] // N:N with Branch
}
```

**TeamMemberBranch** (Junction Table)
```prisma
model TeamMemberBranch {
  id            String      @id
  teamMemberId  String
  branchId      String
  createdAt     DateTime    @default(now())
  
  @@unique([teamMemberId, branchId])
}
```

**Access Control:**
- Supervisors can access assigned branches
- Technicians can access assigned branches
- Contractor (owner) can access all branches

---

### 11. Notification System

**Notification Model**
```prisma
model Notification {
  id            String           @id
  userId        String
  type          NotificationType
  title         String
  message       String
  link          String?
  isRead        Boolean          @default(false)
  relatedId     String?
  relatedType   String?
  createdAt     DateTime         @default(now())
}
```

**Notification Types:**
- WORK_ORDER_REMINDER, WORK_ORDER_STARTED, WORK_ORDER_FOR_REVIEW, WORK_ORDER_COMPLETED
- PAYMENT_SUBMITTED, PAYMENT_VERIFIED
- CONTRACT_SIGNED, CONTRACT_EXPIRING
- PROJECT_APPROVED
- REQUEST_RECEIVED, REQUEST_COMMENT
- EQUIPMENT_EXPIRING, EQUIPMENT_EXPIRED

---

## 🔄 Data Flow Patterns

### 1. Service Request Flow

```
Client Portal
  ↓ Submit Request
Request (REQUESTED)
  ↓ Contractor quotes
Request (QUOTED)
  ↓ Client accepts
Request (SCHEDULED) + ChecklistItem created
  ↓ Technician works
ChecklistItem (IN_PROGRESS)
  ↓ Work completed
ChecklistItem (FOR_REVIEW)
  ↓ Client approves
ChecklistItem (COMPLETED) + Certificate generated
```

### 2. Payment Flow

```
Invoice (DRAFT)
  ↓ Contractor sends
Invoice (SENT)
  ↓ Client uploads proof
Invoice (PAYMENT_PENDING)
  ↓ Contractor verifies
Invoice (PAID)
  ↓ Project status update
Project (CLOSED)
```

### 3. Contract Lifecycle

```
Project (PENDING)
  ↓ Client approves
Project (ACTIVE) + Contract (PENDING_SIGNATURE)
  ↓ Client signs start
Contract (SIGNED)
  ↓ Work orders completed
Project (DONE)
  ↓ Invoice paid
Project (CLOSED) + Contract (COMPLETED)
```

---

## 🔐 Security Architecture

### Authentication
- **NextAuth.js** with credentials provider
- **Session-based** authentication
- **bcryptjs** password hashing
- **CSRF protection** built-in

### Authorization
- **Role-based access control** (RBAC)
- **User roles:** CONTRACTOR, CLIENT, TEAM_MEMBER
- **Team roles:** SUPERVISOR, TECHNICIAN
- **Branch-level access** for team members

### Data Protection
- **Prisma ORM** prevents SQL injection
- **Input validation** on all API routes
- **Rate limiting** via Upstash Redis
- **Security headers** in next.config.ts

---

## 📈 Performance Optimizations

### Database
- **Indexes** on frequently queried fields
- **Composite indexes** for complex queries
- **Cascade deletes** for data integrity
- **Connection pooling** via Prisma

### Caching
- **Next.js caching** for static pages
- **Redis caching** for rate limiting
- **CDN caching** via Vercel Edge Network

### Code Splitting
- **Automatic code splitting** by Next.js
- **Dynamic imports** for heavy components
- **Lazy loading** for images and modules

---

## 🗂️ File Storage

### Vercel Blob Storage
- **Certificates** (PDF)
- **Contracts** (PDF)
- **Inspection photos** (JPEG, PNG)
- **Payment proofs** (PDF, images)
- **Company logos** (PNG, SVG)
- **Signatures** (base64 images)

**URL Pattern:** `https://[blob-id].public.blob.vercel-storage.com/[filename]`

---

## 🔌 External Integrations

### Google Maps API
- **Geocoding** for branch addresses
- **Map display** for branch locations
- **Distance calculations**

### Pexels API
- **Stock images** for marketing pages
- **OG images** for social sharing

### Vercel Services
- **Analytics** - User behavior tracking
- **Speed Insights** - Performance monitoring
- **Postgres** - Database hosting
- **Blob Storage** - File storage

### Sentry
- **Error tracking** and monitoring
- **Performance monitoring**
- **Release tracking**

---

## 📊 Database Indexes

### High-Performance Queries

```prisma
// Branch indexes
@@index([clientId])
@@index([name])

// Request indexes
@@index([branchId])
@@index([status])
@@index([createdAt])
@@index([branchId, status])

// ChecklistItem indexes
@@index([stage])
@@index([scheduledDate])
@@index([deletedAt])
@@index([checklistId, stage])

// Equipment indexes
@@index([branchId])
@@index([expectedExpiry])
@@index([status])
@@index([branchId, status])

// Notification indexes
@@index([userId, isRead])
@@index([userId, createdAt])
```

---

## 🎯 Design Decisions

### Why Next.js App Router?
- **Server Components** reduce client bundle size
- **Streaming** for faster page loads
- **Built-in SEO** with metadata API
- **API routes** in same codebase

### Why Prisma?
- **Type safety** with TypeScript
- **Auto-generated types** from schema
- **Migration system** for database changes
- **Relation handling** simplified

### Why PostgreSQL?
- **ACID compliance** for financial data
- **JSON support** for flexible fields
- **Full-text search** capabilities
- **Mature ecosystem**

### Why Vercel?
- **Zero-config deployment**
- **Edge network** for global performance
- **Integrated services** (Postgres, Blob, Analytics)
- **Automatic HTTPS** and CDN

---

## 📚 Related Documentation

- [FEATURES.md](./FEATURES.md) - Feature documentation
- [API-DOCUMENTATION.md](./API-DOCUMENTATION.md) - API endpoints
- [SETUP.md](./SETUP.md) - Setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

---

**Last Updated:** March 2026  
**Schema Version:** 1.0.0  
**Database Models:** 25+  
**Total Lines:** 940 (schema.prisma)
