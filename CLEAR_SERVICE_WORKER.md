# Clear Service Worker Cache

## The Problem
The service worker has cached the old broken `vendor-emotion-CAe33Gzb.js` file. Even though we've fixed the code and rebuilt, the browser is serving the cached version.

## Solution: Clear Service Worker

### Method 1: DevTools (Recommended)
1. Open DevTools (F12)
2. Go to **Application** tab
3. In left sidebar, click **Service Workers**
4. Click **Unregister** next to the service worker
5. In left sidebar, click **Storage**
6. Click **Clear site data** button
7. Close and reopen the browser tab
8. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### Method 2: Manual Unregister via Console
1. Open DevTools Console (F12)
2. Paste and run:
```javascript
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
  console.log('Service workers unregistered');
  location.reload(true);
});
```

### Method 3: Incognito/Private Window
- Open in new incognito/private window (no service worker cache)

### Method 4: Different Port
If using `npm run preview` on port 4173, try:
```bash
# Stop current server
# Clear everything
rm -rf dist .vite node_modules/.cache
# Rebuild
npm run build
# Serve on different port
npx serve dist -p 4174
```

## Verification
After clearing, you should see:
- ✅ No console errors
- ✅ App loads correctly
- ✅ Recording glow works
- ✅ Video thumbnails display

## Why This Happened
The PWA service worker aggressively caches assets for offline use. When we fixed the Emotion import issue, the service worker was still serving the old cached file.

## Prevention
For development, you can disable service worker:
1. DevTools → Application → Service Workers
2. Check "Bypass for network"
3. Or use `npm run dev` instead of `npm run preview` (dev mode doesn't use service worker)
