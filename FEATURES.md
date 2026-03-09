# Tasheel - Feature Documentation

Complete guide to all features and modules in the Tasheel platform.

---

## 📑 Table of Contents

1. [Marketing Website](#-marketing-website)
2. [Contractor Dashboard](#-contractor-dashboard)
3. [Client Portal](#-client-portal)
4. [Work Order Management](#-work-order-management)
5. [Service Request System](#-service-request-system)
6. [Equipment Tracking](#-equipment-tracking)
7. [Certificate Management](#-certificate-management)
8. [Invoice & Payment System](#-invoice--payment-system)
9. [Team Management](#-team-management)
10. [Analytics & Reporting](#-analytics--reporting)

---

## 🌐 Marketing Website

### Public Pages

#### Homepage (`/`)
- **Hero Section** - Value proposition with CTA buttons
- **Problem-Solution** - Pain points and solutions
- **How It Works** - 3-step process visualization
- **Features Grid** - 6 key features with icons
- **Benefits** - Contractor and client benefits
- **Testimonials** - Social proof (placeholder)
- **Stats** - Key metrics (50+ contractors, 500+ clients)
- **CTA Section** - Final conversion push

**SEO Features:**
- Meta title, description, keywords
- OpenGraph and Twitter Cards
- Canonical URLs
- Organization schema (JSON-LD)

#### Features Page (`/features`)
- Detailed feature descriptions
- Feature images (Pexels)
- Benefits breakdown
- Service schema (JSON-LD)
- Internal links to homepage

#### About Page (`/about`)
- Company story
- Mission and vision
- Team information (Jinan Agency founders)
- Values and approach
- Internal links to homepage

#### FAQ Page (`/faq`)
- **Categories:**
  - Getting Started (2 questions)
  - Features (4 questions)
  - Support & Security (4 questions)
  - Technical (3 questions)
- Accordion UI (Radix UI)
- FAQ schema (JSON-LD)
- Search-friendly structure

#### Contact Page (`/contact`)
- Contact form (placeholder)
- Support email: support@tasheel.sa
- Office location (placeholder)
- Google Maps integration
- LocalBusiness schema (JSON-LD)

#### Legal Pages
- **Privacy Policy** (`/privacy`) - Data protection policies
- **Terms of Service** (`/terms`) - Terms and conditions

### SEO & Marketing Features

#### Metadata Configuration
- **metadataBase:** `https://tasheel.sa`
- **OpenGraph images:** 1200x630px (safety inspector photo)
- **Twitter Cards:** summary_large_image
- **Keywords:** Saudi Arabia-focused safety keywords
- **Canonical URLs:** All pages

#### Structured Data (JSON-LD)
- **Organization Schema** - Company info, founders, parent org (Jinan Agency)
- **FAQ Schema** - All FAQ questions
- **Service Schema** - Safety services offered
- **LocalBusiness Schema** - Contact page

#### Footer
- Navigation links (Features, About, FAQ, Contact)
- Legal links (Privacy, Terms)
- Social media placeholders
- **"Powered by Jinan Agency"** credit with link

---

## 👨‍💼 Contractor Dashboard

### Dashboard Overview (`/dashboard`)

**Action Center:**
- Upcoming work orders (next 7 days)
- Pending requests from clients
- Expiring equipment alerts
- Recent activities

**Quick Stats:**
- Total clients
- Active projects
- Pending work orders
- Monthly revenue

**Quick Actions:**
- Add new client
- Create work order
- View all requests
- Generate report

### Client Management (`/dashboard/clients`)

**Client List:**
- Search and filter clients
- Sort by name, date, status
- View client details
- Archive/unarchive clients

**Client Details Page:**
- Company information
- Contact details
- Branches list
- Projects history
- Invoices and payments
- Certificates issued

**Add/Edit Client:**
- Company name, email, phone
- CR number, VAT number
- Billing address
- Multiple contacts (JSON)
- Logo upload

### Branch Management

**Branch List (per client):**
- Branch name and address
- Building type and size
- Civil Defense certificate status
- Equipment count
- Active projects

**Branch Details:**
- Facility profile
- Google Maps location
- Equipment list
- Work order history
- Certificates
- Invoices

**Add/Edit Branch:**
- Name, address, city
- Latitude/longitude (Google Maps)
- Building type (dropdown)
- Floor count, area size
- Municipality
- CD certificate upload

### Project Management (`/dashboard/projects`)

**Project List:**
- Filter by status (PENDING, ACTIVE, DONE, CLOSED)
- Search by title
- Sort by date, value
- Status badges

**Project Details:**
- Contract information
- Start/end dates
- Total value
- Work orders (checklist items)
- Invoices
- Certificates
- Activity log

**Create Project:**
- Select client and branch
- Project title and description
- Start/end dates
- Auto-renew option
- Total contract value
- Priority level

**Project Lifecycle:**
1. Create project → PENDING
2. Client approves → ACTIVE
3. End date reached → DONE
4. Invoice paid → CLOSED

### Work Order Management (`/dashboard/work-orders`)

**Kanban Board:**
- **Columns:**
  - Scheduled (upcoming tasks)
  - In Progress (technician working)
  - For Review (awaiting client approval)
  - Completed (done)
- **Drag & Drop** - Move tasks between stages
- **Filters:**
  - By branch
  - By date range
  - By work order type
  - By payment status

**Work Order Card:**
- Description and notes
- Scheduled date
- Price
- Work order type badge
- Payment status badge
- Assigned technician
- Quick actions (edit, delete, archive)

**Create Work Order:**
- Select checklist (project)
- Description
- Work order type (Service, Inspection, Maintenance, Installation, Sticker Inspection)
- Recurring type (Once, Monthly, Quarterly, Semi-Annually, Annually)
- Scheduled date
- Price
- Assign to team member

**Work Order Details:**
- Inspection report fields
- Systems checked (multi-select)
- Findings, deficiencies, recommendations
- Upload photos (before/during/after)
- Technician signature
- Supervisor signature
- Client signature
- Generate PDF report
- Payment tracking

### Service Requests (`/dashboard/requests`)

**Request List:**
- Filter by status
- Search by title
- Sort by date, priority
- Priority badges (LOW, MEDIUM, HIGH, URGENT)

**Request Flow:**
1. **REQUESTED** - Client submitted
   - View details, photos
   - Add quote (price + date)
   - Send quote to client
2. **QUOTED** - Waiting for client
   - View quote details
   - Wait for client response
3. **SCHEDULED** - Client accepted
   - Create work order automatically
   - Link to work order
4. **IN_PROGRESS** - Work ongoing
5. **COMPLETED** - Work done

**Request Details:**
- Title, description
- Priority, status
- Preferred date and time slot
- Recurring type
- Photos uploaded by client
- Comments (real-time chat)
- Quote information
- Link to created work order

**Quote Request:**
- Set price
- Set date
- Add notes
- Send to client (notification)

### Equipment Tracking (`/dashboard/equipment`)

**Equipment List:**
- Filter by branch
- Filter by status (ACTIVE, EXPIRING_SOON, EXPIRED, NEEDS_ATTENTION)
- Filter by equipment type
- Search by equipment number
- Sort by expiry date

**Equipment Card:**
- Equipment number (e.g., FE-001)
- Type badge
- Location
- Last inspected date
- Expected expiry date
- Status badge
- Quick actions

**Add Equipment:**
- Select branch
- Equipment number (client's tag)
- Equipment type (dropdown)
- Brand, model, serial number
- Location (e.g., "Floor 2, Kitchen")
- Expected expiry date
- Notes

**Bulk Import:**
- Upload CSV file
- Map columns
- Validate data
- Import equipment

**Sticker Inspection Workflow:**
1. Create "Sticker Inspection" work order
2. Link equipment to work order
3. Technician inspects each equipment
4. Mark as PASS/FAIL/NEEDS_REPAIR
5. Apply sticker
6. Generate certificate
7. Update expiry dates

### Certificate Management (`/dashboard/certificates`)

**Certificate List:**
- Filter by branch
- Filter by type
- Filter by expiry status
- Search by title
- Sort by issue date, expiry date

**Certificate Types:**
- Preventive Maintenance (auto-generated)
- Completion (work completion)
- Compliance (compliance cert)
- Inspection (inspection cert)
- Civil Defense (uploaded external)

**Generate Certificate:**
- Select type
- Select branch and project
- Link to work order (optional)
- Issue date, expiry date
- Auto-generate PDF
- Download or email to client

**Upload External Certificate:**
- Upload Civil Defense certificate
- Set issue and expiry dates
- Link to branch

### Invoice Management (`/dashboard/invoices`)

**Invoice List:**
- Filter by status (DRAFT, SENT, PAYMENT_PENDING, PAID, OVERDUE)
- Filter by branch
- Search by invoice number
- Sort by date, amount

**Create Invoice:**
- Select branch and project
- Invoice number (auto-generated)
- Add line items (description, quantity, unit price)
- Set tax rate (15% VAT default)
- Calculate totals automatically
- Set due date
- Save as draft or send immediately

**Invoice Details:**
- Line items table
- Subtotal, tax, total
- Amount paid
- Payment status
- Payment proof (if submitted)
- Download PDF
- Send to client (email notification)

**Payment Verification:**
1. Client uploads payment proof (file or link)
2. Status → PAYMENT_PENDING
3. Contractor reviews proof
4. Contractor verifies payment
5. Status → PAID
6. Project status → CLOSED (if final invoice)

### Contract Management (`/dashboard/contracts`)

**Contract List:**
- Filter by status
- Filter by branch
- Search by title
- Sort by date

**Create Contract:**
- Select branch and project
- Contract title and description
- Upload PDF attachment
- Upload certificate (optional)
- Set start/end dates
- Set total value
- Save as draft or send for signature

**Contract Signing Flow:**
1. **DRAFT** - Contractor creates
2. **PENDING_SIGNATURE** - Sent to client
3. Client signs at start → **SIGNED**
4. Work completed
5. Client signs at end → **COMPLETED**

**Digital Signatures:**
- Canvas signature pad
- Save as base64 image
- Store signature URL
- Timestamp and user ID

### Team Management (`/dashboard/team`)

**Team Member List:**
- Filter by role (Supervisor, Technician)
- Search by name
- View assigned branches
- Status (Active, Archived)

**Add Team Member:**
- Full name, email
- Phone number
- Team role (Supervisor/Technician)
- Job title
- Assign branches (multi-select)
- Send invitation email

**Team Member Details:**
- Personal information
- Assigned branches
- Work order history
- Performance metrics (future)

**Branch Access Control:**
- Assign/unassign branches
- Team members only see assigned branches
- Contractor sees all branches

### Analytics (`/dashboard/analytics`)

**Revenue Analytics:**
- Monthly revenue chart (Chart.js)
- Revenue by client
- Revenue by service type
- Year-over-year comparison

**Work Order Analytics:**
- Work orders by status (pie chart)
- Work orders by type (bar chart)
- Completion rate
- Average completion time

**Client Analytics:**
- Top clients by revenue
- Client growth over time
- Active vs. inactive clients
- Client retention rate

**Equipment Analytics:**
- Equipment by type
- Expiring equipment alerts
- Inspection compliance rate

### Settings (`/dashboard/settings`)

**Company Profile:**
- Company name, logo
- Contact information
- Business type
- CR number, VAT number
- License information
- Insurance details
- Service areas

**User Profile:**
- Name, email
- Phone number
- Change password
- Profile photo

**Notification Preferences:**
- Email notifications
- In-app notifications
- Notification types (work orders, payments, requests)

---

## 🏢 Client Portal

### Portal Dashboard (`/portal`)

**Overview:**
- Active projects count
- Pending requests
- Unpaid invoices
- Recent certificates

**Quick Actions:**
- Submit new request
- View all projects
- Pay invoices
- Download certificates

### Branch Management (`/portal/branches`)

**My Branches:**
- List of all branches
- Branch details
- Request new branch

**Request New Branch:**
- Branch name, address
- City, state, zip code
- Phone number
- Google Maps location picker
- Notes
- Submit for contractor approval

**Branch Request Status:**
- PENDING - Awaiting contractor approval
- APPROVED - Branch created
- REJECTED - Request denied with reason

### Service Requests (`/portal/requests`)

**Submit Request:**
- Select branch
- Request title and description
- Priority (LOW, MEDIUM, HIGH, URGENT)
- Work order type (Service, Inspection, Maintenance)
- Preferred date and time slot
- Recurring type (Once, Monthly, Quarterly)
- Upload photos (up to 5)
- Need certificate? (checkbox)
- Submit

**Request List:**
- Filter by status
- Filter by branch
- Search by title
- Sort by date

**Request Details:**
- View all information
- View photos
- See contractor quote (if provided)
- Accept or reject quote
- Add comments (real-time chat)
- View linked work order

**Accept Quote:**
- Review price and date
- Accept → Creates work order
- Status → SCHEDULED

**Reject Quote:**
- Provide rejection reason
- Status → REJECTED
- Can submit new request

### Project Tracking (`/portal/projects`)

**Project List:**
- Filter by status
- Filter by branch
- View contract details

**Project Details:**
- Contract information
- Work order schedule
- Upcoming inspections
- Completed work orders
- Invoices
- Certificates
- Activity timeline

**Approve Project:**
- Review project details
- Digital signature
- Status → ACTIVE

### Work Order Tracking

**Work Order List:**
- Upcoming work orders
- In-progress work orders
- Completed work orders
- Filter by branch

**Work Order Details:**
- Scheduled date
- Work order type
- Description and notes
- Inspection report (if completed)
- Photos (before/during/after)
- Technician and supervisor signatures
- Approve work (digital signature)
- Download inspection report PDF

### Invoice & Payment

**Invoice List:**
- Unpaid invoices
- Paid invoices
- Overdue invoices
- Filter by branch

**Invoice Details:**
- Line items
- Subtotal, tax, total
- Due date
- Payment status
- Download PDF

**Submit Payment Proof:**
- Upload file (PDF, image) OR
- Paste payment link (bank transfer confirmation)
- Submit for contractor verification
- Status → PAYMENT_PENDING

**Payment Tracking:**
- View submission timestamp
- Wait for contractor verification
- Status → PAID (after verification)

### Certificates (`/portal/certificates`)

**Certificate List:**
- Filter by branch
- Filter by type
- Filter by expiry status
- Sort by issue date

**Certificate Details:**
- Certificate type
- Issue and expiry dates
- Issued by (contractor name)
- Download PDF
- Email to self

**Expiring Certificates:**
- Alerts for certificates expiring within 30 days
- Request renewal

### Settings (`/portal/settings`)

**Company Profile:**
- Company name
- Contact information
- CR number, VAT number
- Billing address
- Multiple contacts

**User Profile:**
- Name, email
- Phone number
- Change password

**Notification Preferences:**
- Email notifications
- SMS notifications (future)
- Notification types

---

## 📋 Work Order Management

### Kanban Board Features

**Drag & Drop:**
- Move work orders between stages
- Auto-update status
- Real-time updates

**Filters:**
- By branch (multi-select)
- By date range (calendar picker)
- By work order type
- By payment status
- By assigned technician

**Bulk Actions:**
- Select multiple work orders
- Bulk assign technician
- Bulk update scheduled date
- Bulk archive

**Search:**
- Search by description
- Search by work order ID
- Search by branch name

### Recurring Work Orders

**Setup:**
- Select recurring type (Monthly, Quarterly, Semi-Annually, Annually)
- Set start date
- System auto-generates future occurrences

**Management:**
- View all occurrences
- Edit future occurrences
- Skip occurrence
- Stop recurrence

**Parent-Child Relationship:**
- Original work order = parent
- Future occurrences = children
- Link via `parentItemId` and `occurrenceIndex`

### Inspection Reports

**Fields:**
- Inspection date
- Systems checked (multi-select checkboxes)
- Findings (text area)
- Deficiencies (text area)
- Recommendations (text area)

**Photos:**
- Upload multiple photos
- Categorize (before, during, after)
- Add captions
- Display in report

**Signatures:**
- Technician signature (required)
- Supervisor signature (optional)
- Client signature (required for completion)
- Canvas signature pad
- Save as base64 image

**PDF Generation:**
- Auto-generate professional PDF
- Include all inspection data
- Include photos
- Include signatures
- Company branding
- Download or email

### Payment Tracking

**Work Order Payment:**
- Set price when creating work order
- Payment status: UNPAID
- Client submits proof → PENDING_VERIFICATION
- Contractor verifies → PAID

**Payment Proof:**
- Upload file (PDF, image)
- Paste link (bank transfer confirmation)
- Store filename and type
- Timestamp submission

**Verification:**
- Contractor reviews proof
- Contractor signature (optional)
- Mark as verified
- Timestamp verification

---

## 🔧 Service Request System

### Request Submission (Client)

**Form Fields:**
- Branch (dropdown)
- Title (required)
- Description (optional)
- Priority (LOW, MEDIUM, HIGH, URGENT)
- Work order type (Service, Inspection, Maintenance, Installation)
- Preferred date (calendar picker)
- Preferred time slot (Morning, Afternoon, Evening)
- Recurring type (Once, Monthly, Quarterly)
- Need certificate? (checkbox)
- Upload photos (up to 5, drag & drop)

**Validation:**
- Required fields
- Date must be in future
- Max 5 photos
- Max 5MB per photo

**Submission:**
- Create request → REQUESTED
- Notify contractor
- Redirect to request details

### Quote Management (Contractor)

**Review Request:**
- View all details
- View uploaded photos
- Check client history
- Check branch location

**Create Quote:**
- Set price (required)
- Set date (required)
- Add internal notes
- Send to client

**Quote Sent:**
- Status → QUOTED
- Notify client
- Wait for client response

### Client Response

**Accept Quote:**
- Review price and date
- Accept button
- Status → SCHEDULED
- Auto-create work order
- Link request to work order
- Notify contractor

**Reject Quote:**
- Provide rejection reason (required)
- Status → REJECTED
- Notify contractor
- Can submit new request

### Comment System

**Real-time Chat:**
- Add comments on request
- Both client and contractor can comment
- Timestamp and user name
- Edit own comments (mark as edited)
- Delete own comments

**Notifications:**
- Notify other party on new comment
- In-app notification
- Email notification (optional)

---

## 🏷️ Equipment Tracking

### Equipment Registration

**Add Equipment:**
- Select branch
- Equipment number (client's tag, e.g., FE-001)
- Equipment type (dropdown)
- Brand, model, serial number
- Location (text, e.g., "Floor 2, Kitchen")
- Expected expiry date
- Notes

**Equipment Types:**
- Fire Extinguisher
- Fire Alarm Panel
- Sprinkler System
- Emergency Lighting
- Exit Sign
- Fire Door
- Smoke Detector
- Heat Detector
- Gas Detector
- Kitchen Hood Suppression
- Fire Pump
- Fire Hose Reel
- Other

### Bulk Import

**CSV Upload:**
- Download template CSV
- Fill in equipment data
- Upload CSV file
- Map columns to fields
- Validate data
- Preview import
- Confirm import

**Validation:**
- Required fields check
- Date format check
- Duplicate equipment number check
- Invalid equipment type check

### Inspection Workflow

**Create Sticker Inspection:**
- Select branch
- Select equipment to inspect
- Create work order (type: STICKER_INSPECTION)
- Assign technician

**Inspection Process:**
1. Technician goes to site
2. Opens work order on mobile
3. For each equipment:
   - Scan or enter equipment number
   - Perform inspection
   - Mark result (PASS, FAIL, NEEDS_REPAIR)
   - Add deficiencies (if any)
   - Take photos
   - Apply physical sticker
   - Mark as inspected
4. Complete all equipment
5. Generate certificate
6. Client signature

**Inspection Results:**
- PASS - Equipment OK, update expiry date
- FAIL - Equipment failed, needs replacement
- NEEDS_REPAIR - Equipment needs repair before passing
- PENDING - Not yet inspected

### Expiry Tracking

**Status Calculation:**
- ACTIVE - Expiry date > 30 days away
- EXPIRING_SOON - Expiry date within 30 days
- EXPIRED - Expiry date passed
- NEEDS_ATTENTION - Failed inspection or has deficiencies

**Notifications:**
- 30 days before expiry → EXPIRING_SOON notification
- On expiry date → EXPIRED notification
- Weekly digest of expiring equipment

**Filters:**
- Show only expiring equipment
- Show only expired equipment
- Show by equipment type
- Show by branch

### Certificate Generation

**Auto-generate Certificate:**
- After sticker inspection completion
- Include all inspected equipment
- List equipment numbers
- Show inspection results
- Issue date and expiry date
- Contractor signature
- Generate PDF

---

## 📄 Certificate Management

### Certificate Types

**Preventive Maintenance:**
- Auto-generated after maintenance work order
- Includes work performed
- Issue date = completion date
- Expiry date = issue date + 1 year (configurable)

**Completion:**
- Generated after project completion
- Includes all work orders
- Issue date = project end date
- No expiry date

**Compliance:**
- Generated for compliance verification
- Includes systems checked
- Issue date = inspection date
- Expiry date = issue date + 1 year

**Inspection:**
- Generated after inspection work order
- Includes findings and recommendations
- Issue date = inspection date
- Expiry date = issue date + 6 months

**Civil Defense:**
- Uploaded external certificate
- From Civil Defense authority
- Manual entry of issue and expiry dates
- Store PDF file

### Certificate Generation

**Auto-generation Triggers:**
- Work order completed with "needsCertificate" flag
- Sticker inspection completed
- Project completed
- Manual generation by contractor

**PDF Template:**
- Company logo and branding
- Certificate title and type
- Branch information
- Issue and expiry dates
- Work performed / systems checked
- Contractor signature
- QR code (future: verification)

**Customization:**
- Custom certificate templates
- Add company branding
- Custom fields
- Multi-language support (future)

### Certificate Distribution

**Download:**
- PDF download button
- High-quality PDF (300 DPI)
- Filename: `Certificate_[Type]_[Branch]_[Date].pdf`

**Email:**
- Send to client email
- Send to multiple recipients
- Include message
- Attach PDF

**Client Portal Access:**
- All certificates visible in portal
- Filter and search
- Download anytime
- Print-friendly view

### Expiry Management

**Expiry Tracking:**
- Dashboard widget showing expiring certificates
- Filter certificates by expiry status
- Sort by expiry date

**Notifications:**
- 60 days before expiry
- 30 days before expiry
- 7 days before expiry
- On expiry date

**Renewal Workflow:**
- Client requests renewal
- Contractor schedules inspection
- New certificate generated
- Old certificate archived

---

## 💰 Invoice & Payment System

### Invoice Creation

**Create Invoice:**
- Select branch and project
- Auto-generate invoice number (INV-YYYY-MM-XXXX)
- Add line items:
  - Description (e.g., "Fire Alarm Inspection")
  - Quantity (default: 1)
  - Unit price
  - Total (auto-calculated)
- Add/remove line items
- Set tax rate (default: 15% VAT)
- Auto-calculate subtotal, tax, total
- Set due date
- Save as draft or send

**Invoice from Work Order:**
- Select completed work orders
- Auto-populate line items
- Use work order prices
- One-click invoice creation

**Invoice from Quotation:**
- Convert approved quotation to invoice
- Copy all line items
- Maintain pricing

### Invoice Management

**Invoice List:**
- Filter by status
- Filter by branch
- Filter by date range
- Search by invoice number
- Sort by date, amount, status

**Invoice Statuses:**
- DRAFT - Not sent yet
- SENT - Sent to client
- PAYMENT_PENDING - Client submitted proof
- PAID - Payment verified
- PARTIAL - Partially paid
- OVERDUE - Past due date
- CANCELLED - Cancelled

**Invoice Actions:**
- Edit (if DRAFT)
- Send to client
- Download PDF
- Mark as paid manually
- Cancel invoice
- Duplicate invoice

### Payment Submission (Client)

**Payment Methods:**
1. **File Upload:**
   - Upload payment receipt (PDF, image)
   - Max 10MB
   - Store in Vercel Blob
   - Save filename and URL

2. **Link Paste:**
   - Paste bank transfer confirmation link
   - Validate URL format
   - Store link

**Submission:**
- Select invoice
- Choose method (file or link)
- Upload/paste
- Add notes (optional)
- Submit
- Status → PAYMENT_PENDING
- Notify contractor

### Payment Verification (Contractor)

**Review Payment Proof:**
- View uploaded file or link
- Check amount matches invoice
- Check payment date
- Verify payment source

**Verify Payment:**
- Mark as verified
- Add verification signature (optional)
- Update amount paid
- Status → PAID
- Timestamp verification
- Notify client

**Reject Payment:**
- Provide rejection reason
- Status → SENT
- Notify client
- Client can resubmit

### Payment Tracking

**Dashboard Widget:**
- Total unpaid invoices
- Total pending verification
- Total paid this month
- Overdue invoices count

**Payment Reports:**
- Payment history
- Payment by client
- Payment by month
- Outstanding balance

---

## 👥 Team Management

### Team Member Roles

**Supervisor:**
- Can view assigned branches
- Can create/edit work orders
- Can approve technician work
- Can sign inspection reports
- Cannot access billing

**Technician:**
- Can view assigned branches
- Can update work order status
- Can add inspection data
- Can upload photos
- Can sign inspection reports
- Cannot create work orders

### Team Member Management

**Add Team Member:**
- Full name, email, phone
- Team role (Supervisor/Technician)
- Job title (optional)
- Assign branches (multi-select)
- Send invitation email
- User creates password

**Edit Team Member:**
- Update personal info
- Change team role
- Reassign branches
- Archive/unarchive

**Branch Access Control:**
- Assign multiple branches
- Unassign branches
- Team member only sees assigned branches
- Contractor sees all branches

### Invitation System

**Send Invitation:**
- Generate unique invitation link
- Email to team member
- Link expires in 7 days
- Team member sets password
- Account activated

**Invitation Status:**
- PENDING - Invitation sent, not accepted
- ACTIVE - Account activated
- EXPIRED - Invitation expired
- ARCHIVED - Account deactivated

### Team Member Dashboard

**Supervisor Dashboard:**
- Assigned branches
- Work orders to review
- Technician activity
- Upcoming inspections

**Technician Dashboard:**
- Assigned work orders
- Today's schedule
- Completed work orders
- Pending signatures

---

## 📊 Analytics & Reporting

### Revenue Analytics

**Monthly Revenue Chart:**
- Line chart (Chart.js)
- Last 12 months
- Hover tooltips
- Export to CSV

**Revenue by Client:**
- Bar chart
- Top 10 clients
- Total revenue per client
- Click to view client details

**Revenue by Service Type:**
- Pie chart
- Service, Inspection, Maintenance, Installation
- Percentage breakdown

**Year-over-Year:**
- Compare current year to previous year
- Growth percentage
- Trend analysis

### Work Order Analytics

**Work Orders by Status:**
- Pie chart
- Scheduled, In Progress, For Review, Completed
- Count and percentage

**Work Orders by Type:**
- Bar chart
- Service, Inspection, Maintenance, Installation, Sticker Inspection
- Count per type

**Completion Rate:**
- Percentage of completed work orders
- Average completion time
- On-time completion rate

**Work Order Trends:**
- Line chart over time
- Created vs. completed
- Backlog tracking

### Client Analytics

**Top Clients:**
- Table view
- Sort by revenue, work orders, projects
- Client growth rate
- Last activity date

**Client Growth:**
- Line chart
- New clients per month
- Active vs. inactive clients
- Churn rate

**Client Retention:**
- Retention rate percentage
- Average client lifetime
- Repeat business rate

### Equipment Analytics

**Equipment by Type:**
- Bar chart
- Count per equipment type
- Most common equipment

**Expiring Equipment:**
- Table view
- Equipment expiring within 30/60/90 days
- Sort by expiry date
- Export to CSV

**Inspection Compliance:**
- Percentage of equipment inspected on time
- Overdue inspections
- Inspection frequency

### Custom Reports

**Report Builder:**
- Select date range
- Select metrics
- Select filters
- Generate report
- Export to PDF/CSV

**Scheduled Reports:**
- Weekly/monthly reports
- Email to stakeholders
- Auto-generated

---

## 🔔 Notification System

### Notification Types

**Work Order Notifications:**
- WORK_ORDER_REMINDER - 24 hours before scheduled date
- WORK_ORDER_STARTED - Technician started work
- WORK_ORDER_FOR_REVIEW - Work completed, needs review
- WORK_ORDER_COMPLETED - Work approved and completed

**Payment Notifications:**
- PAYMENT_SUBMITTED - Client submitted payment proof
- PAYMENT_VERIFIED - Contractor verified payment

**Contract Notifications:**
- CONTRACT_SIGNED - Client signed contract
- CONTRACT_EXPIRING - Contract expiring within 30 days

**Project Notifications:**
- PROJECT_APPROVED - Client approved project

**Request Notifications:**
- REQUEST_RECEIVED - New request from client
- REQUEST_COMMENT - New comment on request

**Equipment Notifications:**
- EQUIPMENT_EXPIRING - Equipment inspection due within 30 days
- EQUIPMENT_EXPIRED - Equipment inspection overdue

### Notification Delivery

**In-App Notifications:**
- Bell icon in header
- Unread count badge
- Notification dropdown
- Mark as read
- Click to navigate to related item

**Email Notifications:**
- Configurable per notification type
- HTML email templates
- Unsubscribe link
- Digest option (daily/weekly)

**Push Notifications (Future):**
- Browser push notifications
- Mobile app push notifications

### Notification Management

**Notification Center:**
- View all notifications
- Filter by type
- Filter by read/unread
- Mark all as read
- Delete notifications

**Notification Preferences:**
- Enable/disable per type
- Email vs. in-app
- Notification frequency
- Quiet hours

---

## 🔍 Search & Filters

### Global Search

**Search Bar:**
- Search across all modules
- Clients, branches, projects, work orders, invoices
- Real-time results
- Keyboard shortcut (Cmd/Ctrl + K)

**Search Results:**
- Grouped by type
- Highlight matching text
- Click to navigate
- Recent searches

### Advanced Filters

**Filter Components:**
- Date range picker
- Multi-select dropdowns
- Status checkboxes
- Search input
- Sort options

**Saved Filters:**
- Save filter combinations
- Quick access to saved filters
- Share filters with team

### Export Features

**Export Options:**
- CSV export
- PDF export
- Excel export (future)

**Export Data:**
- Filtered results
- All data
- Custom fields selection

---

## 📱 Mobile Responsiveness

### Mobile-First Design

**Responsive Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Navigation:**
- Hamburger menu
- Bottom navigation (future)
- Swipe gestures

**Mobile Optimizations:**
- Touch-friendly buttons (min 44px)
- Simplified forms
- Optimized images
- Reduced animations

### Progressive Web App (PWA)

**Features:**
- Add to home screen
- Offline support (future)
- App-like experience
- Fast loading

---

## 🔐 Security Features

### Authentication

**Login:**
- Email and password
- Session-based (NextAuth.js)
- Remember me option
- Forgot password (future)

**Registration:**
- Company name, email, phone
- Business registration number
- Password requirements (8+ chars, uppercase, lowercase, number)
- Email verification (future)

### Authorization

**Role-Based Access Control:**
- CONTRACTOR - Full access
- CLIENT - Portal access only
- TEAM_MEMBER - Limited dashboard access

**Branch-Level Access:**
- Team members only see assigned branches
- Clients only see their branches

### Data Protection

**Password Security:**
- bcryptjs hashing
- Salt rounds: 10
- No plain text storage

**API Security:**
- Authentication required on all protected routes
- Rate limiting (100 requests/15 minutes)
- CSRF protection
- SQL injection prevention (Prisma)

**File Upload Security:**
- File type validation
- File size limits
- Virus scanning (future)
- Secure URLs (Vercel Blob)

---

**Last Updated:** March 2026  
**Total Features:** 100+  
**Modules:** 22  
**Pages:** 50+
