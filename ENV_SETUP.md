# ⚙️ Environment Variables Setup

## Current Status

Your `.env.local` file now has a placeholder for the Privy App ID:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=
```

## 🎯 What You Need to Do

### Step 1: Create Privy Account & Get App ID

1. **Go to Privy Dashboard:**
   ```
   https://dashboard.privy.io
   ```

2. **Sign up for free** (takes 2 minutes)

3. **Create a new app:**
   - Click "+ Create New App"
   - Name: "Form Builder" (or whatever you like)
   - Click "Create"

4. **Copy your App ID:**
   - You'll see it at the top of the dashboard
   - Format: `clp1a2b3c4d5e6f7g8h9`
   - **This is what you need!**

### Step 2: Configure Your App

While you're in the Privy Dashboard:

1. **Enable Login Methods:**
   - Go to "Login Methods" tab
   - Enable:
     - ✅ Wallets (MetaMask, WalletConnect, etc.)
     - ✅ Embedded Wallets
     - ✅ Email
     - ✅ Google
     - ✅ Twitter/X
     - ✅ Discord
     - ✅ GitHub
   - Click "Save"

2. **Add Allowed Origin:**
   - Go to "Settings" tab
   - Under "Allowed Origins" add:
     ```
     http://localhost:3000
     ```
   - Click "Save"

### Step 3: Add App ID to .env.local

1. **Open your `.env.local` file**

2. **Replace the empty value:**
   ```bash
   # Before:
   NEXT_PUBLIC_PRIVY_APP_ID=
   
   # After:
   NEXT_PUBLIC_PRIVY_APP_ID=clp1a2b3c4d5e6f7g8h9
   ```

3. **Save the file**

### Step 4: Restart Dev Server

```bash
# Stop the current dev server (Ctrl+C if running)
# Then start it again:
npm run dev
```

---

## ✅ Complete .env.local Example

After you add your Privy App ID, your file should look like:

```bash
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=clp1a2b3c4d5e6f7g8h9

# Storacha Configuration
STORACHA_KEY=MgCZ3dJwOWhCrq8RNZwzlJQ6x1JCsXakGVK6GRrzIjS0Cs+0Bawu70SN2MFNq/A2XAiJgb42q1+QN3QXhSavOIqIVogU=
STORACHA_PROOF=mAYIEALwWOqJ...
```

---

## 🧪 Test Your Setup

After adding the App ID and restarting:

1. **Open your app:**
   ```
   http://localhost:3000
   ```

2. **Look for the "Connect Wallet" button** in the top right

3. **Click it:**
   - You should see Privy's connection modal
   - Options: Wallet, Email, Google, Twitter, etc.

4. **Try connecting:**
   - Choose any method
   - Complete the authentication
   - You should see your address/profile

---

## 🐛 Troubleshooting

### "App ID not found" or blank modal

**Problem:** App ID is missing or incorrect

**Solution:**
- Check that you copied the FULL App ID from Privy Dashboard
- Make sure it starts with `NEXT_PUBLIC_PRIVY_APP_ID=`
- No quotes needed around the value
- Restart dev server after changing

### "Origin not allowed"

**Problem:** localhost:3000 not in allowed origins

**Solution:**
- In Privy Dashboard → Settings → Allowed Origins
- Add: `http://localhost:3000`
- Save and try again

### Nothing happens when clicking "Connect Wallet"

**Problem:** JavaScript error or missing dependency

**Solution:**
- Check browser console (F12) for errors
- Make sure all packages installed: `npm install`
- Restart dev server

---

## 📝 Quick Checklist

- [ ] Created Privy account
- [ ] Created new app in Privy Dashboard
- [ ] Enabled all login methods (wallets + social)
- [ ] Added `http://localhost:3000` to allowed origins
- [ ] Copied App ID from dashboard
- [ ] Added App ID to `.env.local`
- [ ] Restarted dev server
- [ ] Tested "Connect Wallet" button
- [ ] Successfully connected!

---

## 🎉 Once Complete

After you've added your Privy App ID and tested the connection, you'll be ready to:

1. ✅ Connect with any wallet (MetaMask, Coinbase, etc.)
2. ✅ Authenticate with social accounts (Google, Twitter, etc.)
3. ✅ See user info in the dropdown
4. ✅ Move to Phase 2: Supabase integration!

---

## 💡 Pro Tip

**Keep your `.env.local` file safe!**
- Never commit it to git (already in `.gitignore`)
- Don't share it publicly
- Make a backup copy somewhere safe

The App ID is safe to share publicly (it's in the frontend code), but keep your Storacha keys private!

---

**Need help?** Just let me know! 🚀
