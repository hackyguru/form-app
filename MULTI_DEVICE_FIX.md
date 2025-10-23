# Multi-Device Access Fix Summary

## Issue
When creating a form, the encrypted IPNS key backup was failing with error:
```
failed space/blob/add invocation
lib/storacha.ts (86:26) @ async uploadFormToIPFS
```

## Root Cause
The form creation flow was creating a new Storacha client instance specifically for uploading the encrypted key, but this new instance wasn't properly initialized with UCAN delegation from the backend. This caused the `space/blob/add` invocation to fail because the client didn't have permission to write to the IPFS space.

## Solution
Created a reusable `uploadJSONToIPFS()` function in `/lib/storacha.ts` that properly initializes the Storacha client with delegation, just like the form metadata upload does.

### Changes Made:

**1. Added `uploadJSONToIPFS()` function to `/lib/storacha.ts`:**
```typescript
export async function uploadJSONToIPFS(
  jsonString: string, 
  filename: string = 'data.json'
): Promise<string>
```
- Accepts any JSON string and filename
- Properly initializes Storacha client with delegation
- Returns directory CID
- Reusable for any JSON upload needs

**2. Updated form creation in `/pages/forms/create.tsx`:**
```typescript
// Before (BROKEN):
const client = await createStorachaClient();
const blob = new Blob([encryptedKeyJson], { type: 'application/json' });
const file = new File([blob], 'encrypted-key.json', { type: 'application/json' });
const keyCID = await client.uploadDirectory([file]);

// After (FIXED):
const keyCID = await uploadJSONToIPFS(encryptedKeyJson, 'encrypted-key.json');
```

## Why This Works

The `uploadJSONToIPFS()` function internally calls `createStorachaClient()` which:
1. Creates a new Storacha client
2. Fetches UCAN delegation from `/api/storacha/delegation`
3. Extracts and validates the delegation
4. Adds the delegated space to the client
5. Sets the current space for uploads

This ensures every upload has proper permissions, preventing the "failed space/blob/add invocation" error.

## Testing

To verify the fix works:
1. Start the dev server: `npm run dev`
2. Login with your wallet
3. Create a new form (this will trigger encrypted key backup)
4. Check console for: `✅ Encrypted IPNS key backed up to IPFS: bafyxxx...`
5. Check Status Network explorer for the transaction
6. Verify `encryptedKeyCID` is stored in the contract

## Benefits

✅ **Consistent**: All IPFS uploads now use the same delegation mechanism  
✅ **Reliable**: Proper error handling and delegation validation  
✅ **Reusable**: `uploadJSONToIPFS()` can be used for future JSON uploads  
✅ **Debuggable**: Clear console logs for each step  

## Related Files

- `/lib/storacha.ts` - Added `uploadJSONToIPFS()` function
- `/pages/forms/create.tsx` - Updated to use new function
- `/lib/crypto-utils.ts` - Encryption utilities (unchanged)
- `/lib/ipns-restore.ts` - Key restoration utilities (unchanged)
- `/contracts/FormRegistry.sol` - Smart contract with `encryptedKeyCID` field
