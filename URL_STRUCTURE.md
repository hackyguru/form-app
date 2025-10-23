# URL Structure Fix

## Problem Solved

Fixed the Next.js dynamic route conflict:
```
Error: You cannot use different slug names for the same dynamic path ('cid' !== 'id')
```

## Solution

Moved IPFS form viewer from `/forms/[cid]` to `/forms/view/[cid]` to avoid conflict with existing `/forms/[id]` routes.

## URL Structure

### Form Routes

| Action | URL Pattern | Description |
|--------|-------------|-------------|
| **Create** | `/forms/create` | Form builder page |
| **Edit** | `/forms/[id]/edit` | Edit existing form (uses form ID) |
| **Preview** | `/forms/[id]/preview` | Preview form before publishing |
| **Responses** | `/forms/[id]/responses` | View form responses |
| **View (IPFS)** | `/forms/view/[cid]` | Public form view using IPFS CID |

### Why This Structure?

1. **`/forms/[id]/*`** - Used for form management (edit, preview, responses)
   - These use the form ID (e.g., `form-1737805200000`)
   - Requires authentication/ownership
   - Works with localStorage

2. **`/forms/view/[cid]`** - Used for public form access
   - Uses IPFS CID (e.g., `bafybeiabc123...`)
   - Public, shareable link
   - Loads from IPFS gateway
   - Permanent, decentralized

## Examples

### Creating and Sharing a Form

```
1. User creates form at /forms/create
2. Form uploaded to IPFS
3. Returns CID: bafybeiabc123xyz...
4. User redirected to: /forms/view/bafybeiabc123xyz...
5. Share link: https://yoursite.com/forms/view/bafybeiabc123xyz...
```

### Managing a Form

```
1. User views dashboard at /
2. Clicks "Edit" on a form
3. Goes to: /forms/form-1737805200000/edit
4. Makes changes and saves
5. Views responses at: /forms/form-1737805200000/responses
```

## Updated Files

### Code Changes

1. **`/pages/forms/view/[cid]/index.tsx`**
   - Moved from `/pages/forms/[cid]/index.tsx`
   - Renders forms from IPFS by CID

2. **`/pages/forms/create.tsx`**
   - Redirects to `/forms/view/{cid}` after upload

3. **`/pages/index.tsx`**
   - "View" button links to `/forms/view/{cid}`

4. **`/lib/storacha.ts`**
   - `getFormShareLink()` returns `/forms/view/{cid}`

5. **`/components/share-form-dialog.tsx`**
   - Share URLs use `/forms/view/{cid}`

### Documentation Updates

1. **`STORACHA_SETUP.md`**
   - All references updated to `/forms/view/{cid}`

2. **`IPFS_INTEGRATION.md`**
   - URL structure section updated
   - Examples updated

## Benefits

✅ **No Route Conflicts** - Clean separation between management and public routes
✅ **Clear Intent** - `/view/` makes it obvious it's a public view
✅ **Scalable** - Easy to add more public routes (e.g., `/forms/embed/{cid}`)
✅ **SEO Friendly** - Descriptive URLs for better indexing

## Migration Note

If you have existing forms with shared links, they will need to be updated from:
- Old: `/forms/{cid}`
- New: `/forms/view/{cid}`

The CID remains the same, only the path changes.
