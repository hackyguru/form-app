# Quick Fix: "Unexpected token '<', "<!DOCTYPE "..." is not valid JSON"

## What This Error Means

This error occurs when JavaScript tries to parse HTML as JSON. It happens when:
- The API returns an error page (HTML) instead of JSON
- The API route has a compile error
- Environment variables are missing or invalid

## Step 1: Check API Health

Visit: http://localhost:3000/api/storacha/health

**Expected:**
```json
{
  "status": "OK",
  "environment": {
    "hasStorachaKey": true,
    "hasStorachaProof": true,
    "storachaKeyLength": 90,
    "storachaProofLength": 1000+
  }
}
```

**If you see HTML or error:** Environment variables are missing or server has issues.

## Step 2: Test Delegation

Visit: http://localhost:3000/test-storacha

Click "Test Delegation API" button.

**Expected:**
```
Status: 200
Content-Type: application/json
Response: {"delegation":"..."}
```

**If you see HTML:** The delegation API is failing. Check terminal logs.

## Step 3: Check Terminal Logs

Look for errors in your terminal where `npm run dev` is running:

```bash
# Good - no errors
POST /api/storacha/delegation 200 in 171ms

# Bad - shows error
POST /api/storacha/delegation 500 in 50ms
Delegation creation error: ...
```

## Common Causes & Fixes

### Cause 1: Missing Environment Variables

**Symptom:** Health check shows `hasStorachaKey: false`

**Fix:**
```bash
# Check if .env.local exists
ls -la .env.local

# Should contain:
STORACHA_KEY=Mg...
STORACHA_PROOF=mAYIEALwW...

# Restart server
npm run dev
```

### Cause 2: Invalid STORACHA_PROOF

**Symptom:** Delegation API returns 500 error

**Fix:**
1. Make sure STORACHA_PROOF is ONE line (no breaks!)
2. Remove any spaces or newlines
3. Should be 1000+ characters long

### Cause 3: API Route Not Found

**Symptom:** 404 error or HTML page

**Fix:**
- Make sure file exists: `pages/api/storacha/delegation.ts`
- Restart dev server: `npm run dev`
- Clear `.next` folder: `rm -rf .next && npm run dev`

### Cause 4: Fetch Timing Issue

**Symptom:** Works sometimes, fails other times

**Fix:** Add retry logic:

```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Quick Debug Commands

```bash
# 1. Check if API route exists
ls -la pages/api/storacha/delegation.ts

# 2. Test API with curl
curl -X POST http://localhost:3000/api/storacha/delegation \
  -H "Content-Type: application/json" \
  -d '{"did":"did:key:z6MkrZ1r5d7z6B5m3k7D8q9w3x2y1a"}'

# 3. Check environment variables (names only)
grep STORACHA .env.local | cut -d= -f1

# 4. Restart with clean cache
rm -rf .next && npm run dev

# 5. Check server logs
# (Watch terminal while creating a form)
```

## Browser Console Debug

Open browser console (F12) and run:

```javascript
// Test fetch
fetch('/api/storacha/delegation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ did: 'did:key:z6MkrZ1r5d7z6B5m3k7D8q9w3x2y1a' })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
```

**If you see JSON:** API is working!
**If you see HTML:** API is returning an error page.

## Nuclear Option: Full Reset

If nothing works:

```bash
# 1. Stop server
# Press Ctrl+C in terminal

# 2. Clean everything
rm -rf .next
rm -rf node_modules/.cache

# 3. Restart
npm run dev

# 4. Test again
open http://localhost:3000/test-storacha
```

## Success Checklist

- [ ] Health check returns JSON with `status: "OK"`
- [ ] Environment variables show as `true` in health check
- [ ] Test page shows Status: 200 and JSON response
- [ ] Terminal shows `POST /api/storacha/delegation 200`
- [ ] No HTML in API responses
- [ ] Form upload works without errors

## Still Not Working?

1. **Share terminal output** - Copy last 20 lines from terminal
2. **Share browser console** - F12 → Console tab → screenshot
3. **Check .env.local** - Make sure variables are set (don't share values!)
4. **Try test page** - Visit `/test-storacha` and share results

---

**TIP:** The test page at `/test-storacha` is your friend! It shows exactly what the API returns.
