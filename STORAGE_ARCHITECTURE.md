# 🗄️ Storage Architecture Guide

## Overview

Our form application uses a **hybrid storage architecture** combining IPFS (decentralized) and localStorage (local browser storage) for different purposes.

---

## 🌐 IPFS Storage (Storacha)

### What We Store on IPFS
**Form Content (Complete Form Metadata)**
- All form data stored as `form-meta.json` files
- Each form gets a unique CID (Content Identifier)
- Forms are immutable once uploaded (new edit = new CID)

### Structure on IPFS
```json
{
  "id": "form-1729685123456",
  "title": "Customer Feedback Form",
  "description": "Collect customer satisfaction data",
  "status": "active",
  "fields": [
    {
      "id": "field-1",
      "type": "text",
      "label": "Name",
      "required": true,
      "placeholder": "Enter your name"
    },
    {
      "id": "field-2",
      "type": "email",
      "label": "Email",
      "required": true
    }
    // ... more fields
  ],
  "createdAt": "2025-10-23T10:30:00.000Z",
  "updatedAt": "2025-10-23T10:30:00.000Z"
}
```

### Upload Process
```typescript
// 1. Create JSON blob
const jsonString = JSON.stringify(formMetadata, null, 2);
const blob = new Blob([jsonString], { type: 'application/json' });
const file = new File([blob], 'form-meta.json');

// 2. Upload to Storacha (returns CID)
const cid = await client.uploadDirectory([file]);

// Result: bafybeiabc123... (CID)
// Access: https://w3s.link/ipfs/bafybeiabc123.../form-meta.json
```

### Why IPFS for Form Content?
✅ **Decentralized** - No single point of failure  
✅ **Immutable** - Content can't be changed (integrity)  
✅ **Permanent** - Content persists on IPFS network  
✅ **Shareable** - Anyone can access via CID  
✅ **Verifiable** - CID proves content authenticity  

---

## 💾 localStorage Storage (Browser)

### What We Store Locally

#### 1. **Form Metadata Cache** (Backup/Fallback)
**Key:** `form-meta-{formId}`  
**Purpose:** Quick local access, offline capability, backup

```typescript
localStorage.setItem('form-meta-form-123', JSON.stringify(formMetadata));
```

**Why?**
- ⚡ Instant loading (no IPFS fetch needed)
- 🔌 Works offline
- 🛡️ Backup if IPFS unavailable

---

#### 2. **Form IDs List**
**Key:** `form-ids`  
**Value:** `["form-1729685123456", "form-1729685234567", ...]`  
**Purpose:** Track all forms created by user

```typescript
localStorage.setItem('form-ids', JSON.stringify([
  'form-1729685123456',
  'form-1729685234567'
]));
```

**Why?**
- 📋 Quick dashboard loading
- 🔍 Know which forms exist locally
- 🗂️ Maintain form list without API calls

---

#### 3. **CID Mappings** (Form ID → IPFS CID)
**Key:** `form-cid-mappings`  
**Structure:**
```json
{
  "form-1729685123456": "bafybeiabc123def456...",
  "form-1729685234567": "bafybeighi789jkl012...",
  "form-1729685345678": "bafybeimno345pqr678..."
}
```

**Purpose:** Link form IDs to their IPFS CIDs

```typescript
saveCIDMapping('form-123', 'bafybeiabc123...');
// Later: const cid = getCIDForForm('form-123');
```

**Why?**
- 🔗 Connect local IDs to IPFS content
- 📍 Know where to fetch form from IPFS
- 🚀 Avoid storing CID in form metadata itself

---

#### 4. **IPNS Names** (Form ID → IPNS Address)
**Key:** `form-ipns-mappings`  
**Structure:**
```json
{
  "form-1729685123456": "k51qzi5uqu5di9agapykyjh3tqrf7i14a7fjq46oo0f6dxiimj62knq13059lt",
  "form-1729685234567": "k51qzi5uqu5dld2oiybwb1hpvs0pb2hz91ewqiz5zwz58cea1dwrlpneaimock"
}
```

