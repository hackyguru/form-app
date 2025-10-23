# Form App - User Guide

## Getting Started

This privacy-first form application uses JSON-based storage to prepare for decentralized IPFS integration. Forms are stored locally and can be easily exported for use on distributed networks.

## Quick Start

1. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

2. **Create Your First Form**
   - Click "Create New Form" on the dashboard
   - Add title and description
   - Add form fields
   - Configure validation rules
   - Save form

3. **Share Your Form**
   - Forms are accessible via `/forms/{id}/preview`
   - Copy the URL to share with respondents
   - Forms can be in three states: Active, Paused, or Closed

## Features

### 1. Form Creation

#### Adding Fields
Click the field type buttons to add:
- **Text**: Single-line text input
- **Textarea**: Multi-line text input
- **Email**: Email address with validation
- **Phone**: Phone number input
- **Number**: Numeric input only
- **Date**: Date picker
- **Select**: Dropdown menu (requires options)
- **Radio**: Radio button group (requires options)
- **Checkbox**: Single checkbox toggle

#### Field Configuration
For each field, you can set:
- **Label**: Display name for the field
- **Placeholder**: Helper text in the input
- **Required**: Make field mandatory
- **Validation Rules**:
  - Minimum length
  - Maximum length
  - Pattern matching (regex)
  - Custom error messages

#### Managing Options (Select/Radio)
1. Click "Add Option" to add new choices
2. Type option values
3. Remove options with the X button
4. Options are saved as part of the form metadata

### 2. Form Management

#### Dashboard View
- See all your forms at a glance
- View form status (Active/Paused/Closed)
- See creation dates
- Quick actions: Edit, Duplicate, Delete, View Responses

#### Form Status
Change form status to control submissions:
- **Active** (Green): Accepting responses
- **Paused** (Yellow): Temporarily not accepting
- **Closed** (Red): Permanently closed

#### Duplicating Forms
Create a copy of any form:
1. Click the copy icon
2. New form appears with "(Copy)" in title
3. Edit the duplicate independently

#### Deleting Forms
Permanently remove a form:
1. Click the trash icon
2. Confirm deletion
3. Form and all data removed

### 3. Form Preview & Submission

#### Preview Modes
Toggle between different device views:
- **Desktop**: Full-width layout
- **Tablet**: Medium-width layout
- **Mobile**: Narrow layout optimized for phones

#### Form Rendering
Forms render dynamically based on metadata:
- All field types render correctly
- Validation rules are enforced
- Required fields must be filled
- Error messages show for invalid inputs

#### Status Display
Non-active forms show appropriate messages:
- Paused forms: "Temporarily Paused" with yellow styling
- Closed forms: "Form Closed" with red styling
- Privacy notice always visible

### 4. Privacy & Security

#### Current Features
- Client-side only processing
- No server-side storage
- Forms stored in browser localStorage
- Ready for encryption layer

#### Coming Soon
- End-to-end encryption
- IPFS decentralized storage
- Zero-knowledge proofs
- Privacy-preserving analytics

## JSON Structure

### How Forms Are Stored

Forms are saved as JSON objects in localStorage with this structure:

```json
{
  "id": "form-1737805200000",
  "title": "Customer Feedback Survey",
  "description": "We value your feedback",
  "status": "active",
  "fields": [
    {
      "id": "field-1",
      "type": "text",
      "label": "Full Name",
      "placeholder": "Enter your name",
      "required": true,
      "validation": {
        "minLength": 2,
        "maxLength": 50,
        "errorMessage": "Name must be 2-50 characters"
      }
    },
    {
      "id": "field-2",
      "type": "email",
      "label": "Email Address",
      "placeholder": "you@example.com",
      "required": true
    },
    {
      "id": "field-3",
      "type": "select",
      "label": "How did you hear about us?",
      "placeholder": "Select an option",
      "required": false,
      "options": [
        { "id": "opt-1", "value": "Social Media" },
        { "id": "opt-2", "value": "Friend" },
        { "id": "opt-3", "value": "Advertisement" }
      ]
    }
  ],
  "createdAt": "2024-01-25T10:00:00Z",
  "updatedAt": "2024-01-25T10:00:00Z",
  "version": "1.0"
}
```

### Storage Keys

Forms use these localStorage keys:
- `form-ids`: Array of all form IDs
- `form-meta-{id}`: Individual form metadata
- `form-response-{formId}-{responseId}`: Individual responses (future)

### Exporting Forms

To export a form as JSON:
```javascript
// In browser console
const formId = 'your-form-id';
const formData = localStorage.getItem(`form-meta-${formId}`);
console.log(formData);
// Copy and save to .json file
```

### Importing Forms

To import a form from JSON:
```javascript
// In browser console
const jsonData = '{ ... }'; // Your JSON string
const metadata = JSON.parse(jsonData);
localStorage.setItem(`form-meta-${metadata.id}`, jsonData);

// Add ID to form list
const ids = JSON.parse(localStorage.getItem('form-ids') || '[]');
ids.push(metadata.id);
localStorage.setItem('form-ids', JSON.stringify(ids));

// Refresh page
location.reload();
```

