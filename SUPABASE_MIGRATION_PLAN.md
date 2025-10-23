# 🗄️ Supabase Migration Plan

## Why Supabase?

### Problems with Current localStorage Approach
- ❌ **No user accounts** - Can't identify who created what
- ❌ **Browser-specific** - Lost on device change
- ❌ **No backup** - Lost if browser cleared
- ❌ **No collaboration** - Can't share between users
- ❌ **No analytics** - Can't track usage
- ❌ **Size limits** - ~5-10MB per domain

### Supabase Advantages
- ✅ **PostgreSQL database** - Industry-standard, reliable
- ✅ **Built-in auth** - Email, OAuth, magic links
- ✅ **Row Level Security** - Automatic data isolation per user
- ✅ **Real-time** - Live updates across devices
- ✅ **Free tier** - 500MB database, 2GB bandwidth/month
- ✅ **RESTful API** - Easy to use from frontend
- ✅ **Future-proof** - Easy to migrate to blockchain later

---

## 📊 Database Schema

### Tables Design

#### 1. **`users` table** (Built-in Supabase Auth)
```sql
-- Managed by Supabase Auth automatically
-- Contains: id, email, created_at, etc.
```

#### 2. **`forms` table** (Main form registry)
```sql
CREATE TABLE forms (
  -- Primary Key
  id TEXT PRIMARY KEY,                    -- e.g., "form-1729685123456"
  
  -- Ownership
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- IPFS Data (Critical!)
  ipfs_cid TEXT NOT NULL,                 -- e.g., "bafybeiabc123..."
  ipns_name TEXT,                         -- e.g., "k51qzi5uqu5di..."
  
  -- Form Metadata (Cached for quick access)
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',           -- 'active', 'paused', 'closed'
  
  -- IPNS Key Storage (Encrypted!)
  ipns_key_encrypted TEXT,                -- Encrypted signing key
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[],                            -- Array of tags
  is_public BOOLEAN DEFAULT true,         -- Public/private flag
  is_deleted BOOLEAN DEFAULT false        -- Soft delete
);

-- Indexes for performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_forms_ipns_name ON forms(ipns_name);
CREATE INDEX idx_forms_created_at ON forms(created_at DESC);
CREATE INDEX idx_forms_status ON forms(status) WHERE is_deleted = false;
```

#### 3. **`form_versions` table** (Version history)
```sql
CREATE TABLE form_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT REFERENCES forms(id) ON DELETE CASCADE,
  
  -- IPFS version data
  ipfs_cid TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  
  -- Change metadata
  changed_by UUID REFERENCES auth.users(id),
  change_description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(form_id, version_number)
);

CREATE INDEX idx_versions_form_id ON form_versions(form_id, version_number DESC);
```

#### 4. **`form_shares` table** (Sharing & collaboration)
```sql
CREATE TABLE form_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT REFERENCES forms(id) ON DELETE CASCADE,
  
  -- Sharing
  shared_by UUID REFERENCES auth.users(id),
  shared_with UUID REFERENCES auth.users(id),
  permission TEXT DEFAULT 'view',         -- 'view', 'edit', 'admin'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(form_id, shared_with)
);

CREATE INDEX idx_shares_shared_with ON form_shares(shared_with);
```

#### 5. **`form_analytics` table** (Usage tracking)
```sql
CREATE TABLE form_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT REFERENCES forms(id) ON DELETE CASCADE,
  
  -- Event data
  event_type TEXT NOT NULL,               -- 'view', 'submit', 'share', 'edit'
  user_id UUID REFERENCES auth.users(id),
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_form_id ON form_analytics(form_id, created_at DESC);
CREATE INDEX idx_analytics_event_type ON form_analytics(event_type);
```

---

## 🔐 Row Level Security (RLS) Policies

### Enable RLS
```sql
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_analytics ENABLE ROW LEVEL SECURITY;
```

### Forms Policies
```sql
-- Users can view their own forms
CREATE POLICY "Users can view own forms"
  ON forms FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public forms
CREATE POLICY "Anyone can view public forms"
  ON forms FOR SELECT
  USING (is_public = true AND is_deleted = false);

-- Users can view shared forms
CREATE POLICY "Users can view shared forms"
  ON forms FOR SELECT
  USING (
    id IN (
      SELECT form_id FROM form_shares 
      WHERE shared_with = auth.uid()
    )
  );

-- Users can insert their own forms
CREATE POLICY "Users can create forms"
  ON forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own forms
CREATE POLICY "Users can update own forms"
  ON forms FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own forms (soft delete)
CREATE POLICY "Users can delete own forms"
  ON forms FOR UPDATE
  USING (auth.uid() = user_id);
```