**Purpose:** Map forms to their permanent IPNS addresses

```typescript
saveIPNSMapping('form-123', 'k51qzi5uqu5di...');
// Later: const ipnsName = getIPNSName('form-123');
```

**Why?**
- 🔗 Permanent, updateable links for forms
- 📌 One address that always points to latest version
- 🌐 Share single link that never breaks

---

#### 5. **IPNS Signing Keys** (Form ID → Private Key)
**Key:** `form-ipns-keys`  
**Structure:**
```json
{
  "form-1729685123456": {
    "bytes": [234, 129, 45, 78, ...],
    "toString": "k51qzi5uqu5di..."
  }
}
```

**Purpose:** Store private keys needed to update IPNS names

```typescript
saveIPNSKey('form-123', nameObject);
// Later: const nameObj = await getIPNSNameObject('form-123');
```

**Why?**
- 🔐 Required to update IPNS pointers
- ✍️ Sign IPNS updates
- 🔄 Enable form updates without changing link
- ⚠️ Critical: If lost, can't update that IPNS anymore!

---

## 📊 Storage Comparison Table

| Data Type | IPFS | localStorage | Purpose |
|-----------|------|--------------|---------|
| **Form Content** | ✅ Primary | ✅ Backup | Full form metadata, fields, settings |
| **Form IDs** | ❌ | ✅ Only | List of user's forms |
| **CID Mappings** | ❌ | ✅ Only | Link form IDs to IPFS CIDs |
| **IPNS Names** | ❌ | ✅ Only | Permanent addresses for forms |
| **IPNS Keys** | ❌ | ✅ Only | Private keys to update IPNS |
| **Form Responses** | ❌ Future | ❌ Future | Submission data (not implemented yet) |

---

## 🔄 Data Flow

### Creating a Form

```
1. User fills form builder
   ↓
2. Form metadata created
   ↓
3. Save to localStorage (cache)
   localStorage.setItem('form-meta-{id}', JSON.stringify(metadata))
   ↓
4. Upload to IPFS (permanent)
   const cid = await uploadFormToIPFS(metadata)
   ↓
5. Create IPNS name (permanent link)
   const { name, nameObj } = await createIPNSName()
   ↓
6. Publish CID to IPNS
   await publishToIPNS(nameObj, cid)
   ↓
7. Save mappings locally
   saveCIDMapping(formId, cid)
   saveIPNSMapping(formId, name)
   saveIPNSKey(formId, nameObj)
```

**Result:**
- ✅ Form on IPFS: `bafybeiabc123...`
- ✅ IPNS link: `k51qzi5uqu5di...`
- ✅ Local cache ready
- ✅ Can update via IPNS key

---

### Editing a Form

```
1. Load form from localStorage (fast) or IPFS (slower)
   ↓
2. User makes changes
   ↓
3. Upload NEW version to IPFS
   const newCid = await uploadFormToIPFS(updatedMetadata)
   ↓
4. Update IPNS to point to new CID
   const nameObj = await getIPNSNameObject(formId)
   await updateIPNS(nameObj, newCid)
   ↓
5. Update local mappings
   saveCIDMapping(formId, newCid)
   saveFormMetadata(updatedMetadata)
```

**Result:**
- ✅ New CID: `bafybeidef456...`
- ✅ Same IPNS: `k51qzi5uqu5di...` (updated to new CID!)
- ✅ Shared link still works
- ✅ Shows latest version

---

### Loading Dashboard

```
1. Check localStorage first (fast path)
   const localForms = loadAllForms()
   ↓
2. Display local forms immediately
   setForms(localForms)
   ↓
3. Optional: Sync with IPFS in background
   const ipfsForms = await getAllFormsFromIPFS()
   ↓
4. Merge/update with IPFS data
   setForms(mergeWithLocal(ipfsForms, localForms))
```

**Why this approach?**
- ⚡ Instant UI (no loading delay)
- 🔄 Sync in background
- 🛡️ Works offline

---

### Viewing a Shared Form

