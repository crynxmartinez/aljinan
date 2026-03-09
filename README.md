# Tasheel - Safety Management Platform for Saudi Arabia Contractors

![Tasheel Logo](./tasheel%20logo.png)

**Live Website:** [https://tasheel.sa](https://tasheel.sa) | [https://www.tasheel.live](https://www.tasheel.live)

Tasheel is a comprehensive safety inspection and compliance management platform designed specifically for contractors in Saudi Arabia. Built by [Jinan Agency](https://www.jinanagency.com), it streamlines fire safety, HVAC, electrical inspections, certificate management, and client operations.

---

## 🎯 Overview

Tasheel provides three distinct portals:

1. **Marketing Website** - Public-facing pages for lead generation and SEO
2. **Contractor Dashboard** - Complete management system for safety contractors
3. **Client Portal** - Self-service portal for clients to view projects, certificates, and invoices

---

## ✨ Key Features

### For Contractors
- 📋 **Work Order Management** - Kanban board with drag-and-drop, recurring tasks
- 👥 **Client & Branch Management** - Multi-location client support
- 📅 **Project & Contract Management** - Full contract lifecycle tracking
- 📊 **Analytics Dashboard** - Revenue, work orders, client insights
- 🔔 **Smart Notifications** - Automated reminders for work orders and expirations
- 📄 **Certificate Generation** - Auto-generate compliance certificates
- 💰 **Invoice & Payment Tracking** - Payment proof submission and verification
- 👨‍💼 **Team Management** - Supervisors and technicians with role-based access
- 🏷️ **Equipment Sticker Inspections** - Track fire extinguishers, alarms, etc.

### For Clients
- 🏢 **Branch Management** - Request new branches for approval
- 📝 **Service Requests** - Submit requests with photos and preferred dates
- 💬 **Real-time Communication** - Comment system on requests
- 📑 **Document Access** - View certificates, invoices, contracts
- ✍️ **Digital Signatures** - Sign contracts and approve work orders
- 💳 **Payment Submission** - Upload payment proofs or paste links

### Marketing & SEO
- 🎨 **Modern Landing Pages** - Hero, features, testimonials, FAQ
- 🔍 **SEO Optimized** - Meta tags, OpenGraph, Twitter Cards, structured data
- 📱 **Fully Responsive** - Mobile-first design with Tailwind CSS
- 🌐 **Multi-language Ready** - Built for Arabic/English expansion

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI + shadcn/ui
- **Icons:** Lucide React
- **Maps:** Google Maps API, Leaflet
- **Charts:** Chart.js + react-chartjs-2
- **PDF Generation:** @react-pdf/renderer

### Backend
- **Runtime:** Node.js
- **API:** Next.js API Routes (App Router)
- **Authentication:** NextAuth.js v4
- **Database:** PostgreSQL (Vercel Postgres)
- **ORM:** Prisma 7
- **File Storage:** Vercel Blob Storage
- **Rate Limiting:** Upstash Redis

### DevOps & Monitoring
- **Hosting:** Vercel
- **Error Tracking:** Sentry
- **Analytics:** Vercel Analytics
- **Performance:** Vercel Speed Insights
- **Database:** Vercel Postgres (PostgreSQL)

### Security
- **Password Hashing:** bcryptjs
- **Rate Limiting:** @upstash/ratelimit
- **Security Headers:** Configured in next.config.ts
- **CSRF Protection:** Built-in NextAuth
- **SQL Injection Prevention:** Prisma ORM

---

## 📁 Project Structure

```
aljinan/
├── prisma/
│   └── schema.prisma          # Database schema (940 lines)
├── public/
│   ├── images/                # OG images, logos
│   └── manifest.json          # PWA manifest
├── scripts/
│   └── download-og-image.cjs  # Pexels image downloader
├── src/
│   ├── app/
│   │   ├── (marketing)/       # Public pages (about, features, FAQ, etc.)
│   │   ├── api/               # API routes (52 endpoints)
│   │   ├── dashboard/         # Contractor dashboard
│   │   ├── portal/            # Client portal
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   └── layout.tsx         # Root layout with metadata
│   ├── components/
│   │   ├── analytics/         # Dashboard charts
│   │   ├── branches/          # Branch components
│   │   ├── clients/           # Client management
│   │   ├── dashboard/         # Dashboard layout
│   │   ├── layout/            # Headers, sidebars
│   │   ├── marketing/         # Landing page sections
│   │   ├── modules/           # Feature modules (22 modules)
│   │   ├── seo/               # SEO schemas
│   │   └── ui/                # Reusable UI components (36 components)
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts              # Prisma client
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── next-auth.d.ts     # NextAuth type extensions
├── .env.local.example         # Environment variables template
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or Vercel Postgres)
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/crynxmartinez/aljinan.git
cd aljinan
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

4. **Set up database:**
```bash
npx prisma generate
npx prisma db push
```

5. **Run development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and database schema
- **[FEATURES.md](./FEATURES.md)** - Detailed feature documentation
- **[SETUP.md](./SETUP.md)** - Complete setup and configuration guide
- **[API-DOCUMENTATION.md](./API-DOCUMENTATION.md)** - API routes and endpoints
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide for Vercel
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines

---

## 🔐 GitHub Access Control

This repository can be configured as **private with controlled access**:

### Recommended Setup
1. **Make repo private** (Settings → Danger Zone → Change visibility)
2. **Add collaborators** (Settings → Collaborators)
3. **Enable branch protection** on `main`:
   - Require pull request reviews
   - Require 1-2 approvals
   - No direct pushes to main

### Workflow
- Developers work on feature branches
- Submit pull requests to `main`
- Owner reviews and approves changes
- Merge after approval

---

## 🌟 Key Highlights

### Database Schema
- **940 lines** of Prisma schema
- **25+ models** covering all business logic
- **Enums** for type safety (UserRole, WorkOrderType, etc.)
- **Relations** properly indexed for performance

### API Routes
- **52 API endpoints** organized by module
- **RESTful design** with proper HTTP methods
- **Authentication** on all protected routes
- **Rate limiting** on sensitive endpoints

### UI Components
- **36 reusable components** from shadcn/ui
- **Radix UI primitives** for accessibility
- **Tailwind CSS** for styling
- **Responsive design** mobile-first

### SEO & Marketing
- **OpenGraph** and **Twitter Cards** configured
- **JSON-LD schemas** (Organization, FAQ, Service, LocalBusiness)
- **Canonical URLs** on all pages
- **Sitemap** and **robots.txt** auto-generated

---

## 📊 Database Models

### Core Models
- **User** - Authentication and role management
- **Contractor** - Contractor profile and company info
- **Client** - Client companies
- **Branch** - Client locations/facilities
- **Project** - Contracts and service agreements
- **Request** - Service requests from clients
- **ChecklistItem** - Work orders (Kanban board)
- **Equipment** - Fire safety equipment tracking
- **Certificate** - Compliance certificates
- **Invoice** - Billing and payments
- **TeamMember** - Contractor staff

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete schema documentation.

---

## 🔒 Security Features

- ✅ **Password hashing** with bcryptjs
- ✅ **Session-based auth** with NextAuth.js
- ✅ **CSRF protection** built-in
- ✅ **SQL injection prevention** via Prisma
- ✅ **Rate limiting** on API routes
- ✅ **Security headers** (HSTS, CSP, X-Frame-Options)
- ✅ **Role-based access control** (RBAC)
- ✅ **Input validation** on all forms

---

## 🎨 Design System

- **Primary Color:** Slate (#0f172a)
- **Accent Color:** Primary (customizable)
- **Typography:** System fonts (optimized for Arabic/English)
- **Spacing:** Tailwind default scale
- **Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)

---

## 📱 Progressive Web App (PWA)

- ✅ **Manifest.json** configured
- ✅ **Offline support** ready
- ✅ **Mobile-optimized** UI
- ✅ **Add to home screen** enabled

See [PWA-SETUP-GUIDE.md](./PWA-SETUP-GUIDE.md) for details.

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

---

## 📈 Performance

- ✅ **Server-side rendering** (SSR) for marketing pages
- ✅ **Static generation** where possible
- ✅ **Image optimization** with Next.js Image
- ✅ **Code splitting** automatic
- ✅ **Lazy loading** for heavy components
- ✅ **Vercel Edge Network** CDN

---

## 🌍 Deployment

**Production:** Vercel (auto-deploy from `main` branch)

```bash
# Deploy to Vercel
vercel --prod

# Or push to main branch (auto-deploys)
git push origin main
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code style guidelines
- Pull request process
- Branch naming conventions
- Commit message format

---

## 📄 License

Copyright © 2025 Tasheel. All rights reserved.

**Powered by [Jinan Agency](https://www.jinanagency.com)** - Digital Growth Partner for Medical Clinics

---

## 👥 Team

**Founders:**
- **Hyper Abtahi** - Chief Executive Officer
- **Raph-el Martinez** - Chief Technology Officer
- **Josh Pescadera** - Chief Financial Officer

**Parent Organization:** [Jinan Agency](https://www.jinanagency.com)

---

## 📞 Support

- **Website:** [https://tasheel.sa](https://tasheel.sa)
- **Email:** support@tasheel.sa
- **Documentation:** [GitHub Wiki](https://github.com/crynxmartinez/aljinan/wiki)

---

## 🗺️ Roadmap

See [PHASE-5-REMAINING-PLAN.md](./PHASE-5-REMAINING-PLAN.md) for upcoming features:
- Advanced analytics
- Mobile app (React Native)
- WhatsApp integration
- Multi-language support (Arabic)
- Advanced reporting
- Bulk operations

---

**Built with ❤️ by Jinan Agency**
