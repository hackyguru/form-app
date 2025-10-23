# Storacha Setup Guide

This guide will help you set up Storacha (formerly web3.storage) to enable IPFS storage for your forms.

## Overview

Your forms are stored as JSON files on IPFS via Storacha. Each form gets a unique CID (Content Identifier) that can be used to access it from anywhere on the IPFS network.

## Prerequisites

1. Node.js installed (v18 or higher)
2. A Storacha account (free tier available)
3. Terminal/command line access

## Step 1: Install Storacha CLI

```bash
npm install -g @storacha/cli
```

## Step 2: Login to Storacha

```bash
storacha login your-email@example.com
```

Check your email and click the validation link.

## Step 3: Create a Space

A "Space" is like a storage bucket for your data.

```bash
storacha space create my-forms-space
```

This will output a Space DID (starting with `did:key:...`). Save this for later.

## Step 4: Select Your Space

```bash
storacha space use <your-space-did>
```

Replace `<your-space-did>` with the DID from Step 3.

## Step 5: Create an Agent Key

This creates a new agent that your backend will use:

```bash
storacha key create
```

**Output example:**
```
did:key:z6Mk... # Your Agent DID
Mg... # Your Private Key
```

**Important:** Copy the private key (starts with `Mg...`) and save it securely. You'll need it in `.env.local`.

## Step 6: Create a Delegation

This delegates permissions from your Space to the Agent you just created:

```bash
storacha delegation create <agent-did-from-step-5> --base64
```

Replace `<agent-did-from-step-5>` with the DID from Step 5 (starts with `did:key:...`).

**Output:** A long base64-encoded string. Copy this entire output.

## Step 7: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your values:

```env
STORACHA_KEY=Mg...  # Your private key from Step 5
STORACHA_PROOF=base64-string...  # Your delegation from Step 6
```

## Step 8: Restart Your Development Server

```bash
npm run dev
```

## Testing the Integration

1. Go to `http://localhost:3000`
2. Click "Create New Form"
3. Add fields and save
4. You should see a toast: "Uploading form to IPFS..."
5. Once uploaded, you'll get a CID
6. The form will be accessible at `/forms/view/{cid}`

## How It Works

### Form Creation Flow

```
User creates form
      ↓
Frontend calls uploadFormToIPFS()
      ↓
Frontend requests delegation from backend API
      ↓
Backend creates UCAN delegation
      ↓
Frontend uploads to Storacha with delegation
      ↓
Storacha returns CID
      ↓
CID stored locally for dashboard
      ↓
Form accessible at /forms/view/{cid}
```

### Form Viewing Flow

```
User visits /forms/view/{cid}
      ↓
Page fetches from IPFS gateway
      ↓
Form metadata (JSON) retrieved
      ↓
Form rendered dynamically
```

## Architecture

### Backend (Node.js API)
- **File:** `/pages/api/storacha/delegation.ts`
- **Purpose:** Creates UCAN delegations for frontend clients
- **Environment:** Serverless function (Next.js API route)

### Frontend (React)
- **File:** `/lib/storacha.ts`
- **Purpose:** Handles IPFS uploads and retrievals
- **Methods:**
  - `createStorachaClient()` - Gets delegation from backend
  - `uploadFormToIPFS()` - Uploads form metadata
  - `getFormFromIPFS()` - Retrieves form by CID

### Storage
- **IPFS:** Permanent storage of form metadata
- **localStorage:** CID mappings for quick dashboard access

## Troubleshooting

### "Failed to get delegation from backend"

**Cause:** Backend can't access environment variables

**Solution:**
1. Check `.env.local` exists and has correct values
2. Restart dev server after adding env variables
3. Verify `STORACHA_KEY` and `STORACHA_PROOF` are set

### "Cannot find module '@storacha/client'"

**Cause:** Package not installed

**Solution:**
```bash
npm install @storacha/client
```

### "Failed to upload form to IPFS"

**Possible causes:**
1. Invalid delegation (recreate with `storacha delegation create`)
2. Network issues (check internet connection)
3. Storacha service down (check status.storacha.network)

**Debug:**
1. Open browser console
2. Check Network tab for failed requests
3. Look for error messages in console

### "Form not loading from IPFS"

**Possible causes:**
1. CID not yet propagated across IPFS network (wait 30-60 seconds)
2. Gateway issues (try different gateway)
3. Invalid CID

**Solution:**
1. Wait a minute and refresh
2. Try accessing `https://w3s.link/ipfs/{cid}` directly
3. Check if CID is valid

## Advanced Configuration

### Custom IPFS Gateway

You can use a different IPFS gateway by modifying `/lib/storacha.ts`:

```typescript
export const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
// or
export const IPFS_GATEWAY = 'https://dweb.link/ipfs/';
```

### Limited Permissions

If you want to limit what the agent can do, specify abilities when creating delegation:

```bash
storacha delegation create <agent-did> \
  --can space/blob/add \
  --can space/index/add \
  --can filecoin/offer \
  --can upload/add \
  --base64
```

This only grants upload permissions, not delete or manage permissions.

### Delegation Expiration

By default, delegations expire after 24 hours (set in `/pages/api/storacha/delegation.ts`).

To change expiration:

```typescript
const expiration = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7); // 7 days
```

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` by default
2. **Rotate keys periodically** - Create new delegations every few months
3. **Limit permissions** - Only grant necessary abilities
4. **Monitor usage** - Check Storacha dashboard for unusual activity
5. **Use environment-specific keys** - Different keys for dev/staging/production

## Cost & Limits

### Free Tier (Storacha)
- **Storage:** 5GB free
- **Bandwidth:** Generous (check storacha.network for current limits)
- **Requests:** Unlimited

### Paid Tiers
Check https://storacha.network/pricing for current pricing.

## Support

- **Storacha Docs:** https://docs.storacha.network
- **Storacha Discord:** https://discord.gg/storacha
- **IPFS Docs:** https://docs.ipfs.tech

## Next Steps

Once Storacha is configured:

1. ✅ Forms upload to IPFS automatically
2. ✅ Forms accessible via CID at `/forms/view/{cid}`
3. ✅ Forms shareable with permanent links
4. ✅ Forms stored decentrally (cannot be taken down)

### Future Enhancements

- [ ] Store form responses on IPFS
- [ ] Add encryption for private forms
- [ ] Implement IPFS pinning service
- [ ] Add form versioning
- [ ] Support for file uploads to IPFS
- [ ] Integrate with Filecoin for long-term archival

---

**Last Updated:** January 2025
**Version:** 1.0.0
