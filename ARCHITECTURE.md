# Form App Architecture

## Overview
This application has been restructured to use JSON-based form storage, preparing for future IPFS integration. Forms are stored as structured metadata that can be easily serialized, stored on decentralized networks, and rendered dynamically.

## Core Concepts

### 1. JSON-Based Form Storage
Forms are no longer hardcoded but stored as JSON structures (`form-meta.json` conceptually). Each form is a complete metadata object containing:
- Form information (title, description, status)
- Field definitions (type, label, validation rules)
- Timestamps and versioning
- Unique identifiers

### 2. Storage Abstraction Layer
The `lib/form-storage.ts` module provides a clean abstraction between the UI and storage mechanism:
- Currently uses `localStorage` for temporary storage
- Designed for easy migration to IPFS
- All storage operations go through this module
- Storage keys follow pattern: `form-meta-${formId}`

### 3. Type Safety
Comprehensive TypeScript interfaces in `types/form.ts` ensure:
- Type-safe form creation and editing
- Consistent data structure across the app
- Easy validation and error checking
- Future-proof schema evolution

## File Structure

```
/types/form.ts                    # TypeScript interfaces
/lib/form-storage.ts              # Storage abstraction layer
/pages/index.tsx                  # Dashboard (loads all forms)
/pages/forms/create.tsx           # Form builder (saves as JSON)
/pages/forms/[id]/preview.tsx     # Form renderer (loads from JSON)
/pages/forms/[id]/responses.tsx   # Response viewer
/pages/forms/[id]/edit.tsx        # Form editor
```

## Data Flow

### Creating a Form
1. User builds form in `/forms/create`
2. Form data structured as `FormMetadata` object
3. `saveFormMetadata(formData)` saves to localStorage
4. Form ID added to `form-ids` array
5. User redirected to preview page

### Loading Forms
1. Dashboard calls `loadAllForms()`
2. Function reads `form-ids` array
3. Loads each form via `loadFormMetadata(id)`
4. Returns array of `FormMetadata` objects
5. Dashboard renders form cards

### Rendering a Form
1. Preview page extracts `id` from URL
2. `loadFormMetadata(id)` retrieves form data
3. Fields dynamically rendered based on type
4. Form respects status (active/paused/closed)
5. Validation rules applied from metadata

### Duplicating a Form
1. User clicks duplicate on dashboard
2. `duplicateForm(id)` creates copy with new ID
3. New form saved to localStorage
4. Dashboard state updated with new form

### Deleting a Form
1. User confirms deletion
2. `deleteFormMetadata(id)` removes form
3. ID removed from `form-ids` array
4. Dashboard state updated

## Type Definitions

### FormMetadata
```typescript
{
  id: string;                    // Unique identifier (timestamp-based)
  title: string;                 // Form title
  description: string;           // Form description
  status: "active" | "paused" | "closed";
  fields: FormField[];           // Array of form fields
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  version: string;               // For future compatibility
}
```

### FormField
```typescript
{
  id: string;                    // Unique field ID
  type: "text" | "textarea" | "email" | "phone" | "number" | 
        "select" | "radio" | "checkbox" | "date";
  label: string;                 // Field label
  placeholder?: string;          // Optional placeholder
  required: boolean;             // Required validation
  options?: FormFieldOption[];   // For select/radio fields
  validation?: FormFieldValidation;  // Custom validation rules
}
```

### FormFieldValidation
```typescript
{
  minLength?: number;            // Minimum length
  maxLength?: number;            // Maximum length
  pattern?: string;              // Regex pattern
  errorMessage?: string;         // Custom error message
}
```

### FormFieldOption
```typescript
{
  id: string;                    // Option ID
  value: string;                 // Option value/label
}
```

### FormResponse
```typescript
{
  id: string;                    // Response ID
  formId: string;                // Associated form ID
  data: Record<string, string>;  // Field values
  submittedAt: string;           // ISO timestamp
  ipfsHash?: string;             // Future IPFS hash
}
```

## Storage Functions

### Core Operations
- `saveFormMetadata(metadata: FormMetadata)` - Save/update form
- `loadFormMetadata(id: string)` - Load single form
- `loadAllForms()` - Load all forms
- `deleteFormMetadata(id: string)` - Delete form
- `duplicateForm(id: string)` - Clone form with new ID

### Utility Functions
- `getAllFormIds()` - Get array of all form IDs
- `generateFormMetadataJSON(metadata: FormMetadata)` - Export JSON string
- `parseFormMetadataJSON(json: string)` - Parse JSON string

## Field Type Rendering

### Text Fields
- **text**: Basic text input with validation
- **email**: Email input with built-in validation
- **phone**: Tel input for phone numbers
- **number**: Numeric input
- **date**: Date picker
- **textarea**: Multi-line text input

### Selection Fields
- **select**: Dropdown menu from options
- **radio**: Radio button group from options
- **checkbox**: Single checkbox toggle

## Validation System

### Built-in Validation
- `required`: Field must have value
- `minLength`: Minimum character length
- `maxLength`: Maximum character length
- `pattern`: Regex pattern matching
- `type`: Email, number, etc. (browser validation)

### Custom Error Messages
Each field can have a custom error message displayed below the input.

