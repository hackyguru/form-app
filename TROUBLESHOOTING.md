# Troubleshooting Guide

## Common Storacha/IPFS Errors

### Error: "failed space/index/add invocation"

**What it means:**
This error occurs when the Storacha client tries to upload but doesn't have the correct capabilities or the space isn't properly configured.

**What I fixed:**
1. ✅ Changed `uploadFile()` to `uploadDirectory()` - More reliable for single files
2. ✅ Simplified delegation capabilities to `['store/add', 'upload/add']` - These are the essential permissions
3. ✅ Added better error messages with details

**Why it happened:**
- The old code used `['space/blob/add', 'space/index/add', 'filecoin/offer', 'upload/add']` which required more specific space configuration
- The `uploadFile()` method sometimes needs additional setup that `uploadDirectory()` handles automatically

**Solution applied:**
- Now using `uploadDirectory([file])` which is more robust
- Simplified permissions to just what's needed for uploads
- The directory CID contains your JSON file

---

## Error: "Delegation creation error: SyntaxError: Non-base64pad character"

**What it means:**
The `STORACHA_PROOF` in your `.env.local` file contains invalid characters or formatting.

**How to fix:**
1. Regenerate your proof:
   ```bash
   storacha delegation create did:key:YOUR_SPACE_DID --can 'store/add' --can 'upload/add' --base64
   ```

2. Copy the ENTIRE base64 string (no line breaks!)

3. Paste into `.env.local`:
   ```bash
   STORACHA_PROOF=uOqJlcm9vdHO...
   ```

4. Restart dev server:
   ```bash
   npm run dev
   ```

---

## Error: "Failed to get delegation from backend"

**What it means:**
The frontend couldn't reach the backend API or the API returned an error.

**Checklist:**
- [ ] Is dev server running? (`npm run dev`)
- [ ] Is API route working? (Check browser console)
- [ ] Are env variables set in `.env.local`?
- [ ] Did you restart after changing `.env.local`?

**Test your API:**
```bash
curl -X POST http://localhost:3000/api/storacha/delegation \
  -H "Content-Type: application/json" \
  -d '{"did":"did:key:z6MkrZ1r5d7z6B5m3k7D8q9w3x2y1a"}'
```

Should return: `{"delegation":"..."}`

---

## Error: "Failed to extract delegation"

**What it means:**
The delegation data is corrupted or invalid.

**How to fix:**
1. Check that `STORACHA_PROOF` is a valid base64 string
2. Make sure there are no line breaks in the proof
3. Regenerate the proof if needed:
   ```bash
   storacha delegation create YOUR_SPACE_DID \
     --can 'store/add' \
     --can 'upload/add' \
     --base64 > proof.txt
   ```

4. Copy from `proof.txt` to `.env.local`

---

## Error: "Space not found"

**What it means:**
The Storacha space specified in your proof doesn't exist or isn't accessible.

**How to fix:**
1. List your spaces:
   ```bash
   storacha space ls
   ```

2. Use the correct space:
   ```bash
   storacha space use YOUR_SPACE_DID
   ```

3. Regenerate credentials from this space

---

## Testing Your Setup

### 1. Test Backend API

```bash
# Test delegation endpoint
curl -X POST http://localhost:3000/api/storacha/delegation \
  -H "Content-Type: application/json" \
  -d '{"did":"did:key:z6MkrZ1r5d7z6B5m3k7D8q9w3x2y1a"}' | jq
```

Expected output:
```json
{
  "delegation": "base64_string_here..."
}
```

### 2. Test Upload

1. Go to http://localhost:3000/forms/create
2. Create a simple form
3. Click "Save Form"
4. Watch browser console for:
   ```
   Uploading form to IPFS...
   Form uploaded to IPFS: bafybeig...
   ```

5. Should redirect to `/forms/view/{cid}`

### 3. Test Retrieval

Visit the CID directly:
```
http://localhost:3000/forms/view/bafybeig...
```

Or via IPFS gateway:
```
https://w3s.link/ipfs/bafybeig...
```

---

## Verification Commands

### Check Environment Variables

```bash
# Check if .env.local exists
ls -la .env.local

# Show env var names (not values!)
grep -E "^STORACHA" .env.local | cut -d= -f1
```

Should show:
```
STORACHA_KEY
STORACHA_PROOF
```

### Check Storacha CLI

```bash
# Check if installed
which storacha

# Check current space
storacha space ls

# Check whoami
storacha whoami
```

### Check Node Modules

```bash
# Check if Storacha client is installed
ls node_modules/@storacha/client

# Check version
npm list @storacha/client
```

---

## Environment Variable Format

### STORACHA_KEY

Format: Base64 string starting with `Mg`

Example:
```bash
STORACHA_KEY=MgCZ3dJwOWhCrq8RNZwzlJQ6x1JCsXakGVK6GRrzIjS0Cs+0Bawu70SN2MFNq/A2XAiJgb42q1+QN3QXhSavOIqIVogU=
```

Length: ~90 characters

### STORACHA_PROOF

Format: Base64 encoded delegation (very long!)

Example:
```bash
STORACHA_PROOF=mAYIEALwWOqJlcm9v...
```

Length: 1000+ characters (this is normal!)

**Important:** 
- NO line breaks
- NO spaces
- Single line only
- Must be valid base64

