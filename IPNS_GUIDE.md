# IPNS Integration Guide

## What is IPNS?

IPNS (InterPlanetary Name System) provides **mutable pointers** to immutable IPFS content. Think of it as a permanent "bookmark" that can be updated to point to different content over time.

### The Problem IPNS Solves

- **With IPFS alone:** Every time you update a form, you get a NEW CID
  - Share link: `https://myapp.com/forms/view/bafyabc123...`
  - Update form → NEW link: `https://myapp.com/forms/view/bafyxyz789...`
  - ❌ Old links break, users get confused

- **With IPNS:** You get ONE permanent name that updates
  - Share link: `https://myapp.com/forms/view/k51qzi5uqu5di...`
  - Update form → SAME link still works!
  - ✅ Links never break, always show latest version

## How It Works in Your App

### Creating a New Form with IPNS

```typescript
// 1. Upload form to IPFS
const cid = await uploadFormToIPFS(formMetadata);
// cid = "bafyabc123..."

// 2. Create IPNS name
const { name, nameObj } = await createIPNSName();
// name = "k51qzi5uqu5di..." (permanent address)

// 3. Publish CID to IPNS
await publishToIPNS(nameObj, cid);
// Now k51qzi5uqu5di... → bafyabc123...

// 4. Save the IPNS name and signing key
await saveIPNSKey(formId, nameObj);
saveIPNSMapping(formId, name);

// 5. Share the IPNS link
const shareLink = `https://yourapp.com/forms/view/${name}`;
// This link NEVER changes!
```

### Updating an Existing Form

```typescript
// 1. Upload updated form to IPFS (new CID)
const newCid = await uploadFormToIPFS(updatedFormMetadata);
// newCid = "bafyxyz789..."

// 2. Get the IPNS name object
const nameObj = await getIPNSNameObject(formId);

// 3. Update IPNS to point to new CID
await updateIPNS(nameObj, newCid);
// Now k51qzi5uqu5di... → bafyxyz789... (updated!)

// 4. Same share link still works!
// https://yourapp.com/forms/view/k51qzi5uqu5di...
// automatically shows the updated form
```

### Viewing a Form (CID or IPNS)

```typescript
// Works with both:
const formData1 = await getFormFromIPFS('bafyabc123...'); // Direct CID
const formData2 = await getFormFromIPFS('k51qzi5uqu5di...'); // IPNS name

// The function automatically detects and resolves IPNS names
```

## User Experience

### Before IPNS (CID only)

1. Create form → Get CID: `bafyabc123...`
2. Share link: `/forms/view/bafyabc123...`
3. Edit form → Get NEW CID: `bafyxyz789...`
4. ❌ Must share NEW link: `/forms/view/bafyxyz789...`
5. ❌ Old link shows old version
6. ❌ Confusing for users

### With IPNS

1. Create form → Get IPNS name: `k51qzi5uqu5di...`
2. Share link: `/forms/view/k51qzi5uqu5di...`
3. Edit form → IPNS updated automatically
4. ✅ SAME link now shows updated form
5. ✅ Users always see latest version
6. ✅ Simple and clean

## Implementation Details

### Data Storage

**localStorage keys:**
- `form-ipns-keys`: Stores signing keys (needed to update IPNS)
  ```json
  {
    "form-123": {
      "bytes": [1, 2, 3, ...],
      "toString": "k51qzi5uqu5di..."
    }
  }
  ```

- `form-ipns-mappings`: Maps form IDs to IPNS names
  ```json
  {
    "form-123": "k51qzi5uqu5di...",
    "form-456": "k51abc789xyz..."
  }
  ```

- `form-cid-mappings`: Still used for CID-only forms (backward compatibility)

### Security

- **Signing keys are stored locally** (in browser localStorage)
- **Keys are NEVER uploaded** to IPFS or any server
- **Only the person with the signing key** can update an IPNS name
- **If you lose the key**, you can't update that IPNS name (it's permanent)

⚠️ **Important:** In production, consider:
- Backing up signing keys securely
- Using encrypted storage
- Implementing key recovery mechanisms

### Performance

**IPNS Resolution:**
- First time: ~2-5 seconds (DNS-like lookup)
- Cached: <500ms (w3name service caches)
- Updates propagate: ~30 seconds globally

**Rate Limits:**
- w3name API: 30 requests per 10 seconds per IP
- Enough for normal usage
- Consider caching on your end for high-traffic forms

## API Reference

### Creating Names

```typescript
import { createIPNSName, publishToIPNS, saveIPNSKey, saveIPNSMapping } from '@/lib/ipns';

// Create new IPNS name
const { name, nameObj } = await createIPNSName();
console.log('IPNS name:', name); // k51qzi5uqu5di...

// Publish initial value
await publishToIPNS(nameObj, 'bafyabc123...');

// Save for later updates
await saveIPNSKey(formId, nameObj);
saveIPNSMapping(formId, name);
```

### Updating Names

```typescript
import { getIPNSNameObject, updateIPNS } from '@/lib/ipns';

