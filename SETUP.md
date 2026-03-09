# Tasheel - Setup Guide

Complete setup instructions for local development and production deployment.

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database (local or Vercel Postgres)
- **Git** for version control
- **Vercel account** (for deployment)
- **Google Maps API key** (for maps features)

---

## 🚀 Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/crynxmartinez/aljinan.git
cd aljinan
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies from `package.json` and run `prisma generate` automatically.

### 3. Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tasheel"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Google Maps
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Sentry (Optional)
SENTRY_DSN="your-sentry-dsn"
```

### 4. Database Setup

**Option A: Local PostgreSQL**

```bash
# Create database
createdb tasheel

# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

**Option B: Vercel Postgres**

1. Create Vercel Postgres database
2. Copy connection string to `DATABASE_URL`
3. Run migrations:

```bash
npx prisma db push
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables Explained

### DATABASE_URL
PostgreSQL connection string. Format:
```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

### NEXTAUTH_SECRET
Random secret for NextAuth.js session encryption. Generate with:
```bash
openssl rand -base64 32
```

### NEXTAUTH_URL
Your application URL. Use `http://localhost:3000` for local development.

### BLOB_READ_WRITE_TOKEN
Vercel Blob Storage token for file uploads. Get from Vercel dashboard.

### GOOGLE_MAPS_API_KEY
Google Maps API key for geocoding and maps. Enable:
- Maps JavaScript API
- Geocoding API
- Places API

### UPSTASH_REDIS_REST_URL & TOKEN
Upstash Redis for rate limiting. Create free account at upstash.com.

### SENTRY_DSN
Sentry error tracking DSN (optional). Get from sentry.io.

---

## 🗄️ Database Management

### View Database

```bash
npx prisma studio
```

Opens Prisma Studio at http://localhost:5555

### Reset Database

```bash
npx prisma db push --force-reset
```

⚠️ **Warning:** This deletes all data!

### Migrations

```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy
```

### Seed Database (Optional)

Create `prisma/seed.ts` for sample data:

```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Add seed data here
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run seed:
```bash
npx prisma db seed
```

---

## 🎨 Development Tools

### TypeScript

```bash
# Type checking
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

### Linting

```bash
npm run lint
```

### Build

```bash
npm run build
```

### Production Server (Local)

```bash
npm run build
npm start
```

---

## 🔧 Configuration Files

### next.config.ts

Security headers, Sentry configuration, image domains.

### tailwind.config.ts

Tailwind CSS configuration, custom colors, plugins.

### tsconfig.json

TypeScript compiler options, path aliases.

### prisma.config.ts

Prisma client configuration.

### components.json

shadcn/ui configuration.

---

## 📦 Adding New Dependencies

```bash
# Production dependency
npm install package-name

# Dev dependency
npm install -D package-name
```

Always commit `package-lock.json` after installing packages.

---

## 🐛 Troubleshooting

### Port 3000 Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### Prisma Client Not Generated

```bash
npx prisma generate
```

### Database Connection Error

- Check `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall settings
- Verify SSL mode (`sslmode=require` for cloud databases)

### Module Not Found

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration
- [ ] User login
- [ ] Create client
- [ ] Add branch
- [ ] Create project
- [ ] Submit service request
- [ ] Create work order
- [ ] Upload files
- [ ] Generate certificate
- [ ] Create invoice
- [ ] Submit payment proof

### API Testing

Use tools like:
- **Postman** - API testing
- **Insomnia** - API testing
- **Thunder Client** - VS Code extension

---

## 📱 Mobile Testing

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device (iPhone, iPad, etc.)
4. Test responsive design

### Real Device Testing

1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Run dev server: `npm run dev`
3. Access from mobile: `http://[your-ip]:3000`
4. Ensure devices are on same network

---

## 🔐 Security Setup

### Password Requirements

Enforced in registration:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

### Rate Limiting

Configured in API routes using Upstash Redis:
- 100 requests per 15 minutes per IP
- Customize in `src/lib/rate-limit.ts`

### CORS

Configured in `next.config.ts` headers.

---

## 📚 Additional Setup

### Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project
3. Enable APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
4. Create API key
5. Restrict key to your domain
6. Add to `.env.local`

### Vercel Blob Setup

1. Go to Vercel dashboard
2. Select project
3. Go to Storage → Create Blob Store
4. Copy token
5. Add to `.env.local`

### Upstash Redis Setup

1. Go to [upstash.com](https://upstash.com)
2. Create account
3. Create Redis database
4. Copy REST URL and token
5. Add to `.env.local`

### Sentry Setup

1. Go to [sentry.io](https://sentry.io)
2. Create project
3. Copy DSN
4. Add to `.env.local`
5. Configure in `sentry.*.config.ts`

---

## 🚀 Ready to Deploy?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide.

---

**Last Updated:** March 2026
