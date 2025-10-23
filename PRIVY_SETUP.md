# 🔐 Privy Setup Guide

## What is Privy?

Privy is an authentication SDK that provides:
- ✅ Wallet connection (MetaMask, Coinbase Wallet, WalletConnect, etc.)
- ✅ Social login (Google, Twitter, Discord, Email)
- ✅ Embedded wallets (for users without crypto wallets)
- ✅ Multi-device support
- ✅ Built-in security

## Step 1: Create Privy Account

1. **Go to Privy Dashboard:**
   - Visit: https://dashboard.privy.io

2. **Sign Up:**
   - Click "Sign Up"
   - Use your email or GitHub

3. **Create New App:**
   - Click "Create New App"
   - App Name: "Form Builder" (or your preferred name)
   - Click "Create"

4. **Get Your App ID:**
   - You'll see your **App ID** on the dashboard
   - Format: `clp123abc456def789ghi`
   - Copy this - you'll need it!

## Step 2: Configure Privy App

### Enable Authentication Methods

1. **In Privy Dashboard, go to "Login Methods"**

2. **Enable Wallets:**
   - ✅ MetaMask
   - ✅ Coinbase Wallet
   - ✅ WalletConnect (supports 300+ wallets)
   - ✅ Rainbow
   - ✅ Embedded Wallets (for users without wallets)

3. **Enable Social Auth:**
   - ✅ Google
   - ✅ Twitter/X
   - ✅ Discord
   - ✅ Email (magic link)
   - ✅ SMS (phone number)

4. **Click "Save Changes"**

### Configure Networks

1. **Go to "Networks" tab**

2. **Enable Chains:**
   - ✅ Ethereum Mainnet
   - ✅ Polygon
   - ✅ Base
   - ✅ Arbitrum
   - ✅ Optimism
   - ✅ Any other EVM chains you want

3. **Set Default Chain:**
   - Choose "Ethereum Mainnet" or your preferred default

4. **Click "Save"**

### Configure App Settings

1. **Go to "App Settings"**

2. **Allowed Origins:**
   - Add: `http://localhost:3000` (for development)
   - Add: `https://yourdomain.com` (for production later)

3. **Webhook URL (Optional for now):**
   - Leave blank for now
   - We'll configure later if needed

4. **Click "Save"**

## Step 3: Get Your App ID

1. **Copy Your App ID:**
   - Find it in the dashboard (top of page)
   - Format: `clp123abc456def789ghi`

2. **Add to Environment Variables:**
   ```bash
   # In your .env.local file
   NEXT_PUBLIC_PRIVY_APP_ID=clp123abc456def789ghi
   ```

## Step 4: Verify Installation

After setup, you should have:
- ✅ Privy account created
- ✅ App created in dashboard
- ✅ Wallet login methods enabled
- ✅ Social auth methods enabled
- ✅ Networks configured
- ✅ App ID copied to `.env.local`

## Configuration Summary

### Your Privy App Settings

**Login Methods Enabled:**
- Wallets: MetaMask, Coinbase, WalletConnect, Embedded
- Social: Google, Twitter, Discord, Email, SMS

**Supported Networks:**
- All EVM chains (Ethereum, Polygon, Base, etc.)

**Authentication Flow:**
```
User visits app
  ↓
Clicks "Connect Wallet"
  ↓
Chooses: Wallet | Google | Twitter | Email
  ↓
Authenticates
  ↓
Gets wallet address + user info
  ↓
Can use app!
```

## Next Steps

After you've completed the setup:

1. **Copy your App ID** to `.env.local`
2. **Restart dev server**
3. **Test wallet connection**
4. **Test social auth**

## Troubleshooting

### "App ID not found"
- Make sure App ID is correct in `.env.local`
- Make sure it starts with `NEXT_PUBLIC_`
- Restart dev server after adding

### "Origin not allowed"
- Add `http://localhost:3000` to Allowed Origins in Privy Dashboard
- Save and try again

### "Login method not available"
- Check that the method is enabled in Privy Dashboard
- Social auth requires additional OAuth setup (Privy handles this)

### "Network not supported"
- Check that the chain is enabled in Networks tab
- Add the chain if missing

## Useful Links

- **Privy Dashboard:** https://dashboard.privy.io
- **Privy Docs:** https://docs.privy.io
- **Supported Wallets:** https://docs.privy.io/guide/react/wallets/wallet-list
- **Supported Chains:** https://docs.privy.io/guide/react/configuration/networks

---

## Security Notes

### What Privy Stores
- ✅ User's wallet address
- ✅ User's social profile (if social auth)
- ✅ User's email (if email auth)
- ✅ Authentication state

### What Privy DOESN'T Store
- ❌ Private keys (user controls these)
- ❌ Your form data
- ❌ User's sensitive information

### Privacy
- Privy is SOC 2 Type II compliant
- Supports self-custodial wallets
- User controls their keys
- You can export/delete user data anytime

---

## Once Setup is Complete

Return to the main implementation and I'll configure the Privy provider in your Next.js app!

**Checklist:**
- [ ] Created Privy account
- [ ] Created app in dashboard
- [ ] Enabled wallet login
- [ ] Enabled social auth
- [ ] Configured networks
- [ ] Copied App ID to `.env.local`
- [ ] Ready to continue! ✅
