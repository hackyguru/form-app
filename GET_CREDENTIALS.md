# How to Get Your Storacha Credentials

## Quick Start Guide

Follow these steps in your terminal to get the `STORACHA_KEY` and `STORACHA_PROOF` values.

## Step 1: Install Storacha CLI

Open a **new terminal window** (separate from your dev server) and run:

```bash
npm install -g @storacha/cli
```

This installs the Storacha command-line tool globally.

## Step 2: Login to Storacha

```bash
storacha login your-email@example.com
```

Replace `your-email@example.com` with your actual email address.

**What happens:**
- You'll receive an email with a validation link
- Click the link to verify your email
- Return to terminal when done

## Step 3: Create a Space

A "Space" is like a storage bucket for your forms.

```bash
storacha space create my-forms-space
```

**Output example:**
```
did:key:z6MkrZ1r5... # This is your Space DID
```

**Important:** Copy and save this Space DID somewhere safe!

## Step 4: Select Your Space

```bash
storacha space use did:key:z6MkrZ1r5...
```

Replace with your actual Space DID from Step 3.

You can verify it's selected:
```bash
storacha space ls
```

You should see a `*` next to your space.

## Step 5: Create Agent Key (Get STORACHA_KEY)

This creates a new agent (identity) that your backend will use:

```bash
storacha key create
```

**Output example:**
```
did:key:z6MkrZ1r5YJF... # Your Agent DID
MgCZT5YJF... # YOUR PRIVATE KEY ← THIS IS STORACHA_KEY!
```

**CRITICAL:**
- Copy the line starting with `Mg...` - this is your `STORACHA_KEY`
- Keep it secret - never commit to git!
- Save the Agent DID (starts with `did:key:`) for next step

## Step 6: Create Delegation (Get STORACHA_PROOF)

This delegates permissions from your Space to your Agent:

```bash
storacha delegation create did:key:z6MkrZ1r5YJF... --base64
```

Replace `did:key:z6MkrZ1r5YJF...` with your Agent DID from Step 5.

**Output example:**
```
uOqJlcm9vdHOB2CpYJQABcRIgL+bm8reAMBg5kbjpu1Sk... (very long base64 string)
```

**CRITICAL:**
- Copy the entire output - this is your `STORACHA_PROOF`
- It's a very long string - make sure you get all of it!

## Step 7: Add to .env.local

Now add both values to your `.env.local` file:

```bash
# Open in your editor
code .env.local
# or
nano .env.local
```

Add these lines:

```env
STORACHA_KEY=MgCZT5YJF...
STORACHA_PROOF=uOqJlcm9vdHOB2CpYJQABcRIgL...
```

**Example `.env.local`:**
```env
# Storacha/IPFS Configuration
STORACHA_KEY=MgCZT5YJFpQiYXNSuBNpFAQpY3hJHKBmTBWkD1kHBqE3AKLmN9Pv
STORACHA_PROOF=uOqJlcm9vdHOB2CpYJQABcRIgL+bm8reAMBg5kbjpu1SkdoixVQwVHfM0dpOEUKKZa2RmaXR0ZXJzgaNpc3BhY2VYJdidBAgp4SxhSzVONRPxEhCJD9D9VGFkb3RtZXRhgaRpc2l0ZaJhdmQvcmV2b2tlZC9hZGRidm4xYW1tZXRhZGF0YaJlc3BhY2VYJdidBAgp4SxhSzVONRPxEhCJD9D9VamlzdGltZRkH9mxpc2tleVglLSAgLS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0K...
```

## Step 8: Restart Your Dev Server

After saving `.env.local`:

1. Stop your current dev server (Ctrl+C or Cmd+C)
2. Restart it:
   ```bash
   npm run dev
   ```

## Step 9: Test It!

1. Go to `http://localhost:3000`
2. Click "Create New Form"
3. Add a title, description, and some fields
4. Click "Save Form"
5. You should see:
   - Toast: "Uploading form to IPFS..."
   - Toast: "Form created successfully! CID: bafybei..."
   - Redirect to `/forms/view/{cid}`

If it works, your credentials are correct! 🎉

## Troubleshooting

### "storacha: command not found"

The CLI isn't installed. Run:
```bash
npm install -g @storacha/cli
```