## Field Validation Guide

### Text Validation

**Minimum Length**
```json
{
  "validation": {
    "minLength": 3,
    "errorMessage": "Must be at least 3 characters"
  }
}
```

**Maximum Length**
```json
{
  "validation": {
    "maxLength": 100,
    "errorMessage": "Must be less than 100 characters"
  }
}
```

**Pattern Matching**
```json
{
  "validation": {
    "pattern": "^[A-Za-z]+$",
    "errorMessage": "Only letters allowed"
  }
}
```

### Common Patterns

**Phone Numbers**
```regex
^\+?[1-9]\d{1,14}$
```

**Postal Codes (US)**
```regex
^\d{5}(-\d{4})?$
```

**Usernames**
```regex
^[a-zA-Z0-9_-]{3,16}$
```

**URLs**
```regex
^https?://[^\s]+$
```

## Troubleshooting

### Form Not Saving
**Issue**: Form doesn't appear on dashboard after saving

**Solutions**:
1. Check browser console for errors
2. Ensure all required fields have values
3. Try in incognito mode (rule out extensions)
4. Clear localStorage and try again

### Fields Not Rendering
**Issue**: Form preview shows blank fields

**Solutions**:
1. Check field type is supported
2. Verify JSON structure in localStorage
3. Check browser console for errors
4. Try duplicating the form

### Validation Not Working
**Issue**: Form accepts invalid inputs

**Solutions**:
1. Check validation object structure
2. Test regex pattern separately
3. Ensure field type supports validation
4. Browser may not support HTML5 validation

### Performance Issues
**Issue**: App feels slow with many forms

**Solutions**:
1. Check number of forms (localStorage has limits)
2. Delete old test forms
3. Export and archive old forms
4. Clear browser cache

### Lost Forms
**Issue**: Forms disappeared after closing browser

**Solutions**:
1. Check if localStorage was cleared
2. Look in browser history for form IDs
3. Check if incognito mode was used
4. Implement regular exports as backup

## Best Practices

### Form Design
1. **Keep It Short**: Fewer fields = higher completion rate
2. **Clear Labels**: Descriptive, concise field labels
3. **Smart Defaults**: Use placeholders as examples
4. **Group Related Fields**: Logical field ordering
5. **Progressive Disclosure**: Hide advanced options

### Validation
1. **Be Specific**: Clear error messages
2. **Real-time Feedback**: Show errors as user types
3. **Don't Over-validate**: Balance security and UX
4. **Test Patterns**: Verify regex before deploying
5. **Provide Examples**: Show format in placeholder

### Privacy
1. **Minimal Data**: Only collect what you need
2. **Clear Purpose**: Explain why you need data
3. **Secure Storage**: Prepare for encryption
4. **Data Retention**: Plan deletion policy
5. **Transparency**: Show privacy notice

### Performance
1. **Limit Fields**: Max 10-15 fields per form
2. **Optimize Options**: Keep select lists under 20 items
3. **Regular Cleanup**: Delete unused forms
4. **Export Old Forms**: Archive instead of deleting
5. **Test Performance**: Check with many forms

## Keyboard Shortcuts

### Form Builder
- `Enter`: Save form (when title focused)
- `Escape`: Clear search/close dialogs
- `Tab`: Navigate between fields

### Dashboard
- `N`: Create new form
- `S`: Focus search box
- `Escape`: Clear search

## Browser Compatibility

### Tested Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Required Features
- localStorage support
- HTML5 form validation
- ES6+ JavaScript
- CSS Grid and Flexbox

### Known Issues
- Safari: Date picker styling differs
- Firefox: Number input spinners hidden
- Mobile Safari: Zoom on input focus

## Future Roadmap

### Phase 1: IPFS Integration (Next)
- [ ] IPFS node connection
- [ ] Form upload to IPFS
- [ ] Form retrieval from IPFS
- [ ] IPFS hash as form ID
- [ ] Pinning service integration

### Phase 2: Encryption
- [ ] Client-side encryption
- [ ] Key management
- [ ] Response encryption
- [ ] Secure key sharing
- [ ] Zero-knowledge proofs

### Phase 3: Advanced Features
- [ ] Conditional logic
- [ ] File uploads
- [ ] Multi-page forms
- [ ] Save draft responses
- [ ] Form templates

### Phase 4: Analytics
- [ ] Privacy-preserving analytics
- [ ] Response visualization
- [ ] Export to CSV
- [ ] Real-time dashboard
- [ ] Aggregate statistics

## Support & Resources

### Documentation
- `ARCHITECTURE.md`: Technical architecture details
- `README.md`: Project setup and development
- `USAGE_GUIDE.md`: This user guide

### Getting Help
1. Check browser console for errors
2. Review localStorage data structure
3. Test in incognito mode
4. Export form JSON for debugging

### Contributing
Contributions welcome! Areas to improve:
- Additional field types
- Enhanced validation
- Better error handling
- UI/UX improvements
- Performance optimizations

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Status**: Production Ready (localStorage), IPFS Pending
