# Storacha Upload Issue - Debugging Guide

## Error: "failed space/blob/add invocation"

This error occurs when the Storacha client doesn't have proper permissions to upload files.

## Changes Made to Fix

### 1. Updated Delegation Capabilities (`/pages/api/storacha/delegation.ts`)

Added all necessary capabilities to the delegation:
```typescript
[
  'space/blob/add',      // ← THIS IS THE KEY ONE!
  'space/index/add',
  'filecoin/offer',
  'upload/add',
  'store/add',
  'store/list',
  'store/remove',
  'upload/list',
  'upload/remove'
]
```

### 2. Enhanced Logging (`/lib/storacha.ts`)

Added detailed console logs to trace the upload process:
- Client creation with DID
- Delegation size
- Space configuration
- Upload progress
- Detailed error information

## How to Test

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12 or Cmd+Option+I)

3. **Try to create a form**

4. **Look for these logs in the console:**
   ```
   🚀 Starting form upload to IPFS...
   Created Storacha client with DID: did:key:z6Mk...
   Received delegation, size: XXXX bytes
   Delegation extracted successfully
   Space configured: did:key:z6Mk...
   ✅ Storacha client ready for uploads
   📦 Created file: form-meta.json Size: XXX bytes
   ⬆️  Uploading to Storacha...
   ✅ Form uploaded to IPFS: bafyxxx...
   ```

## If It Still Fails

### Check 1: Verify Environment Variables
Make sure these are set in `.env.local`:
```bash
STORACHA_KEY=MgCZ3dJwOWhCrq8RNZwzlJQ6x1JCsXakGVK6GRrzIjS0Cs+0Bawu70SN2MFNq/A2XAiJgb42q1+QN3QXhSavOIqIVogU=
STORACHA_PROOF=mAYIEALwWOqJlcm9vdHOB2CpYJQABcRIgZHr31jagKEPQeqP/rOCLyHWLLLBfMatfraar2GcIy15ndmVyc2lvbgH...
```

### Check 2: Look at Error Details
The enhanced logging will show:
- **Error message**: What went wrong
- **Error stack**: Where it failed
- **Delegation info**: If delegation was created/extracted properly

### Check 3: Verify Delegation API
Test the delegation endpoint directly:
```bash
curl -X POST http://localhost:3000/api/storacha/delegation \
  -H "Content-Type: application/json" \
  -d '{"did":"did:key:z6MkfUUfYZSPC8xNRdQoK2d2J4aeARE2XLTJt7dZ7hPqPcBo"}'
```

Should return:
```json
{"delegation":"mAYI...base64..."}
```

### Check 4: Test with Simple Form
Create the simplest possible form:
- Title: "Test"
- One text field
- Click save

This isolates whether the issue is with:
- The upload mechanism ✅
- The encryption process ❌
- The blockchain registration ❌

## Common Solutions

### Solution 1: Restart Dev Server
Sometimes the delegation needs a fresh start:
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Solution 2: Clear Browser Cache
Old delegations might be cached:
- Open DevTools → Application → Clear Storage
- Refresh page
- Try again

### Solution 3: Regenerate Storacha Credentials
If the STORACHA_KEY or STORACHA_PROOF are invalid:
1. Go to https://console.web3.storage
2. Create new space
3. Get new credentials
4. Update `.env.local`
5. Restart server

## What to Report

If the issue persists, provide:
1. **Full console log** from browser (all the emoji logs)
2. **Network tab** showing `/api/storacha/delegation` request/response
3. **Error message** from the catch block
4. **Environment**: Browser, OS, Node version

## Architecture Reminder

```
Form Creation
    ↓
Create Form Metadata
    ↓
uploadFormToIPFS() ← YOU ARE HERE
    ↓
createStorachaClient()
    ↓
GET /api/storacha/delegation
    ↓
Receive delegation with permissions
    ↓
client.uploadDirectory([file])
    ↓
SUCCESS → Get CID
```

The error happens at `client.uploadDirectory([file])` which means:
- ✅ Client was created
- ✅ Delegation was fetched
- ❌ Upload permission is missing or invalid

The fix added `'space/blob/add'` to the delegation capabilities, which should resolve this.
