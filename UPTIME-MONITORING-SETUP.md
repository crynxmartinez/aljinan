# Uptime Monitoring Setup Guide

## What This Does
Monitors your website 24/7 and alerts you within 1 minute if it goes down.

---

## Setup Instructions (5 minutes)

### Step 1: Create UptimeRobot Account
1. Go to: https://uptimerobot.com
2. Click "Sign Up Free"
3. Enter your email and create password
4. Verify your email

### Step 2: Add Your Website Monitor
1. Click "Add New Monitor"
2. Fill in:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Aljinan Production
   - **URL:** https://aljinan.vercel.app (or your custom domain)
   - **Monitoring Interval:** 5 minutes (free tier)
3. Click "Create Monitor"

### Step 3: Setup Alerts
1. Go to "My Settings" → "Alert Contacts"
2. Add your email:
   - Click "Add Alert Contact"
   - Select "E-mail"
   - Enter your email
   - Verify the email
3. Add SMS (optional, requires paid plan):
   - Select "SMS"
   - Enter your phone number
   - Verify with code

### Step 4: Configure Alert Preferences
1. Go back to your monitor
2. Click "Edit"
3. Under "Alert Contacts to Notify":
   - Select your email
   - Select your SMS (if added)
4. Save

---

## What You'll Get

**Alerts When:**
- ✅ Site goes down (within 1 minute)
- ✅ Site comes back up
- ✅ Site is slow (response time > threshold)

**Email Example:**
```
Subject: [DOWN] Aljinan Production is DOWN!

Your monitor "Aljinan Production" is DOWN!
URL: https://aljinan.vercel.app
Reason: Connection timeout
Down since: 2026-03-05 19:15:23 UTC
```

**Dashboard Shows:**
- Uptime percentage (e.g., 99.95%)
- Response time graphs
- Downtime history
- Status page (public or private)

---

## Free Tier Limits
- ✅ 50 monitors
- ✅ 5-minute check intervals
- ✅ Email alerts (unlimited)
- ❌ SMS alerts (paid only)
- ❌ 1-minute intervals (paid only)

**For your use case, free tier is perfect!**

---

## Optional: Public Status Page

Create a status page your clients can check:

1. Go to "Public Status Pages"
2. Click "Add New Status Page"
3. Select your monitor
4. Customize design
5. Get public URL (e.g., status.aljinan.com)
6. Share with clients

**Benefits:**
- Clients can check if site is down
- Reduces "is it down?" support tickets
- Professional appearance

---

## Recommended Settings

**For Production Site:**
```
Monitor Type: HTTP(s)
URL: https://aljinan.vercel.app
Interval: 5 minutes
Alert Contacts: Your email + SMS (if available)
Keyword Monitoring: Enabled (check for "Aljinan" text)
```

**For API Endpoint:**
```
Monitor Type: HTTP(s)
URL: https://aljinan.vercel.app/api/health
Interval: 5 minutes
Expected Status Code: 200
```

---

## Next Steps After Setup

1. ✅ Create monitor
2. ✅ Add alert contacts
3. ✅ Test by pausing monitor (should get alert)
4. ✅ Create status page (optional)
5. ✅ Add to your bookmarks

**Estimated Time:** 5-10 minutes  
**Cost:** Free forever

---

## Support

If you need help:
- UptimeRobot Docs: https://uptimerobot.com/help
- Support: support@uptimerobot.com
- Community: https://uptimerobot.com/community

---

**Once setup, you'll have peace of mind knowing you'll be alerted immediately if your site goes down!**
