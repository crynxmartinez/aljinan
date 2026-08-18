# Progressive Web App (PWA) Setup Guide

## What is PWA?

A Progressive Web App allows your web application to work like a native mobile app:
- Install to home screen
- Work offline (view cached data)
- Fast loading
- App-like experience
- Push notifications (future)

---

## Current Setup

### 1. Manifest File ✅
**Location:** `/public/manifest.json`

**What it does:**
- Defines app name, icons, colors
- Enables "Add to Home Screen"
- Sets display mode (standalone = no browser UI)
- Defines app shortcuts

**Configuration:**
```json
{
  "name": "Aljinan - Client Operations Platform",
  "short_name": "Aljinan",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0f172a",
  "icons": [...]
}
```

### 2. Metadata in Layout ✅
**Location:** `src/app/layout.tsx`

**What it does:**
- Links manifest file
- Sets theme color
- Configures Apple Web App settings
- Sets viewport for mobile

---

## How to Install PWA

### On Mobile (iOS/Android)

**iOS (Safari):**
1. Open https://aljinan.vercel.app in Safari
2. Tap Share button (box with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen

**Android (Chrome):**
1. Open https://aljinan.vercel.app in Chrome
2. Tap menu (three dots)
3. Tap "Add to Home Screen" or "Install App"
4. Tap "Install"
5. App icon appears on home screen

### On Desktop (Chrome/Edge)

1. Open https://aljinan.vercel.app
2. Look for install icon in address bar (⊕ or computer icon)
3. Click "Install"
4. App opens in standalone window
5. App appears in Start Menu/Applications

---

## Offline Capabilities

### What Works Offline

**Currently:**
- Previously loaded pages (browser cache)
- Static assets (CSS, JS, images)
- Basic navigation

**Limitations:**
- Cannot fetch new data from API
- Cannot submit forms
- Cannot upload files
- Cannot sync changes

### Future Enhancements

To add full offline support, we would need:

1. **Service Worker**
   - Cache API responses
   - Queue offline actions
   - Sync when back online

2. **IndexedDB**
   - Store data locally
   - Read/write while offline
   - Sync with server later

3. **Background Sync**
   - Auto-sync when connection restored
   - Retry failed requests
   - Update UI when synced

---

## Testing PWA

### Chrome DevTools

1. Open DevTools (F12)
2. Go to "Application" tab
3. Check:
   - **Manifest:** Should show all details
   - **Service Workers:** (None currently)
   - **Storage:** Check cache size
   - **Offline:** Toggle to test offline mode

### Lighthouse Audit

1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Progressive Web App"
4. Click "Generate report"
5. Review PWA score and recommendations

**Current Expected Score:** ~60-70%
- ✅ Has manifest
- ✅ Installable
- ✅ Mobile-friendly
- ❌ No service worker (offline support)
- ❌ No offline page

---

## Required Assets

### App Icons

You need to create these icon files in `/public/`:

**icon-192.png** (192x192 pixels)
- Used for home screen icon
- Used in app switcher

**icon-512.png** (512x512 pixels)
- Used for splash screen
- Used in app stores (future)

**Creating Icons:**
1. Design a square logo (512x512)
2. Use simple, recognizable design
3. Export as PNG
4. Create 192x192 version
5. Place in `/public/` folder

**Recommended Tools:**
- Figma (free)
- Canva (free)
- Adobe Illustrator
- Online icon generators

---

## Benefits

### For Users

**Mobile:**
- ✅ One-tap access from home screen
- ✅ Full-screen experience (no browser UI)
- ✅ Faster loading
- ✅ Feels like native app
- ✅ Works in poor connectivity

**Desktop:**
- ✅ Standalone window
- ✅ Appears in taskbar/dock
- ✅ Separate from browser tabs
- ✅ Professional appearance

### For Business

- ✅ Higher engagement (easier access)
- ✅ Better user retention
- ✅ Professional image
- ✅ Competitive advantage
- ✅ Lower development cost vs native apps
- ✅ Cross-platform (one codebase)

---

## Browser Support

### Excellent Support
- ✅ Chrome (Android & Desktop)
- ✅ Edge (Desktop)
- ✅ Samsung Internet
- ✅ Opera

### Good Support
- ✅ Safari (iOS 16.4+)
- ✅ Firefox (limited)

### Features by Browser

| Feature | Chrome | Safari | Firefox |
|---------|--------|--------|---------|
| Install | ✅ | ✅ | ❌ |
| Standalone | ✅ | ✅ | ❌ |
| Offline | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ (iOS 16.4+) | ✅ |
| Background Sync | ✅ | ❌ | ❌ |

---

## Next Steps

### Immediate (Done)
- ✅ Create manifest.json
- ✅ Add manifest to layout
- ✅ Configure metadata

### Short Term (To Do)
- [ ] Create app icons (192x192, 512x512)
- [ ] Test installation on mobile
- [ ] Test installation on desktop
- [ ] Run Lighthouse audit

### Long Term (Optional)
- [ ] Add service worker for offline support
- [ ] Implement background sync
- [ ] Add push notifications
- [ ] Create offline fallback page
- [ ] Cache API responses

---

## Troubleshooting

### "Add to Home Screen" not showing

**iOS:**
- Must use Safari (not Chrome)
- Must be HTTPS (production)
- Must have valid manifest

**Android:**
- Must use Chrome or Samsung Internet
- Must be HTTPS (production)
- Must meet PWA criteria

### App not installing

**Check:**
1. Manifest is accessible: `/manifest.json`
2. Icons exist in `/public/`
3. HTTPS is enabled (production)
4. No console errors
5. Lighthouse PWA score > 50%

### Icons not showing

**Check:**
1. Icon files exist in `/public/`
2. File names match manifest
3. File sizes are correct (192x192, 512x512)
4. Files are PNG format
5. Clear browser cache

---

## Resources

**Documentation:**
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev PWA](https://web.dev/progressive-web-apps/)
- [Next.js PWA](https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps)

**Tools:**
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Manifest Generator](https://app-manifest.firebaseapp.com/)

**Testing:**
- [PWA Testing Checklist](https://web.dev/pwa-checklist/)

---

## Summary

**What We've Done:**
- ✅ Created PWA manifest
- ✅ Configured app metadata
- ✅ Enabled installation
- ✅ Set up mobile optimization

**What Users Get:**
- ✅ Install to home screen
- ✅ App-like experience
- ✅ Faster loading
- ✅ Better mobile UX

**What's Next:**
- Create app icons
- Test installation
- Consider service worker for full offline support

---

**Last Updated:** March 5, 2026  
**Status:** Basic PWA setup complete, icons needed
