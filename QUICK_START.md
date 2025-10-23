# Quick Reference: Testing Your Blockchain-Integrated Forms

## 🚀 Quick Start (5 Minutes)

### 1. Start Dev Server
```bash
cd /Users/guru/Desktop/Makeyard/form-app
npm run dev
```
**Server:** http://localhost:3000

### 2. Create a Form
1. Navigate to: http://localhost:3000/forms/create
2. Enter title: "My First Blockchain Form"
3. Choose privacy mode:
   - **Identified** = Track identities (flexible)
   - **Anonymous** = Maximum privacy (50% cheaper)
4. Add some fields
5. Click "Save Form"

### 3. Watch the Magic! ✨
**Toast Notifications:**
1. "Uploading form to IPFS..."
2. "Creating permanent IPNS address..."
3. "Publishing to IPNS..."
4. "Registering on blockchain..." ← NEW!
5. "Form registered on blockchain!" ← NEW!
6. "Form created successfully!"

**Console Output:**
```
Form uploaded to IPFS. CID: bafybei...
IPNS name created: k51qzi5uqu5...
Published CID to IPNS
✅ Form registered on blockchain: {
  txHash: '0x123abc...',
  explorer: 'https://sepoliascan.status.network/tx/0x123abc...'
}
```

### 4. Verify on Blockchain
Click the explorer link from console or visit:
```
https://sepoliascan.status.network/tx/{YOUR_TX_HASH}
```

---

## 🎯 What to Look For

### ✅ Success Indicators

1. **Privacy Mode Selector Works**
   - Cards are clickable
   - Visual feedback on selection
   - Info box changes
   - No console errors

2. **Form Saves Successfully**
   - All toast notifications appear
   - Redirects to form view
   - No error toasts

3. **Blockchain Registration**
   - See "Registering on blockchain..." toast
   - Console shows transaction hash
   - Explorer link works
   - Transaction confirmed on Status Network

4. **Zero Gas Fees**
   - No MetaMask popup
   - No wallet connection required
   - User pays nothing!

### ❌ Common Issues

**Issue:** "Server configuration error"
**Fix:** Check `.env.local` has all required variables:
- `SERVER_WALLET_PRIVATE_KEY`
- `STATUS_NETWORK_RPC`
- `NEXT_PUBLIC_FORM_REGISTRY_ADDRESS`

**Issue:** "Failed to register on blockchain"
**Fix:** Form still saves to IPFS! Blockchain is optional enhancement.
Check server wallet has enough testnet ETH.

**Issue:** Privacy mode selector not rendering
**Fix:** Restart dev server: `npm run dev`

---

## 🧪 Test Scenarios

### Scenario 1: Identified Form
```
Title: "Employee Feedback Survey"
Privacy Mode: Identified
Fields: Name, Email, Feedback
Expected: Form registers with privacyMode=0 (IDENTIFIED)
```

### Scenario 2: Anonymous Form
```
Title: "Anonymous Whistleblower Report"
Privacy Mode: Anonymous  
Fields: Issue Description, Evidence
Expected: Form registers with privacyMode=1 (ANONYMOUS)
Gas: 50% cheaper!
```

### Scenario 3: Test Blockchain Query
```bash
# Get form details
curl "http://localhost:3000/api/blockchain/get-form?formId={YOUR_FORM_ID}"

# Expected response:
{
  "success": true,
  "form": {
    "creator": "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF",
    "ipnsName": "k51qzi5uqu5...",
    "privacyMode": "identified",
    "createdAt": 1729721212,
    "active": true,
    "submissionCount": 0
  }
}
```

---

## 📊 Check Your Work

### Status Network Explorer
**Contract:** https://sepoliascan.status.network/address/0x1c10424bF8149F7cB10d1989679bfA6933799e4d

**What to Check:**
- ✅ "FormCreated" events appear
- ✅ Creator address is correct
- ✅ IPNS name is stored
- ✅ Privacy mode is correct (0 or 1)
- ✅ Transaction confirmed

### Console Checks
```javascript
// In browser console
localStorage.getItem('forms') // Should show your forms
localStorage.getItem('ipns-mappings') // Should show IPNS names
```

### Backend Logs
Check terminal running `npm run dev`:
```
🔗 Registering form on blockchain: {
  formId: 'form-1729721212345',
  creator: '0x18331B7b011d822F963236d0b6b8775Fb86fc1AF',
  privacyMode: 'identified',
  ipnsName: 'k51...'
}
📤 Transaction sent: 0x123abc...
⏳ Waiting for confirmation...
✅ Transaction confirmed! { blockNumber: 11679900, gasUsed: '145678' }
```

---

## 💡 Pro Tips

1. **Keep dev server running** - Hot reload works!
2. **Check browser console** - All blockchain logs appear there
3. **Use Status Network explorer** - Bookmark it for quick access
4. **Test both privacy modes** - See the gas difference!
5. **Save transaction hashes** - For later reference

---

## 🎉 Success!

If you see:
- ✅ Privacy mode selector working
- ✅ Form creation succeeds
- ✅ Transaction hash in console
- ✅ Form appears on Status Network explorer
- ✅ No MetaMask popups
- ✅ Zero gas fees for user

**YOU DID IT!** 🎊

Your form app now has:
- Decentralized storage (IPFS)
- Permanent addresses (IPNS)
- Blockchain verification (Status Network)
- Dual privacy modes
- Zero user costs

**All working together seamlessly!** 🚀

---

## 🆘 Need Help?

**Check Documentation:**
- `PHASE_2_COMPLETE.md` - Full summary
- `BLOCKCHAIN_API_DOCS.md` - API reference
- `PRIVACY_MODE_UI_COMPLETE.md` - UI details
- `STATUS_NETWORK_GUIDE.md` - Architecture guide

**Common Commands:**
```bash
# Restart server
npm run dev

# Check contract deployment
cat deployments/statusTestnet.json

# View environment variables
cat .env.local | grep -v "KEY="

# Clear cache and restart
rm -rf .next && npm run dev
```

---

**Ready to create blockchain-verified forms!** 🎯
