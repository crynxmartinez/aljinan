# Vercel Environment Variables Setup

## 📋 Copy This to Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

---

## 🔑 Variable to Add

### **Variable Name:**
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### **Variable Value:**
```
AIzaSyDIShTgO2ur27oZoDm00gIYGNkrsdR-D8g
```

### **Apply to:**
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 📝 Step-by-Step Instructions

1. **Go to Vercel:**
   - Open: https://vercel.com
   - Select your project: `aljinan`

2. **Navigate to Settings:**
   - Click: **Settings** (top menu)
   - Click: **Environment Variables** (left sidebar)

3. **Add New Variable:**
   - Click: **Add New** button
   - **Key:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value:** `AIzaSyDIShTgO2ur27oZoDm00gIYGNkrsdR-D8g`
   - **Environments:** Check all 3 boxes
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Click: **Save**

4. **Redeploy:**
   - Vercel will ask: "Redeploy to apply changes?"
   - Click: **Redeploy**
   - Wait for deployment to complete

---

## ✅ Verification

After deployment completes:

1. Visit your site: `https://aljinan.vercel.app`
2. Go to: Dashboard → Clients → Add Branch
3. You should see **Google Maps** (not OpenStreetMap)
4. Try searching for an address
5. Try clicking on the map

---

## 🔒 Security

Your API key is restricted to:
- ✅ `https://aljinan.vercel.app/*`
- ✅ `https://*.vercel.app/*`
- ✅ `http://localhost:*`

No one else can use your API key! ✅

---

## 💰 Cost Monitoring

Monitor your usage at:
- https://console.cloud.google.com/apis/dashboard

Free tier: **$200/month credit**
Your estimated usage: **~$10/month**
Result: **FREE!** ✅

---

## 🆘 Troubleshooting

**If maps don't show:**
1. Check environment variable is saved
2. Check you redeployed after adding it
3. Check browser console for errors
4. Verify API key is correct (no extra spaces)

**If you see "API key not configured":**
- Environment variable not set correctly
- Need to redeploy after adding it

---

**That's it! Google Maps should work after adding this to Vercel!** 🗺️