If that fails, try:
```bash
sudo npm install -g @storacha/cli
```

### "Failed to login" or "Email not verified"

1. Check your spam folder for the verification email
2. Make sure you clicked the link in the email
3. Try logging in again:
   ```bash
   storacha login your-email@example.com
   ```

### "No space selected"

You need to create and select a space:
```bash
storacha space create my-forms-space
storacha space use <space-did-from-output>
```

### "Delegation creation error: Non-base64pad character"

This means the `STORACHA_PROOF` in your `.env.local` is incomplete or incorrect.

**Fix:**
1. Run the delegation command again:
   ```bash
   storacha delegation create <your-agent-did> --base64
   ```
2. Copy the ENTIRE output (it's very long!)
3. Replace `STORACHA_PROOF` in `.env.local`
4. Make sure there are no line breaks in the value
5. Restart dev server

### "Failed to get delegation from backend"

**Check:**
1. `.env.local` file exists in project root
2. Both `STORACHA_KEY` and `STORACHA_PROOF` are set
3. No extra spaces or quotes around the values
4. Dev server was restarted after adding credentials

### "Failed to upload form to IPFS"

**Possible causes:**
1. Invalid or expired delegation
2. Network/internet connection issues
3. Storacha service temporarily down

**Fix:**
1. Check your internet connection
2. Recreate the delegation (Step 6)
3. Check Storacha status: https://status.storacha.network

## Verification Commands

### Check if CLI is installed:
```bash
storacha --version
```

### Check your account:
```bash
storacha whoami
```

### List your spaces:
```bash
storacha space ls
```

### Check current space:
```bash
storacha space use
```

## Security Best Practices

1. **Never commit `.env.local` to git**
   - It's in `.gitignore` by default
   - Double-check: `git status` shouldn't show `.env.local`

2. **Keep credentials private**
   - Don't share your `STORACHA_KEY`
   - Don't share your `STORACHA_PROOF`
   - These give full access to your Storacha space

3. **Rotate periodically**
   - Create new delegations every few months
   - Revoke old ones if compromised

4. **Use different spaces for dev/prod**
   - Development: `storacha space create dev-forms`
   - Production: `storacha space create prod-forms`

## Quick Reference

### My Credentials Checklist

- [ ] Installed Storacha CLI
- [ ] Logged in with email
- [ ] Created a Space
- [ ] Selected my Space
- [ ] Created Agent key (saved `STORACHA_KEY`)
- [ ] Created delegation (saved `STORACHA_PROOF`)
- [ ] Added both to `.env.local`
- [ ] Restarted dev server
- [ ] Tested form creation

### Commands Summary

```bash
# 1. Install
npm install -g @storacha/cli

# 2. Login
storacha login your-email@example.com

# 3. Create Space
storacha space create my-forms-space

# 4. Use Space
storacha space use <space-did>

# 5. Create Key
storacha key create
# Copy the line starting with "Mg..." → STORACHA_KEY

# 6. Create Delegation
storacha delegation create <agent-did> --base64
# Copy entire output → STORACHA_PROOF
```

## Example Values

**These are FAKE examples - you need to generate your own!**

```env
# DO NOT USE THESE - GENERATE YOUR OWN!
STORACHA_KEY=MgCZT5YJFpQiYXNSuBNpFAQpY3hJHKBmTBWkD1kHBqE3AKLmN9Pv
STORACHA_PROOF=uOqJlcm9vdHOB2CpYJQABcRIgL+bm8reAMBg5kbjpu1SkdoixVQwVHfM0dpOEUKKZa2RmaXR0ZXJzgaNpc3BhY2VYJdidBAgp4SxhSzVONRPxEhCJD9D9VGFkb3RtZXRhgaRpc2l0ZaJhdmQvcmV2b2tlZC9hZGRidm4xYW1tZXRhZGF0YaJlc3BhY2VYJdidBAgp4SxhSzVONRPxEhCJD9D9VamlzdGltZRkH9mxpc2tleVglLSAgLS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0K
```

## Need More Help?

- **Storacha Docs:** https://docs.storacha.network
- **Discord:** https://discord.gg/storacha
- **GitHub:** https://github.com/storacha/storacha

---

**Pro Tip:** Save your Space DID, Agent DID, and both credentials in a password manager for future reference!