// Load the name object
const nameObj = await getIPNSNameObject(formId);

// Update with new CID
await updateIPNS(nameObj, 'bafyxyz789...');
```

### Resolving Names

```typescript
import { resolveIPNS } from '@/lib/ipns';

// Resolve IPNS name to current CID
const cid = await resolveIPNS('k51qzi5uqu5di...');
console.log('Current CID:', cid); // bafyxyz789...
```

### Utility Functions

```typescript
import { isIPNSName, getIPNSShareLink, getIPNSGatewayLink } from '@/lib/ipns';

// Check if string is IPNS name
if (isIPNSName('k51qzi5uqu5di...')) {
  // It's an IPNS name
}

// Generate share link
const link = getIPNSShareLink('k51qzi5uqu5di...');
// https://yourapp.com/forms/view/k51qzi5uqu5di...

// Generate gateway link
const gatewayLink = getIPNSGatewayLink('k51qzi5uqu5di...');
// https://w3s.link/ipns/k51qzi5uqu5di...
```

## Integration into Your App

### 1. Form Creation (pages/forms/create.tsx)

```typescript
// After uploading to IPFS
const cid = await uploadFormToIPFS(formMetadata);

// Create and publish IPNS name
const { name, nameObj } = await createIPNSName();
await publishToIPNS(nameObj, cid);

// Save IPNS data
await saveIPNSKey(formId, nameObj);
saveIPNSMapping(formId, name);

// Redirect to IPNS link (not CID)
router.push(`/forms/view/${name}`);
```

### 2. Form Editing (pages/forms/[id]/edit.tsx)

```typescript
// After uploading updated form
const newCid = await uploadFormToIPFS(updatedFormMetadata);

// Check if form has IPNS name
const ipnsName = getIPNSName(formId);

if (ipnsName) {
  // Update existing IPNS
  const nameObj = await getIPNSNameObject(formId);
  await updateIPNS(nameObj, newCid);
  
  toast.success('Form updated! Same link still works.');
} else {
  // No IPNS, could create one now or just use new CID
  saveCIDMapping(formId, newCid);
  
  toast.info('Form updated with new link.');
}
```

### 3. Form Viewing (pages/forms/view/[cid]/index.tsx)

```typescript
// Works automatically! No changes needed.
// getFormFromIPFS() handles both CID and IPNS
const { cid } = router.query; // Could be CID or IPNS name
const formData = await getFormFromIPFS(cid as string);
```

### 4. Dashboard (pages/index.tsx)

```typescript
// Show IPNS name if available
const ipnsName = getIPNSName(form.id);
const displayLink = ipnsName || getCIDForForm(form.id);

// Badge to show it's IPNS
{ipnsName && (
  <Badge variant="secondary">
    <RefreshCw className="h-3 w-3 mr-1" />
    Updateable
  </Badge>
)}
```

## Migration Strategy

### Option 1: IPNS for All New Forms

- New forms: Use IPNS automatically
- Existing forms: Keep using CID
- Gradual migration

### Option 2: Migrate Existing Forms

- For each existing form:
  1. Create IPNS name
  2. Publish current CID
  3. Update share links
  4. Keep old CID links working

### Option 3: Let Users Choose

- Add toggle: "Make this form updateable"
- If enabled: Use IPNS
- If disabled: Use CID only
- Best for user control

## Troubleshooting

### "Failed to resolve IPNS name"

**Cause:** IPNS name not found or propagation delay

**Solutions:**
- Wait 30-60 seconds after publishing
- Check if name was published correctly
- Verify w3name service is accessible

### "IPNS resolution is slow"

**Cause:** First-time resolution or network issues

**Solutions:**
- Show loading state (expected 2-5 seconds)
- Cache resolved CIDs client-side
- Consider using CID directly if speed critical

### "Cannot update IPNS name"

**Cause:** Signing key not found

**Solutions:**
- Check localStorage for `form-ipns-keys`
- Verify formId is correct
- Signing keys are per-browser (backup needed)

### "Rate limit exceeded"

**Cause:** Too many requests to w3name API

**Solutions:**
- Implement client-side caching
- Throttle IPNS operations
- Consider batching updates

## Best Practices

### ✅ DO

- Use IPNS for forms that will be updated
- Cache resolved CIDs to reduce API calls
- Show loading states during resolution
- Backup signing keys securely
- Display "Updateable" badge for IPNS forms

### ❌ DON'T

- Use IPNS for static, never-changing forms (CID is faster)
- Store signing keys in version control
- Assume instant IPNS propagation
- Make too many resolve calls in a row
- Share or expose signing keys

## Future Enhancements

- **Key backup/recovery system**
- **Multi-device key sync** (encrypted cloud storage)
- **IPNS analytics** (track updates, views)
- **Automatic versioning** (keep history of all CIDs)
- **Team management** (shared signing keys)
- **Custom IPNS gateway** (faster resolution)

---

**Ready to implement?** Start with Option 1 (IPNS for new forms) - it's the easiest!
