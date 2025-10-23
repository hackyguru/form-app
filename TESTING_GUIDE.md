# Quick Testing Guide 🧪

## Start the App

```bash
npm run dev
```

Open: `http://localhost:3000`

## Test Scenario 1: Create Form Without Auth ❌ → ✅

**Steps:**
1. Open `http://localhost:3000/forms/create` in incognito/private window
2. **Expected:** Authentication prompt appears (NOT form builder)
3. Click "Connect Wallet"
4. **Expected:** Privy authentication modal opens
5. Choose any auth method (wallet/Google/email/etc.)
6. **Expected:** Form builder appears after successful auth
7. Build a simple form and click "Save Form"
8. **Expected:** Form saves successfully and redirects to form view

**What this proves:** ✅ Users cannot create forms without authentication

---

## Test Scenario 2: Dashboard Buttons Change with Auth State

**Steps:**
1. Go to `http://localhost:3000` while logged in
2. **Expected:** See "Create New Form" button (top right area)
3. Click your profile in ConnectButton → Sign Out
4. **Expected:** Button changes to "Connect to Create Forms"
5. Click "Connect to Create Forms"
6. **Expected:** Privy modal opens
7. Authenticate again
8. **Expected:** Button changes back to "Create New Form"

**What this proves:** ✅ UI adapts to authentication state

---

## Test Scenario 3: Edit Form Without Auth ❌ → ✅

**Steps:**
1. While logged in, create a test form
2. Note the form ID from the URL after creation
3. Sign out from dashboard
4. Navigate directly to: `http://localhost:3000/forms/[form-id]/edit`
5. **Expected:** Authentication prompt appears (NOT form editor)
6. Click "Connect Wallet"
7. **Expected:** Privy modal opens
8. Authenticate
9. **Expected:** Form editor appears
10. Make a change and save
11. **Expected:** Form updates successfully

**What this proves:** ✅ Users cannot edit forms without authentication

---

## Test Scenario 4: Empty State Messages

**Steps:**
1. Clear localStorage (Dev Tools → Application → Local Storage → Clear)
2. Refresh dashboard while logged out
3. **Expected:** Empty state says "Connect your wallet to start creating..."
4. **Expected:** Button says "Connect to Get Started"
5. Click button → Authenticate
6. **Expected:** Message changes to "Get started by creating your first..."
7. **Expected:** Button changes to "Create Your First Form"

**What this proves:** ✅ Empty state adapts to auth status

---

## Test Scenario 5: Direct URL Access Protection

**Steps:**
1. Open incognito window (logged out)
2. Paste URL: `http://localhost:3000/forms/create`
3. Press Enter
4. **Expected:** Auth prompt shows immediately (no crash)
5. Paste URL: `http://localhost:3000/forms/any-id-here/edit`
6. Press Enter
7. **Expected:** Auth prompt shows immediately (no crash)

**What this proves:** ✅ Direct URL access is protected

---

## Test Scenario 6: Authentication Persistence

**Steps:**
1. Connect wallet on dashboard
2. Navigate to `/forms/create`
3. **Expected:** Form builder shows immediately (no auth prompt)
4. Go back to dashboard
5. Navigate to an edit page
6. **Expected:** Form editor shows immediately (no auth prompt)
7. Refresh page
8. **Expected:** Still authenticated (Privy persists session)

**What this proves:** ✅ Authentication persists across pages and refreshes

---

## Test Scenario 7: Multiple Auth Methods

**Steps:**
1. Test connecting with **Wallet** (MetaMask/WalletConnect)
   - Should show wallet address in ConnectButton
2. Sign out, test with **Google**
   - Should show Google email in ConnectButton
3. Sign out, test with **Email**
   - Should show email in ConnectButton
4. Sign out, test with **Twitter**
   - Should show Twitter handle in ConnectButton

**What this proves:** ✅ All Privy auth methods work

---

## Quick Smoke Test (2 minutes) ⚡

1. ✅ Visit dashboard → See "Connect to Create Forms" button
2. ✅ Go to `/forms/create` → See auth prompt
3. ✅ Go to `/forms/test/edit` → See auth prompt
4. ✅ Click any "Connect" button → Privy modal opens
5. ✅ Connect with wallet → Authentication succeeds
6. ✅ Dashboard button changes to "Create New Form"
7. ✅ Click "Create New Form" → Form builder appears
8. ✅ Create and save a form → Form saves successfully
9. ✅ Sign out → Buttons change back to "Connect..."

**If all ✅ pass:** Authentication guards are working perfectly! 🎉

---

## Common Issues & Solutions

### Issue: "Privy modal doesn't open"
**Solution:** Check that `NEXT_PUBLIC_PRIVY_APP_ID` is set in `.env.local`

### Issue: "Page shows blank screen"
**Solution:** Check browser console for errors. Make sure dev server is running.

### Issue: "Authentication state doesn't persist"
**Solution:** This is expected in incognito mode. Use normal browser window.

### Issue: "Cannot connect with wallet"
**Solution:** Make sure MetaMask or wallet extension is installed

### Issue: "Forms don't appear after creating"
**Solution:** Check localStorage in Dev Tools → Application → Local Storage

---

## Next: Phase 2 - Supabase Integration 🚀

Once all tests pass, you're ready for:
- Setting up Supabase project
- Creating database schema
- Mapping users to forms
- Implementing server-side ownership checks

See `WEB3_IMPLEMENTATION_PLAN.md` for Phase 2 details!