---

## Common Mistakes

### ❌ Line Breaks in STORACHA_PROOF

**Wrong:**
```bash
STORACHA_PROOF=mAYIEALwWOqJlcm9v
dHOB2CpYJQABcRIgZHr31jag
KEPQeqP/rOCLyHWLLLBfMat
```

**Correct:**
```bash
STORACHA_PROOF=mAYIEALwWOqJlcm9vdHOB2CpYJQABcRIgZHr31jagKEPQeqP/rOCLyHWLLLBfMat...
```

### ❌ Wrong Capabilities in Delegation

**Wrong:**
```bash
storacha delegation create YOUR_DID --can 'space/*'
```

**Correct:**
```bash
storacha delegation create YOUR_DID --can 'store/add' --can 'upload/add'
```

### ❌ Forgetting to Restart Server

After changing `.env.local`:
```bash
# Kill old server
lsof -ti:3000 | xargs kill -9

# Start fresh
npm run dev
```

### ❌ Using Space DID Instead of Agent DID

**Wrong:**
```typescript
const delegation = await client.createDelegation(
  'did:web:staging.web3.storage', // Space DID - wrong!
  ['upload/add']
);
```

**Correct:**
```typescript
const delegation = await client.createDelegation(
  'did:key:z6MkrZ...', // Agent DID - correct!
  ['upload/add']
);
```

---

## Debug Mode

Enable verbose logging:

```typescript
// lib/storacha.ts
export async function uploadFormToIPFS(formMetadata: FormMetadata): Promise<string> {
  try {
    console.log('Starting upload...', {
      formId: formMetadata.id,
      title: formMetadata.title
    });
    
    const client = await createStorachaClient();
    console.log('Client created, space:', await client.currentSpace());

    const jsonString = JSON.stringify(formMetadata, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], `${formMetadata.id}.json`, { type: 'application/json' });
    
    console.log('Uploading file:', file.name, file.size, 'bytes');

    const directoryCid = await client.uploadDirectory([file]);
    console.log('Upload successful! CID:', directoryCid.toString());

    return directoryCid.toString();
  } catch (error) {
    console.error('Upload failed:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
```

---

## Getting Help

### Check Logs

**Browser Console:**
- Right-click → Inspect → Console tab
- Look for red errors
- Check network tab for failed API calls

**Terminal:**
- Watch server output while testing
- Look for "Delegation creation error"
- Check for stack traces

### Report Issues

When asking for help, include:

1. **Error message** (exact text)
2. **Browser console** (screenshot)
3. **Server logs** (from terminal)
4. **Environment check:**
   ```bash
   node --version
   npm --version
   storacha --version
   ```
5. **What you tried** (steps to reproduce)

---

## Advanced: Regenerate Everything

If nothing works, start fresh:

```bash
# 1. Delete old credentials
rm -rf ~/.storacha

# 2. Reinstall CLI
npm install -g @storacha/cli@latest

# 3. Login
storacha login YOUR_EMAIL

# 4. Create new space
storacha space create my-new-space

# 5. Create new agent key
storacha key create --json > agent.json
cat agent.json

# 6. Create delegation
export SPACE_DID=$(storacha space ls --json | jq -r '.[0].did')
storacha delegation create $SPACE_DID \
  --can 'store/add' \
  --can 'upload/add' \
  --base64 > proof.txt

# 7. Update .env.local
echo "STORACHA_KEY=$(cat agent.json | jq -r '.key')" > .env.local
echo "STORACHA_PROOF=$(cat proof.txt)" >> .env.local

# 8. Restart
npm run dev
```

---

## Success Indicators

✅ Server starts without errors
✅ No "Delegation creation error" in logs
✅ Form creation works
✅ Console shows "Form uploaded to IPFS: bafybeig..."
✅ Redirect to `/forms/view/{cid}` works
✅ Form displays from IPFS
✅ Share dialog shows "✓ Stored on IPFS"

---

## Performance Tips

### 1. Upload Speed

Typical upload times:
- Small form (1KB): ~500ms
- Medium form (10KB): ~1s
- Large form (100KB): ~3s

If slower:
- Check internet connection
- Try different time of day
- Check Storacha status: https://status.web3.storage

### 2. Retrieval Speed

First load: 1-5 seconds (IPFS network lookup)
Cached: <500ms (CDN cached)

### 3. Gateway Alternatives

If `w3s.link` is slow, try:
- `https://dweb.link/ipfs/{cid}`
- `https://ipfs.io/ipfs/{cid}`
- `https://cloudflare-ipfs.com/ipfs/{cid}`

Change in `lib/storacha.ts`:
```typescript
export const IPFS_GATEWAY = 'https://dweb.link/ipfs/';
```

---

## Security Checklist

- [ ] `.env.local` in `.gitignore`
- [ ] Never commit `STORACHA_KEY` or `STORACHA_PROOF`
- [ ] Use environment variables in Vercel
- [ ] Rotate keys every 3-6 months
- [ ] Monitor usage in Storacha dashboard
- [ ] Set up rate limiting for production
- [ ] Use HTTPS only in production
- [ ] Validate form data before upload

---

**Need more help?** Check the official docs:
- Storacha: https://docs.storacha.network
- IPFS: https://docs.ipfs.tech
- Next.js: https://nextjs.org/docs
