# Smart Contract Improvements for Form Management

## 🎯 **Problem: Local Deletion Doesn't Persist**

### **Before:**
- ❌ Forms stored permanently on blockchain (immutable)
- ❌ "Deletion" tracked in localStorage (`deleted-form-ids`)
- ❌ Clearing browser data loses deletion records
- ❌ Old forms reappear after reconnecting wallet
- ❌ No way to update/rotate encrypted keys

### **After:**
- ✅ Forms have `active` boolean field on-chain
- ✅ Can mark forms as inactive (soft delete) via blockchain
- ✅ Deletion persists across devices and browsers
- ✅ Can update encrypted keys for recovery
- ✅ Source of truth is blockchain, not localStorage

---

## 📝 **Smart Contract Changes**

### **1. Added `updateEncryptedKey` Function**

```solidity
/**
 * @dev Update encrypted IPNS key CID (only creator)
 * Useful for key rotation or recovery
 */
function updateEncryptedKey(string memory formId, string memory newEncryptedKeyCID) 
    external 
    onlyFormCreator(formId) 
{
    require(bytes(newEncryptedKeyCID).length > 0, "Invalid CID");
    forms[formId].encryptedKeyCID = newEncryptedKeyCID;
    emit EncryptedKeyUpdated(formId, newEncryptedKeyCID);
}
```

**Use Cases:**
- 🔄 Key rotation for security
- 🔧 Recovery from lost keys
- 🔐 Re-encrypt with new password/signature

### **2. Added `EncryptedKeyUpdated` Event**

```solidity
event EncryptedKeyUpdated(string indexed formId, string newEncryptedKeyCID);
```

**Benefits:**
- Track key updates over time
- Audit trail for security
- Can query historical keys if needed

### **3. Enhanced `setFormStatus` Function**

```solidity
/**
 * @dev Toggle form active status (only creator)
 * Use false to "delete" (archive) a form
 */
function setFormStatus(string memory formId, bool active) 
    external 
    onlyFormCreator(formId) 
{
    forms[formId].active = active;
    emit FormStatusChanged(formId, active);
}
```

**Usage:**
- `setFormStatus(formId, false)` → Soft delete (archive)
- `setFormStatus(formId, true)` → Reactivate form

---

## 🔧 **Frontend Changes**

### **1. Updated `getUserFormsFromBlockchain()`**

**Before:**
```typescript
// Just returned all forms from events
const forms = events.map(event => ({
  formId: event.args.formId,
  ipnsName: event.args.ipnsName,
  encryptedKeyCID: event.args.encryptedKeyCID,
}));
```

**After:**
```typescript
// Check active status on-chain for each form
const allForms = await Promise.all(events.map(async (event) => {
  const formId = event.args.formId;
  const formData = await contract.forms(formId); // Query blockchain
  
  return {
    formId,
    ipnsName: event.args.ipnsName,
    encryptedKeyCID: event.args.encryptedKeyCID,
    active: formData.active, // ← Check blockchain status
  };
}));

// Only return active forms
return allForms.filter(f => f.active && f.encryptedKeyCID);
```

### **2. Updated `checkRestoreStatus()`**

**Before:**
```typescript
// Filtered using localStorage deleted list
const { isFormDeleted } = await import('./form-storage');
const activeForms = forms.filter(f => !isFormDeleted(f.formId));
```

**After:**
```typescript
// Forms already filtered by blockchain status
const forms = await getUserFormsFromBlockchain(walletAddress);
// No need for local filtering - source of truth is blockchain!
```

### **3. Updated Delete Handler**

**Before:**
```typescript
const handleDeleteForm = async () => {
  deleteFormMetadata(formToDelete);
  deleteCIDMapping(formToDelete);
  await deleteIPNSKey(formToDelete);
  deleteIPNSMapping(formToDelete);
  markFormAsDeleted(formToDelete); // ← localStorage only
};
```

**After:**
```typescript
const handleDeleteForm = async () => {
  // Call smart contract to mark as inactive
  await setFormStatusOnChain(formToDelete, false);
  
  // Clean up local caches
  deleteFormMetadata(formToDelete);
  deleteCIDMapping(formToDelete);
  await deleteIPNSKey(formToDelete);
  deleteIPNSMapping(formToDelete);
};
```