### Form Versions Policies
```sql
-- Users can view versions of forms they can access
CREATE POLICY "Users can view form versions"
  ON form_versions FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM forms 
      WHERE user_id = auth.uid() 
      OR is_public = true
    )
  );

-- Users can insert versions for their forms
CREATE POLICY "Users can create versions"
  ON form_versions FOR INSERT
  WITH CHECK (
    form_id IN (SELECT id FROM forms WHERE user_id = auth.uid())
  );
```

---

## 🔄 Migration Strategy

### Phase 1: Setup Supabase (Week 1)
1. Create Supabase project
2. Run schema migrations
3. Set up RLS policies
4. Configure authentication

### Phase 2: Parallel Implementation (Week 2)
1. Keep localStorage working
2. Add Supabase SDK to project
3. Implement dual-write (both localStorage + Supabase)
4. Add user authentication

### Phase 3: Data Migration (Week 3)
1. Migrate existing localStorage data to Supabase
2. Add sync functionality
3. Handle conflicts (localStorage vs Supabase)

### Phase 4: Switch Over (Week 4)
1. Make Supabase primary storage
2. Keep localStorage as cache only
3. Remove localStorage dependencies
4. Full testing

---

## 📦 Implementation Code

### 1. Install Supabase
```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Client
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface FormRecord {
  id: string;
  user_id: string;
  ipfs_cid: string;
  ipns_name?: string;
  title: string;
  description?: string;
  status: 'active' | 'paused' | 'closed';
  ipns_key_encrypted?: string;
  created_at: string;
  updated_at: string;
  last_synced_at?: string;
  view_count: number;
  response_count: number;
  tags?: string[];
  is_public: boolean;
  is_deleted: boolean;
}
```

### 3. Form Storage Functions
```typescript
// lib/form-storage-supabase.ts
import { supabase, FormRecord } from './supabase';
import { FormMetadata } from '@/types/form';

/**
 * Save form to Supabase
 */
export async function saveFormToSupabase(
  formMetadata: FormMetadata,
  ipfsCid: string,
  ipnsName?: string,
  ipnsKeyEncrypted?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const formRecord: Partial<FormRecord> = {
    id: formMetadata.id,
    user_id: user.id,
    ipfs_cid: ipfsCid,
    ipns_name: ipnsName,
    title: formMetadata.title,
    description: formMetadata.description,
    status: formMetadata.status,
    ipns_key_encrypted: ipnsKeyEncrypted,
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('forms')
    .upsert(formRecord);

  if (error) throw error;
}

/**
 * Get user's forms from Supabase
 */
export async function getUserFormsFromSupabase(): Promise<FormRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get form by ID from Supabase
 */
export async function getFormFromSupabase(formId: string): Promise<FormRecord | null> {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (error) {
    console.error('Error fetching form:', error);
    return null;
  }
  
  return data;
}

/**
 * Delete form from Supabase (soft delete)
 */
export async function deleteFormFromSupabase(formId: string): Promise<void> {
  const { error } = await supabase
    .from('forms')
    .update({ is_deleted: true })
    .eq('id', formId);

  if (error) throw error;
}

/**
 * Track form view
 */
export async function trackFormView(formId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  // Increment view count
  const { error: updateError } = await supabase
    .from('forms')
    .update({ view_count: supabase.raw('view_count + 1') })
    .eq('id', formId);

  if (updateError) console.error('Failed to update view count:', updateError);

  // Track analytics
  const { error: analyticsError } = await supabase
    .from('form_analytics')
    .insert({
      form_id: formId,
      event_type: 'view',
      user_id: user?.id,
    });

  if (analyticsError) console.error('Failed to track analytics:', analyticsError);
}

/**
 * Save form version
 */
export async function saveFormVersion(
  formId: string,
  ipfsCid: string,
  versionNumber: number,
  changeDescription?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('form_versions')
    .insert({
      form_id: formId,
      ipfs_cid: ipfsCid,
      version_number: versionNumber,
      changed_by: user?.id,
      change_description: changeDescription,
    });

  if (error) throw error;
}
```

### 4. Authentication Wrapper
```typescript
// components/auth-provider.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return children;
}
```

---

## 🔐 IPNS Key Encryption

