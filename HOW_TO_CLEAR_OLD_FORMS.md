# How to Clear Old Forms

You're seeing the message "Old forms use a different architecture" because you have forms in localStorage from the previous contract deployment.

## Quick Fix: Clear Old Forms

### Option 1: Browser Console (Recommended)
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Paste this code and press Enter:

```javascript
// Clear old form-* entries
for (let i = localStorage.length - 1; i >= 0; i--) {
  const key = localStorage.key(i);
  if (key && key.includes('form-') && !key.includes('k51')) {
    console.log('Removing:', key);
    localStorage.removeItem(key);
  }
}
console.log('✅ Old forms cleared! Reload the page.');
```

### Option 2: Clear All localStorage (Nuclear Option)
1. Open DevTools
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Click "Local Storage" → Your domain
4. Click "Clear All"
5. Reload the page

⚠️ **Warning:** This will clear ALL local data, including your IPNS keys for NEW forms. Only use if you haven't created new forms yet.

### Option 3: Manual Cleanup
1. Open DevTools → Application → Local Storage
2. Look for keys starting with `form-123...` (old format)
3. Delete each one manually
4. Keep keys starting with `k51...` (new IPNS format)

## After Clearing

1. Reload the page
2. The warning message should disappear
3. You'll see a clean dashboard
4. Create new forms with the IPNS-first architecture!

## New Architecture Benefits

✅ **Single ID system** - No more confusion with duplicate IDs  
✅ **IPNS as primary ID** - Content-addressable, permanent  
✅ **Custom domains** - Register memorable URLs (0.01 ETH)  
✅ **Multi-device access** - Keys backed up on blockchain  
✅ **Revenue ready** - Monetize with custom domains  

## Create Your First IPNS Form

1. Click "Create New Form"
2. Fill in details
3. Save → Form gets IPNS ID (k51qzi5uqu...)
4. Optionally register custom domain
5. Share and collect responses!

---

**Contract Address:** `0x66764D39B593E677b6D18F1947253B21363EA737`  
**Network:** Status Network Testnet  
**Architecture:** IPNS-first + Custom Domains ✨
