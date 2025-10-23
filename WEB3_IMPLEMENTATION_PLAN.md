# 🚀 Web3 Form System - Complete Architecture Plan

## 📋 System Overview

### User Flow
```
1. User connects wallet (Privy) OR social auth
   ↓
2. User creates form
   ↓
3. Form metadata → IPFS → Get CID
   ↓
4. CID relayed to backend via Waku protocol
   ↓
5. Backend updates IPNS with latest CID
   ↓
6. Form mapping saved to Supabase (wallet → form)
   ↓
7. Form submissions encrypted (multi-recipient)
   ↓
8. Only creator + submitter + collaborators can decrypt
```

---

## 🏗️ Architecture Components

### 1. **Authentication Layer** (Privy)
- Wallet connection (MetaMask, WalletConnect, etc.)
- Social auth (Google, Twitter, Email)
- Embedded wallets for non-crypto users

### 2. **Storage Layer**
- **IPFS (Storacha)** - Form metadata (public)
- **IPNS (w3name)** - Mutable pointers
- **Supabase** - User mappings, metadata
- **Encrypted IPFS** - Form responses (private)

### 3. **Communication Layer** (Waku)
- P2P message relay (CID updates)
- Decentralized pub/sub
- No central server for relay

### 4. **Encryption Layer**
- **XChaCha20-Poly1305** - Authenticated encryption
- **X25519** - Key exchange (ECDH)
- Multi-recipient encryption
- Key management

---

## 🔐 Encryption Architecture

### Why XChaCha20-Poly1305 + X25519?
✅ **XChaCha20-Poly1305:**
- Modern authenticated encryption (AEAD)
- Fast and secure
- 192-bit nonce (no nonce reuse risk)
- Authenticated (detects tampering)
- Used by: Signal, WireGuard, libsodium

✅ **X25519:**
- Elliptic curve Diffie-Hellman (ECDH)
- Generate shared secrets
- Fast key agreement
- Used by: Signal, TLS 1.3, WireGuard

### Multi-Recipient Encryption Flow
```
1. Form creator generates encryption keypair (X25519)
   - Public key: shared openly
   - Private key: stored encrypted in user's wallet/storage

2. Form submission:
   - Submitter generates ephemeral keypair
   - Derive shared secret with each recipient's public key
   - Encrypt data with XChaCha20-Poly1305
   - Store encrypted blobs + ephemeral public key on IPFS
   
3. Recipients list:
   - Form creator (always)
   - Form submitter (always)
   - Collaborators (optional)

4. Decryption:
   - Use private key + ephemeral public key
   - Derive shared secret
   - Decrypt data
```

---

## 📦 Technology Stack

### Frontend
- **Next.js 16** (already using)
- **Privy** - Wallet + social auth
- **@noble/curves** - X25519 (lightweight, audited)
- **@stablelib/xchacha20poly1305** - Encryption
- **@waku/sdk** - P2P messaging

### Backend
- **Supabase** - Database
- **Storacha** - IPFS uploads (already using)
- **w3name** - IPNS (already using)
- **Waku** - Message relay (new)

### Libraries Needed
```bash
# Authentication
npm install @privy-io/react-auth

# Encryption
npm install @noble/curves @stablelib/xchacha20poly1305

# Messaging
npm install @waku/sdk

# Utilities
npm install @supabase/supabase-js (will add later)
```

---

## 🗺️ Implementation Roadmap

### Phase 1: Authentication (Week 1) ⭐ START HERE
**Goal:** User can connect wallet or social auth

**Tasks:**
1. Set up Privy account
2. Install Privy SDK
3. Create auth wrapper component
4. Implement wallet connection UI
5. Get user's wallet address/ID
6. Store user identity

**Files to create/modify:**
- `lib/privy.ts` - Privy client setup
- `components/auth/connect-button.tsx` - Connect UI
- `components/auth/privy-provider.tsx` - Auth wrapper
- `pages/_app.tsx` - Wrap with PrivyProvider

**Deliverable:** 
- User can click "Connect Wallet"
- See their address/social profile
- Sign out

---

### Phase 2: User-Form Mapping (Week 2)
**Goal:** Link wallet addresses to forms they create

**Tasks:**
1. Set up Supabase project
2. Create database schema
3. Save form → user mapping on create
4. Fetch user's forms from Supabase
5. Update dashboard to use Supabase

**Database Schema:**
```sql
CREATE TABLE users (
  wallet_address TEXT PRIMARY KEY,
  privy_user_id TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE forms (
  id TEXT PRIMARY KEY,
  creator_wallet TEXT REFERENCES users(wallet_address),
  ipfs_cid TEXT NOT NULL,
  ipns_name TEXT,
  title TEXT NOT NULL,
  encryption_public_key TEXT NOT NULL, -- For receiving submissions
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE form_collaborators (
  form_id TEXT REFERENCES forms(id),
  wallet_address TEXT REFERENCES users(wallet_address),
  permission TEXT DEFAULT 'view', -- 'view', 'decrypt', 'admin'
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (form_id, wallet_address)
);
```

