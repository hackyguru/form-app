# Response Submission Testing Guide

## Quick Test Steps

### 1. Create a Test Form
```
→ Visit http://localhost:3000
→ Connect wallet
→ Click "Create New Form"
→ Fill form details
→ Add fields (name, email, message)
→ Click "Create Form"
→ Note the IPNS name (k51qzi5uqu...)
```

### 2. Submit a Response
```
→ Fill out the form at /forms/view/[ipns]
→ Click "Submit Response"
→ Wait for "Submitting..." → Success
→ Check console for CID and tx hash
```

### 3. View Responses
```
→ Go to /forms/[ipns]/responses
→ See response list
→ Click "View Details"
→ Click "Load from IPFS"
→ Verify data displays
```

### 4. Export CSV
```
→ Submit multiple responses
→ Click "Export CSV"
→ Check downloaded file
```

## Console Testing

### Test Response API
```javascript
fetch('/api/responses/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    formId: 'k51qzi5uqu...',
    responseData: {
      formId: 'k51qzi5uqu...',
      formTitle: 'Test',
      submittedAt: new Date().toISOString(),
      responses: { Name: 'John', Email: 'john@test.com' }
    },
    submitterAddress: null,
    verified: false,
    identityType: ''
  })
}).then(r => r.json()).then(console.log);
```

## Checklist
- [ ] Form creation works
- [ ] Response submission succeeds
- [ ] Success message displays
- [ ] Responses page shows data
- [ ] IPFS loading works
- [ ] CSV export works

## Verification

**Blockchain:**
https://sepoliascan.status.network/address/0x8bc8fCaE07bAc66DC80ea66336Ccece705DC2154

**IPFS:**
https://w3s.link/ipfs/[CID]
