# Fresh Preview (No Cache)

The preview server is serving cached files. Here's how to get a fresh preview:

## Option 1: Use Different Port (Recommended)
```bash
npm run preview -- --port 4175
```
Then open: http://localhost:4175

This uses a different port so your browser won't have cached files.

## Option 2: Use the Fresh Script
```bash
./preview-fresh.sh
```
This automatically uses port 4175.

## Option 3: Use Dev Server (No Cache)
```bash
npm run dev
```
Then open: http://localhost:3000

Dev server doesn't use service workers or aggressive caching.

## Option 4: Clear Browser for Port 4173
If you must use port 4173:

1. Open http://localhost:4173
2. Open DevTools (F12)
3. Application tab → Storage → Clear site data
4. Application tab → Service Workers → Unregister
5. Hard refresh: Ctrl+Shift+R

## Verify New Build
Check that you're loading the NEW files:
- DevTools → Network tab
- Look for: `vendor-emotion-DRN_afij.js` (NEW)
- NOT: `vendor-emotion-CAe33Gzb.js` (OLD)

## Current Build Info
- Emotion chunk: `vendor-emotion-DRN_afij.js`
- Index: `index-Ckr5wpOv.js`
- Built: Dec 5, 2025 15:40
- Size: 873.10 KB
