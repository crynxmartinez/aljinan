# Tasheel - Deployment Guide

Production deployment guide for Vercel and other platforms.

---

## 🚀 Vercel Deployment (Recommended)

### Prerequisites

- Vercel account
- GitHub repository
- Environment variables ready

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub: `crynxmartinez/aljinan`
4. Select repository

### Step 2: Configure Project

**Framework Preset:** Next.js  
**Root Directory:** `./`  
**Build Command:** `npm run build`  
**Output Directory:** `.next`  
**Install Command:** `npm install`

### Step 3: Environment Variables

Add all variables from `.env.local`:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://tasheel.sa
BLOB_READ_WRITE_TOKEN=...
GOOGLE_MAPS_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
SENTRY_DSN=...
```

**Important:** Set `NEXTAUTH_URL` to your production domain!

### Step 4: Deploy

Click "Deploy" and wait ~2 minutes.

### Step 5: Custom Domain

1. Go to Project Settings → Domains
2. Add domain: `tasheel.sa` and `www.tasheel.sa`
3. Configure DNS:
   - Type: `A` Record
   - Name: `@`
   - Value: `76.76.21.21`
   
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

4. Wait for DNS propagation (~24 hours)

---

## 🗄️ Database Setup (Production)

### Vercel Postgres

1. Go to Vercel dashboard → Storage
2. Create Postgres database
3. Copy connection string
4. Add to environment variables as `DATABASE_URL`
5. Run migrations:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migrations
vercel env pull .env.production
npx prisma db push
```

### External PostgreSQL

Supported providers:
- **Neon** - Serverless Postgres
- **Supabase** - Open source Firebase alternative
- **Railway** - Infrastructure platform
- **AWS RDS** - Amazon managed database

Connection string format:
```
postgresql://user:password@host:port/database?sslmode=require
```

---

## 📁 File Storage Setup

### Vercel Blob Storage

1. Go to Vercel dashboard → Storage
2. Create Blob Store
3. Copy read/write token
4. Add to environment variables as `BLOB_READ_WRITE_TOKEN`

**Limits:**
- Free: 500MB storage, 1GB bandwidth/month
- Pro: 100GB storage, 1TB bandwidth/month

### Alternative: AWS S3

1. Create S3 bucket
2. Configure CORS
3. Create IAM user with S3 access
4. Add credentials to environment variables
5. Update file upload code to use S3 SDK

---

## 🔐 Environment Variables

### Production Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://tasheel.sa"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# Google Maps
GOOGLE_MAPS_API_KEY="AIza..."

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Sentry
SENTRY_DSN="https://..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="aljinan"
SENTRY_AUTH_TOKEN="..."

# Vercel Analytics (auto-configured)
# No manual setup needed
```

### Managing Environment Variables

**Via Vercel Dashboard:**
1. Project Settings → Environment Variables
2. Add/edit variables
3. Select environments (Production, Preview, Development)
4. Save

**Via Vercel CLI:**
```bash
# Add variable
vercel env add VARIABLE_NAME

# Pull variables to local
vercel env pull .env.production

# List variables
vercel env ls
```

---

## 🔄 Continuous Deployment

### Auto-Deploy from GitHub

**Main Branch (Production):**
- Push to `main` → Auto-deploy to production
- URL: `https://tasheel.sa`

**Feature Branches (Preview):**
- Push to any branch → Auto-deploy preview
- URL: `https://aljinan-[branch]-[hash].vercel.app`

**Pull Requests:**
- Open PR → Auto-deploy preview
- Comment with preview URL

### Manual Deployment

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

---

## 🔍 Monitoring & Analytics

### Vercel Analytics

Auto-enabled for all deployments. View in Vercel dashboard.

**Metrics:**
- Page views
- Unique visitors
- Top pages
- Devices and browsers
- Geographic distribution

### Vercel Speed Insights

Auto-enabled. Tracks:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)
- Time to First Byte (TTFB)

### Sentry Error Tracking

Configured in `sentry.*.config.ts`.