---

## 🚀 **Benefits**

| Aspect | Before | After |
|--------|--------|-------|
| **Deletion persistence** | localStorage only | Blockchain (permanent) |
| **Multi-device sync** | Manual tracking | Automatic |
| **Key rotation** | Not possible | `updateEncryptedKey()` |
| **Clear browser data** | Loses deletions | No impact |
| **Source of truth** | Split (chain + local) | Blockchain only |
| **Audit trail** | None | Events logged |

---

## 📋 **Next Steps**

### **1. Deploy Updated Contract**

```bash
# Update contract address in .env.local
NEXT_PUBLIC_FORM_REGISTRY_ADDRESS=<new_address>
NEXT_PUBLIC_CONTRACT_DEPLOYMENT_BLOCK=<new_block>
```

### **2. Update Frontend API**

Need to create:
- `/pages/api/blockchain/set-form-status.ts` - Mark form as inactive
- `/pages/api/blockchain/update-encrypted-key.ts` - Rotate keys

### **3. Update Dashboard Delete Button**

**Implementation: User Signs Transaction**

```typescript
const handleDeleteForm = async () => {
  try {
    // Get user's wallet
    const wallet = wallets[0];
    const provider = await wallet.getEthereumProvider();
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    
    // Connect to contract
    const contract = new ethers.Contract(
      contractAddress, 
      FormRegistryABI, 
      signer
    );
    
    // User signs transaction directly (bypasses onlyFormCreator check)
    const tx = await contract.setFormStatus(formToDelete, false);
    toast.info("Transaction submitted...");
    await tx.wait();
    
    toast.success("Form deleted on blockchain");
    
    // Clean up local data
    deleteFormMetadata(formToDelete);
    deleteCIDMapping(formToDelete);
    await deleteIPNSKey(formToDelete);
    deleteIPNSMapping(formToDelete);
  } catch (error) {
    toast.error("Failed to delete form");
  }
};
```

**Why User Signs:**
- ✅ Smart contract has `onlyFormCreator` modifier
- ✅ Only form creator can change status
- ✅ User signature proves ownership
- ✅ No backend wallet needed for deletion
- ✅ More secure (no proxy permissions needed)

### **4. Add Key Rotation Feature**

```typescript
const handleRotateKey = async (formId: string) => {
  // Generate new encrypted key
  const newEncryptedKey = await encryptIPNSKeyForStorage(...);
  const newCID = await uploadJSONToIPFS(newEncryptedKey);
  
  // Update on blockchain
  await fetch('/api/blockchain/update-encrypted-key', {
    method: 'POST',
    body: JSON.stringify({ formId, encryptedKeyCID: newCID }),
  });
  
  toast.success("Key rotated successfully!");
};
```

---

## 🎯 **Migration Plan**

### **Option 1: Fresh Start (Recommended)**
1. Deploy new contract
2. Update `.env.local` with new address
3. Create fresh test forms
4. Old forms stay on old contract (ignored)

### **Option 2: Migration Script**
1. Deploy new contract
2. Query all forms from old contract
3. Re-register active forms on new contract
4. Update frontend to use new contract

---

## ✅ **Testing Checklist**

- [ ] Deploy updated contract to testnet
- [ ] Create form → Check `active` field is `true`
- [ ] Delete form → Call `setFormStatus(false)`
- [ ] Reload page → Verify deleted form doesn't appear
- [ ] Clear browser data → Deleted form still gone ✅
- [ ] Connect from different device → Deleted form still gone ✅
- [ ] Rotate key → Call `updateEncryptedKey()`
- [ ] Verify old key doesn't work, new key does
- [ ] Check events in block explorer

---

## 🎉 **Result**

**No more local deletion tracking!** The blockchain is now the single source of truth:
- ✅ Delete once, deleted everywhere
- ✅ Works across all devices
- ✅ Survives browser data clearing
- ✅ Can update/rotate keys
- ✅ Audit trail via events
- ✅ Simpler architecture

This is the proper decentralized way! 🚀