**Deliverable:**
- Forms are linked to wallet addresses
- User sees only their forms
- Can add collaborators

---

### Phase 3: Encryption Keys (Week 3)
**Goal:** Generate and manage encryption keys

**Tasks:**
1. Generate X25519 keypair on form creation
2. Store public key in form metadata
3. Store private key encrypted (user's device/wallet)
4. Implement key derivation for multi-recipient
5. Test encryption/decryption

**Key Management:**
```typescript
// On form creation
const keypair = generateX25519Keypair();
// Public key → stored in form metadata (IPFS)
// Private key → encrypted with user's wallet signature → stored locally

// On form submission
const recipients = [
  creatorPublicKey,
  submitterPublicKey,
  ...collaboratorPublicKeys
];
const encrypted = multiRecipientEncrypt(formData, recipients);
```

**Deliverable:**
- Form creator has encryption keypair
- Keys are securely stored
- Can encrypt test data

---

### Phase 4: Waku Integration (Week 4)
**Goal:** Relay IPFS CIDs via Waku protocol

**Tasks:**
1. Set up Waku node
2. Create message format
3. Backend listens for CID updates
4. Update IPNS when CID received
5. Implement retry logic

**Message Format:**
```typescript
{
  type: "FORM_UPDATE",
  formId: "form-123",
  ipfsCid: "bafybeiabc...",
  senderWallet: "0x123...",
  signature: "0xabc...", // Signed by sender
  timestamp: 1729685123456
}
```

**Flow:**
```
Frontend                  Waku Network              Backend
   |                          |                        |
   |-- Publish CID message -->|                        |
   |                          |-- Relay message ------>|
   |                          |                        |-- Update IPNS
   |                          |                        |-- Update Supabase
```

**Deliverable:**
- CID updates relayed via Waku
- Backend receives and processes
- IPNS updated automatically

---

### Phase 5: Form Submissions (Week 5)
**Goal:** Encrypted form submissions

**Tasks:**
1. Create submission UI
2. Implement multi-recipient encryption
3. Upload encrypted data to IPFS
4. Store submission metadata in Supabase
5. Implement decryption UI

**Submission Flow:**
```
1. User fills form
   ↓
2. Get recipients' public keys:
   - Form creator
   - Current submitter
   - Collaborators
   ↓
3. Encrypt with multi-recipient
   ↓
4. Upload encrypted data to IPFS
   ↓
5. Store metadata in Supabase:
   - Submission ID
   - Form ID
   - Encrypted data CID
   - Submitter wallet
   - Timestamp
```

**Deliverable:**
- Users can submit forms
- Data is encrypted
- Only authorized parties can decrypt
- Submissions viewable in dashboard

---

### Phase 6: Collaborators (Week 6)
**Goal:** Add/manage form collaborators

**Tasks:**
1. UI to add collaborators by wallet
2. Share form encryption keys with collaborators
3. Collaborator permissions (view/decrypt/admin)
4. Collaborator dashboard view

**Deliverable:**
- Form creators can invite collaborators
- Collaborators can decrypt submissions
- Permission management

---

## 🔐 Security Considerations

### Key Storage
**Options:**
1. **Encrypted in localStorage** (simpler)
   - Encrypted with wallet signature
   - User signs message to unlock
   
2. **In wallet's storage** (more secure)
   - Use wallet's secure storage API
   - Keys never leave wallet

3. **Split key approach** (most secure)
   - Key split into shares
   - User's device + backup location
   - Requires both to decrypt

### Threat Model
✅ **Protects against:**
- IPFS node operators (can't read data)
- Database compromise (no plaintext data)
- Network eavesdropping (E2E encrypted)
- Unauthorized viewers (need private key)

⚠️ **Vulnerable to:**
- User losing private key (unrecoverable)
- Compromised user device (malware)
- Social engineering (user tricks)

### Best Practices
- Use audited libraries (@noble/curves, @stablelib)
- Generate keys in browser (never send to server)
- Encrypt private keys at rest
- Implement key backup/recovery
- Use secure key derivation (HKDF)

---

## 📊 Database Schema (Complete)

```sql
-- Users table
CREATE TABLE users (
  wallet_address TEXT PRIMARY KEY,
  privy_user_id TEXT UNIQUE,
  email TEXT,
  display_name TEXT,
  public_key_x25519 TEXT, -- For receiving encrypted data
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW()
);

-- Forms table
CREATE TABLE forms (
  id TEXT PRIMARY KEY,
  creator_wallet TEXT REFERENCES users(wallet_address),
  ipfs_cid TEXT NOT NULL,
  ipns_name TEXT,
  
  -- Form metadata
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  
  -- Encryption
  encryption_public_key TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Analytics
  submission_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0
);

-- Form collaborators
CREATE TABLE form_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT REFERENCES forms(id) ON DELETE CASCADE,
  wallet_address TEXT REFERENCES users(wallet_address),
  permission TEXT DEFAULT 'decrypt', -- 'view', 'decrypt', 'admin'
  added_by TEXT REFERENCES users(wallet_address),
  added_at TIMESTAMP DEFAULT NOW()
);

-- Form submissions
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT REFERENCES forms(id) ON DELETE CASCADE,
  
  -- Encrypted data
  encrypted_data_cid TEXT NOT NULL, -- IPFS CID of encrypted blob
  ephemeral_public_key TEXT NOT NULL, -- For decryption
  
  -- Submitter
  submitter_wallet TEXT REFERENCES users(wallet_address),
  submitter_identifier TEXT, -- Email or anonymous ID
  
  -- Metadata
  submitted_at TIMESTAMP DEFAULT NOW(),
  
  -- Status
  is_deleted BOOLEAN DEFAULT false
);

-- Waku messages log (optional, for debugging)
CREATE TABLE waku_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL,
  form_id TEXT,
  sender_wallet TEXT,
  ipfs_cid TEXT,
  processed BOOLEAN DEFAULT false,
  received_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_forms_creator ON forms(creator_wallet);
CREATE INDEX idx_forms_ipns ON forms(ipns_name);
CREATE INDEX idx_submissions_form ON form_submissions(form_id, submitted_at DESC);
CREATE INDEX idx_submissions_submitter ON form_submissions(submitter_wallet);
CREATE INDEX idx_collaborators_form ON form_collaborators(form_id);
```

---

## 🎯 Where to Begin?

### Recommended Order

#### **STEP 1: Privy Authentication** ⭐ START HERE
**Why first?**
- Foundation for everything else
- Quick win (can implement in 2-3 days)
- User can see their wallet address
- Needed for all other features

**What you'll implement:**
- Connect wallet button
- Social auth options
- User profile display
- Sign out functionality

**Questions before starting:**
1. Do you want to support social auth (Google, Twitter) or just wallets?
2. Should we support email-only users with embedded wallets?
3. Any specific wallet providers to prioritize (MetaMask, Coinbase, etc.)?

---

#### **STEP 2: Supabase Setup**
**After Privy works**, set up database to store:
- User's wallet address
- Forms created by each user
- Basic analytics

**Questions:**
1. Do you have a Supabase account already?
2. Any specific region preference for database?
3. Should I create the initial migration script?

---

#### **STEP 3: Encryption Foundation**
**After auth + database**, implement:
- Key generation (X25519)
- Basic encryption/decryption
- Test with sample data

**Questions:**
1. Where should private keys be stored initially? (localStorage encrypted with wallet signature, or in wallet storage?)
2. Should we implement key backup from day 1?
3. Any compliance requirements (GDPR, HIPAA, etc.)?

---

#### **STEP 4: Waku Integration**
After encryption works, add P2P relay

---

#### **STEP 5: Form Submissions**
Final piece - encrypted submissions

---

## 🤔 Questions Before We Start

### Technical Decisions

1. **Privy Setup:**
   - Do you have a Privy account? Need to create one?
   - Should we support social auth or just wallets?
   - Any specific chains to support? (Ethereum, Polygon, Base, etc.)

2. **Key Storage Strategy:**
   - Option A: Encrypted localStorage (simpler, faster to implement)
   - Option B: Wallet's secure storage (more secure, complex)
   - Option C: Split-key approach (most secure, most complex)

3. **Waku Implementation:**
   - Should backend run its own Waku node?
   - Or use Waku relay service?
   - Public or private relay?

4. **Encryption Details:**
   - Should submitter always be able to decrypt their submission?
   - Should form creator be able to revoke collaborator access?
   - Need to support key rotation?

5. **Supabase:**
   - Do you have account? Need me to guide setup?
   - What region for database?
   - Enable real-time features?

### Scope Questions

1. **MVP vs Full Implementation:**
   - Want all features at once?
   - Or build incrementally and test each phase?

2. **Timeline:**
   - What's your target timeline?
   - Want to move fast or ensure everything is perfect?

3. **Testing:**
   - Need testnet deployment first?
   - Or build everything then test?

---

## ✅ My Recommendation

### Start with Phase 1: Privy Authentication

**Rationale:**
- Quickest to implement (2-3 days)
- Foundation for everything else
- Immediate visible result
- Low risk, high confidence

**First Implementation Steps:**
1. Create Privy account
2. Install `@privy-io/react-auth`
3. Create auth provider component
4. Add connect wallet button
5. Test wallet connection

**After this works**, we'll move to Phase 2 (Supabase), then encryption, then Waku, then submissions.

---

## 🚀 Let's Start!

### What I Need From You:

1. **Confirm Phase 1 approach** - Start with Privy authentication?

2. **Answer key questions:**
   - Support social auth (Google, Twitter) or just wallets?
   - Any specific wallet providers to prioritize?
   - Preferred chains? (Ethereum mainnet, Polygon, Base, etc.)

3. **Privy account status:**
   - Do you have Privy account?
   - Need me to guide setup?

4. **Key storage preference:**
   - Option A (localStorage encrypted) - faster
   - Option B (wallet storage) - more secure
   - Option C (split-key) - most secure

Once you answer these, I'll start implementing Phase 1! 🎯