## Form Status System

### Active
- Form accepts responses
- Full form rendered with submit button
- Default status for new forms

### Paused
- Form temporarily not accepting responses
- Shows yellow "temporarily paused" message
- Can be reactivated by form creator

### Closed
- Form permanently closed
- Shows red "closed" message
- Indicates no longer accepting responses

## Future IPFS Integration

The architecture is ready for IPFS integration:

### Current State (localStorage)
```javascript
// Saving
localStorage.setItem(`form-meta-${id}`, JSON.stringify(metadata));

// Loading
JSON.parse(localStorage.getItem(`form-meta-${id}`));
```

### Future State (IPFS)
```javascript
// Saving
const ipfsHash = await ipfs.add(JSON.stringify(metadata));

// Loading
const data = await ipfs.cat(ipfsHash);
const metadata = JSON.parse(data);
```

### Migration Path
1. Keep `form-storage.ts` interface unchanged
2. Replace localStorage calls with IPFS operations
3. Store IPFS hashes in form ID mapping
4. Add IPFS pinning for persistence
5. Implement decentralized form discovery

## Response Storage (To Be Implemented)

Currently, the response count is hardcoded. Future implementation:

### Response Storage
- Store responses as separate JSON objects
- Key pattern: `form-response-${formId}-${responseId}`
- Link responses to form via `formId`
- Calculate response count dynamically

### Response Data Structure
```javascript
{
  id: "unique-response-id",
  formId: "form-id",
  data: {
    "field-id-1": "value",
    "field-id-2": "value"
  },
  submittedAt: "2024-01-15T10:30:00Z",
  ipfsHash: "Qm..." // Future IPFS hash
}
```

### Encryption
Responses will be encrypted on the client before storage:
- Generate encryption key from form creator's credentials
- Encrypt response data client-side
- Store encrypted data on IPFS
- Only form creator can decrypt with their key

## Best Practices

### Adding New Field Types
1. Add type to `FormField` interface in `types/form.ts`
2. Add rendering logic in `preview.tsx`
3. Add builder UI in `create.tsx`
4. Update validation if needed

### Modifying Storage
1. All storage operations must go through `form-storage.ts`
2. Never directly access localStorage elsewhere
3. Maintain consistent key patterns
4. Update all CRUD operations together

### Schema Evolution
1. Use `version` field for schema changes
2. Write migration functions for old versions
3. Maintain backward compatibility
4. Document schema changes

## Current Limitations

1. **Response Storage**: Not yet implemented
2. **Response Counting**: Hardcoded to 0 or estimated values
3. **IPFS Integration**: Prepared but not implemented
4. **Form Editing**: Edit page not yet updated to use JSON
5. **Real-time Updates**: No real-time sync between tabs
6. **Search/Filter**: Basic search only on title
7. **Encryption**: Planned but not implemented

## Next Steps

1. **Update Edit Page**: Make `/forms/[id]/edit` load from JSON
2. **Implement Response Storage**: Save responses to localStorage/IPFS
3. **Add Response Counting**: Calculate actual response counts
4. **IPFS Integration**: Replace localStorage with IPFS
5. **Encryption Layer**: Add client-side encryption
6. **Form Sharing**: Generate shareable links with IPFS hashes
7. **Advanced Validation**: More complex validation rules
8. **Conditional Logic**: Show/hide fields based on other values
9. **File Uploads**: Support file/image uploads to IPFS
10. **Analytics**: Privacy-preserving form analytics

## Testing the System

### Create a Form
1. Go to `/forms/create`
2. Add title, description, and fields
3. Set validation rules
4. Save form
5. Check localStorage for `form-meta-${id}`

### View Form
1. Dashboard shows all saved forms
2. Click form to see preview
3. Form renders with all fields
4. Validation works on submit

### Duplicate Form
1. Click duplicate on dashboard
2. New form appears with "(Copy)" suffix
3. Independent form with new ID

### Delete Form
1. Click delete on dashboard
2. Confirm deletion
3. Form removed from localStorage
4. Dashboard updates

## Debugging

### Check Form Storage
```javascript
// In browser console
// List all form IDs
JSON.parse(localStorage.getItem('form-ids'))

// Load specific form
JSON.parse(localStorage.getItem('form-meta-YOUR-ID'))

// Clear all forms (reset)
localStorage.clear()
```

### Common Issues

**Form not loading**: Check if form ID exists in `form-ids` array

**Fields not rendering**: Verify field type matches supported types

**Validation not working**: Check if validation object is properly structured

**Form not saving**: Check browser console for errors

## Performance Considerations

### Current Performance
- localStorage is synchronous and fast
- No network latency
- Limited by browser storage quota (5-10MB)

### Future with IPFS
- Network latency for retrieving forms
- Caching strategy needed
- Consider local-first approach
- Pin frequently accessed forms

## Security Considerations

### Current Security
- Client-side only
- No authentication
- Anyone with localStorage access can see forms
- No encryption

### Future Security
- End-to-end encryption required
- Form ownership via cryptographic keys
- Access control for responses
- Immutable audit trail on blockchain
- Privacy-preserving analytics

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: JSON Storage Implemented, IPFS Pending
