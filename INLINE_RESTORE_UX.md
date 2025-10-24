# Inline Per-Form Key Restoration UX

## 🎯 Implementation Summary

### Problem
The previous "Restore Keys (N)" button was not intuitive:
- ❌ Users didn't understand what "keys" meant
- ❌ Not clear which forms needed restoration
- ❌ Bulk action was intimidating
- ❌ Technical jargon (IPNS, keys, etc.)

### Solution
Implemented **inline per-form restoration** with clear, action-oriented UI:
- ✅ "Enable Editing on This Device" button on each form card
- ✅ Shows only on forms that need restoration
- ✅ Clear call-to-action with context
- ✅ No technical jargon
- ✅ One-click per form

---

## 📝 Changes Made

### 1. New Function: `handleRestoreSingleKey`
**Location:** `/pages/index.tsx` (lines ~223-260)

```typescript
const handleRestoreSingleKey = async (formId: string, formTitle: string) => {
  // Validates wallet connection
  // Calls restoreSingleIPNSKey from lib
  // Updates IPNS status for the form
  // Shows success/error toasts with clear messages
}
```

**Features:**
- Takes `formId` and `formTitle` for context
- Shows toast: "Enabling editing... {formTitle}"
- On success: "✅ Editing enabled! You can now edit this form"
- Updates only that form's status (no full reload)
- Decrements `needsRestore` counter

### 2. Updated Form Card UI
**Location:** `/pages/index.tsx` (lines ~595-610)

**Before:**
```tsx
{ipnsStatuses[form.id] === 'partial' && (
  <Badge variant="outline" className="bg-orange-500/10">
    <AlertTriangle className="h-3 w-3 mr-1" />
    IPNS⚠
  </Badge>
)}
```

**After:**
```tsx
{ipnsStatuses[form.id] === 'partial' && (
  <Button
    size="sm"
    variant="outline"
    className="w-full border-orange-500/50 hover:bg-orange-500/10"
    onClick={(e) => {
      e.preventDefault();
      handleRestoreSingleKey(form.id, form.title);
    }}
  >
    <Shield className="h-3.5 w-3.5 mr-2" />
    Enable Editing on This Device
  </Button>
)}
```

### 3. Updated Bulk Restore Button
**Location:** `/pages/index.tsx` (lines ~447-456)

**Before:**
- Always shown if `needsRestore > 0`
- Large button with "Restore Keys (N)"
- Prominent placement

**After:**
- Only shown if `needsRestore > 1` (multiple forms)
- Smaller, ghost variant: "Enable All (N)"
- Less prominent, secondary action
- Encourages per-form restoration

### 4. Removed Technical Warning Badge
**Removed:** Orange "IPNS⚠" badge with alert triangle
**Why:** Replaced by actionable button, no need for warning

### 5. Updated Success Badge
**Changed:** "Updateable permanent link (IPNS)" tooltip
**To:** "Updateable permanent link - Can be edited from any device"
**Why:** More user-friendly explanation

---

## 🎨 Visual Design

### Form Card with Partial Status
```
┌─────────────────────────────────────┐
│ Form Title                     [≡]  │
│ Description...                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🛡️  Enable Editing on This     │ │  ← NEW BUTTON
│ │      Device                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Edit]                      [View]  │
│ [Share Form]                        │
└─────────────────────────────────────┘
```

### Form Card with Full Status
```
┌─────────────────────────────────────┐
│ Form Title              [Active][🔗] │  ← IPNS badge
│ Description...                  [≡]  │
│                                     │
│ [Edit]                      [View]  │  ← No restore button
│ [Share Form]                        │
└─────────────────────────────────────┘
```

---

## 🔄 User Flow

### Old Flow (Confusing)
1. User sees forms on dashboard
2. Notices "Restore Keys (3)" button
3. Wonders: "What are keys? Why restore?"
4. Clicks reluctantly
5. Signs message (scary)
6. All 3 forms restored at once

### New Flow (Intuitive)
1. User sees forms on dashboard
2. Some forms show "Enable Editing on This Device"
3. User thinks: "Oh, I need to enable editing for this one"
4. Clicks on specific form
5. Signs message with form title in toast
6. Success: "✅ Editing enabled!"
7. Button disappears, can now edit

---

## 🧪 Testing Checklist

- [ ] Create form on Device A
- [ ] Connect same wallet on Device B
- [ ] Verify forms load from blockchain
- [ ] Verify "Enable Editing" button shows
- [ ] Click button on one form
- [ ] Sign message in wallet
- [ ] Verify success toast
- [ ] Verify button disappears
- [ ] Verify IPNS badge appears
- [ ] Click Edit - should work!
- [ ] Verify "Enable All (N)" button only shows if N>1
- [ ] Test with multiple forms needing restoration
- [ ] Verify counter decreases after each restoration

---

## 📊 UX Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Clarity** | "Restore Keys" | "Enable Editing on This Device" |
| **Context** | Global button | Per-form button |
| **Discoverability** | Easy to miss | On the form card |
| **Action scope** | All forms | Single form |
| **User confidence** | Low (technical) | High (clear action) |
| **Error recovery** | All or nothing | Retry individual forms |

---

## 🚀 Future Enhancements

1. **Auto-restore on edit attempt** (Option 3 from proposal)
   - If user clicks Edit without key
   - Show modal: "This form needs editing access"
   - Restore inline without going to dashboard

2. **Onboarding tooltip**
   - First time seeing "Enable Editing" button
   - Show tooltip explaining multi-device access

3. **Batch selection**
   - Checkboxes on forms
   - "Enable Editing for Selected (N)" button
   - More control than "Enable All"

4. **Status indicator**
   - Green dot: Ready to edit
   - Orange dot: Needs enabling
   - Gray dot: View only

---

## 🛠️ Technical Details

### Function Signature
```typescript
restoreSingleIPNSKey(
  formId: string,
  walletAddress: string,
  signMessageFn: (message: string) => Promise<string>
): Promise<RestoreResult>
```

### Toast Messages
- **Start:** "Enabling editing... {formTitle}"
- **Success:** "✅ Editing enabled! You can now edit this form"
- **Error:** "Failed to enable editing - {error message}"

### Performance
- Only updates status for restored form (no full reload)
- Uses existing `restoreSingleIPNSKey` from lib
- Reuses wallet signature if cached

---

## 📚 Files Modified

1. `/pages/index.tsx`
   - Added `handleRestoreSingleKey` function
   - Updated form card UI
   - Modified bulk restore button visibility
   - Removed warning badge

2. `/lib/ipns-restore.ts`
   - Already had `restoreSingleIPNSKey` function
   - No changes needed

---

## ✅ Completion Criteria

- [x] Add `handleRestoreSingleKey` function
- [x] Add "Enable Editing" button to form cards
- [x] Remove technical warning badge
- [x] Update bulk restore button (show only if >1)
- [x] Test signature: `restoreSingleIPNSKey(formId, walletAddress, signFn)`
- [x] Update tooltips for clarity
- [x] Add proper error handling
- [x] Update todo list

---

## 🎉 Result

A clean, intuitive UX where users:
- Know exactly which forms need action
- Understand what the action does (enable editing)
- Can act on forms individually
- Get clear feedback on success/failure
- Have a fallback "Enable All" for bulk operations

**No technical jargon. Clear actions. Better UX!** ✨