### Encrypt IPNS keys before storing in Supabase
```typescript
// lib/encryption.ts
import CryptoJS from 'crypto-js';

/**
 * Encrypt IPNS key with user's password/PIN
 */
export function encryptIPNSKey(keyData: any, password: string): string {
  const keyString = JSON.stringify(keyData);
  return CryptoJS.AES.encrypt(keyString, password).toString();
}

/**
 * Decrypt IPNS key
 */
export function decryptIPNSKey(encrypted: string, password: string): any {
  const bytes = CryptoJS.AES.decrypt(encrypted, password);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted);
}
```

---

## 🔄 Data Flow (Current vs Future)

### Current (localStorage)
```
User creates form
  ↓
Save to localStorage
  ↓
Upload to IPFS
  ↓
Create IPNS
  ↓
Save mappings to localStorage
  ↓
❌ Lost if browser cleared
```

### Future (Supabase)
```
User creates form
  ↓
Authenticate user
  ↓
Upload to IPFS → Get CID
  ↓
Create IPNS → Get k51...
  ↓
Encrypt IPNS key
  ↓
Save to Supabase:
  - Form ID
  - User ID
  - IPFS CID
  - IPNS name
  - Encrypted IPNS key
  - Form metadata
  ↓
✅ Persistent across devices
✅ User owns their forms
✅ Analytics available
✅ Collaboration ready
```

---

## 🚀 Benefits Summary

### Immediate Benefits
- ✅ **User accounts** - Know who created what
- ✅ **Multi-device** - Access from anywhere
- ✅ **Persistent** - Never lost
- ✅ **Collaborative** - Share with others
- ✅ **Analytics** - Track usage
- ✅ **Backup** - Automatic recovery

### Future Benefits
- ✅ **Real-time sync** - Live updates across devices
- ✅ **Version history** - Track all changes
- ✅ **Team workspaces** - Organization support
- ✅ **API access** - Build integrations
- ✅ **Blockchain migration** - Easy to move later

---

## 🔗 Blockchain Migration Path

### Why Supabase First?
1. **Faster to implement** - Days vs months
2. **Proven technology** - PostgreSQL is battle-tested
3. **Lower complexity** - No smart contracts needed yet
4. **Cost effective** - Free tier for getting started
5. **Easy migration** - Can move to blockchain later

### Future Blockchain Strategy
```
Supabase (Current) → Hybrid → Blockchain (Future)

Step 1: Use Supabase (NOW)
  - Store form mappings
  - User authentication
  - Analytics
  
Step 2: Add Blockchain Layer (LATER)
  - Store critical mappings on-chain
  - Keep analytics in Supabase
  - Hybrid approach
  
Step 3: Full Blockchain (EVENTUAL)
  - All mappings on-chain
  - Supabase for caching only
  - Decentralized identity
```

---

## 📋 Implementation Checklist

### Week 1: Setup
- [ ] Create Supabase account
- [ ] Set up project
- [ ] Run database migrations
- [ ] Configure RLS policies
- [ ] Set up authentication

### Week 2: Integration
- [ ] Install Supabase SDK
- [ ] Create database client
- [ ] Implement auth flow
- [ ] Add dual-write (localStorage + Supabase)
- [ ] Test basic CRUD operations

### Week 3: Migration
- [ ] Create migration script
- [ ] Migrate localStorage data
- [ ] Test data integrity
- [ ] Add error handling
- [ ] Implement sync

### Week 4: Production
- [ ] Switch to Supabase as primary
- [ ] Update all components
- [ ] Add analytics
- [ ] Performance testing
- [ ] Deploy

---

## 💰 Cost Estimate

### Supabase Free Tier (Perfect for Start)
- ✅ 500 MB database
- ✅ 2 GB bandwidth/month
- ✅ 50 MB file storage
- ✅ Unlimited API requests
- ✅ Up to 50,000 monthly active users

### When to Upgrade? ($25/month Pro)
- 8 GB database
- 50 GB bandwidth
- 100 GB file storage
- Typically at ~1,000-5,000 forms

---

## ✅ Recommendation

**YES - Supabase is an excellent choice!**

**Reasons:**
1. ✅ Solves immediate user tracking needs
2. ✅ Quick to implement (1-2 weeks)
3. ✅ Cost-effective (free to start)
4. ✅ Scales well
5. ✅ Easy blockchain migration later
6. ✅ Industry-standard tech (PostgreSQL)
7. ✅ Great developer experience

**Alternative Consideration:**
If you want to go blockchain NOW, consider:
- Ethereum (expensive gas fees)
- Polygon (cheaper, but still complex)
- IPNS + OrbitDB (decentralized DB)

But Supabase is **the pragmatic choice** for now! 🚀