```
1. User clicks link: /forms/view/k51qzi5uqu5di...
   ↓
2. Check if it's IPNS (k51...) or CID (bafy...)
   ↓
3. If IPNS: Resolve to current CID
   const cid = await resolveIPNS(ipnsName)
   ↓
4. Fetch form from IPFS
   const form = await getFormFromIPFS(cid)
   ↓
5. Display form
```

**Result:**
- ✅ Always shows latest version
- ✅ Works for anyone with link
- ✅ No authentication needed

---

## 🔐 Security & Privacy

### What's Stored Where

**IPFS (Public)**
- ✅ Form structure and fields
- ✅ Form metadata
- ⚠️ Anyone with CID can access
- ❌ Don't store: passwords, API keys, sensitive data

**localStorage (Private)**
- ✅ IPNS signing keys (never shared!)
- ✅ CID mappings (user-specific)
- ✅ Form cache (convenience)
- ⚠️ Browser-specific (not synced across devices)

### Important Security Notes

1. **IPNS Keys are Critical!**
   - If lost → Can't update IPNS anymore
   - Never share signing keys
   - Consider implementing backup/export

2. **IPFS is Public!**
   - All form structures are public
   - Anyone with CID can view
   - Use for public forms only

3. **localStorage Limits**
   - ~5-10MB total per domain
   - Data lost if browser cleared
   - Not synced across devices

---

## 📈 Storage Sizes

### IPFS
- **Average form:** ~1-5 KB JSON
- **Complex form:** ~10-50 KB
- **Limit:** Effectively unlimited
- **Cost:** Free (Storacha free tier)

### localStorage
- **CID mapping:** ~100 bytes per form
- **IPNS mapping:** ~150 bytes per form
- **IPNS key:** ~300 bytes per form
- **Form cache:** 1-50 KB per form
- **Browser limit:** ~5-10 MB total
- **Estimate:** Can store ~1000-5000 forms locally

---

## 🔮 Future Enhancements

### Recommended Additions

1. **IndexedDB for Local Storage**
   - Replace localStorage with IndexedDB
   - Larger storage (50MB-1GB+)
   - Better performance for large datasets
   - Support for binary data

2. **Cloud Key Backup**
   - Encrypt and backup IPNS keys to cloud
   - Enable multi-device support
   - Implement key recovery

3. **Form Responses on IPFS**
   - Store submissions on IPFS
   - Link to forms via CID
   - Encrypted for privacy

4. **IPFS Pinning Service**
   - Ensure forms stay available
   - Auto-pin important forms
   - Monitor pin status

5. **Offline Mode**
   - Full offline form builder
   - Queue IPFS uploads
   - Sync when online

---

## 🤔 Why This Architecture?

### Benefits of Hybrid Approach

**IPFS Advantages:**
- ✅ Decentralized (no single server)
- ✅ Content-addressed (CID verifies data)
- ✅ Permanent (content persists)
- ✅ Shareable (anyone can access)
- ✅ Free (Storacha free tier)

**localStorage Advantages:**
- ✅ Instant access (no network calls)
- ✅ Offline capability
- ✅ Private data (IPNS keys)
- ✅ Quick dashboard loading
- ✅ Backup/fallback

**Combined Power:**
- ⚡ Fast local access + Permanent storage
- 🔒 Private keys + Public forms
- 🔄 Updateable (IPNS) + Immutable (CID)
- 📡 Online sharing + Offline work

---

## 📝 Summary

### IPFS Stores:
1. ✅ Complete form metadata (JSON)
2. ✅ Immutable content (CID)
3. ✅ Publicly accessible data

### localStorage Stores:
1. ✅ Form IDs list
2. ✅ CID mappings (form → CID)
3. ✅ IPNS mappings (form → k51...)
4. ✅ IPNS signing keys (private!)
5. ✅ Form metadata cache (backup)

### Why Both?
- **IPFS** = Permanent, shareable, decentralized storage
- **localStorage** = Fast, private, local data management
- **Together** = Best of both worlds! ⚡🌐

---

**Current Architecture Status:** ✅ Production Ready  
**Next Steps:** Consider IndexedDB migration for larger scale