**Features:**
- Error tracking
- Performance monitoring
- Release tracking
- User feedback

**View errors:**
1. Go to [sentry.io](https://sentry.io)
2. Select project
3. View issues and performance

---

## 🚨 Troubleshooting Deployment

### Build Failures

**Check build logs:**
1. Vercel dashboard → Deployments
2. Click failed deployment
3. View build logs

**Common issues:**
- Missing environment variables
- TypeScript errors
- Prisma client not generated
- Module not found

**Solutions:**
```bash
# Ensure Prisma generates client
# Add to package.json scripts:
"postinstall": "prisma generate"

# Clear build cache
vercel --force

# Check environment variables
vercel env ls
```

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Check SSL mode (`?sslmode=require`)
- Ensure database allows connections from Vercel IPs
- Check connection pooling settings

### File Upload Errors

- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check Vercel Blob storage limits
- Ensure file size limits are configured

### 404 Errors

- Check `next.config.ts` redirects
- Verify dynamic routes are correct
- Check `app/` directory structure

---

## 🔒 Security Checklist

### Pre-Deployment

- [ ] All environment variables set
- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] `NEXTAUTH_URL` points to production domain
- [ ] Database has strong password
- [ ] API keys are restricted to production domain
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Post-Deployment

- [ ] Test user registration and login
- [ ] Test file uploads
- [ ] Test database connections
- [ ] Test API routes
- [ ] Check error tracking (Sentry)
- [ ] Verify SSL certificate
- [ ] Test on mobile devices
- [ ] Run security audit

---

## 📊 Performance Optimization

### Vercel Edge Network

Auto-configured. Your app is served from 100+ edge locations worldwide.

### Image Optimization

Next.js Image component auto-optimizes images:
- WebP format
- Responsive sizes
- Lazy loading
- Blur placeholder

### Caching

**Static Pages:**
- Cached at edge
- Revalidated on rebuild

**API Routes:**
- Configure cache headers
- Use Redis for data caching

### Database Optimization

- Use connection pooling
- Add database indexes (already configured in schema)
- Use Prisma query optimization

---

## 🔄 Updates & Maintenance

### Deploying Updates

1. Make changes locally
2. Test thoroughly
3. Commit to Git
4. Push to `main` branch
5. Auto-deploys to production

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Deploy migration to production
vercel env pull .env.production
npx prisma migrate deploy
```

### Rollback Deployment

1. Go to Vercel dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

## 📈 Scaling

### Vercel Pro Plan

Upgrade for:
- Unlimited team members
- Advanced analytics
- Priority support
- Higher limits

### Database Scaling

**Vertical Scaling:**
- Upgrade database plan
- More CPU, RAM, storage

**Horizontal Scaling:**
- Read replicas
- Connection pooling
- Caching layer (Redis)

### File Storage Scaling

- Upgrade Vercel Blob plan
- Or migrate to AWS S3/Cloudflare R2

---

## 🌍 Multi-Region Deployment

Vercel automatically deploys to multiple regions.

**Edge Functions:**
- Run at edge locations
- Faster response times
- Lower latency

**Database:**
- Use multi-region database (Neon, PlanetScale)
- Or use read replicas

---

## 📞 Support

### Vercel Support

- **Free:** Community support (Discord, GitHub)
- **Pro:** Email support
- **Enterprise:** Dedicated support

### Deployment Issues

1. Check Vercel status: [vercel-status.com](https://vercel-status.com)
2. Search Vercel docs: [vercel.com/docs](https://vercel.com/docs)
3. Ask in Vercel Discord
4. Contact support

---

## ✅ Post-Deployment Checklist

- [ ] Production deployment successful
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] Database connected
- [ ] File uploads working
- [ ] User registration working
- [ ] Login working
- [ ] All features tested
- [ ] Error tracking configured
- [ ] Analytics enabled
- [ ] Performance optimized
- [ ] Security headers verified
- [ ] Monitoring set up

---

**Production URL:** https://tasheel.sa  
**Deployment Platform:** Vercel  
**Last Updated:** March 2026
