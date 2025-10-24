import { FormMetadata } from "@/types/form";

/**
 * Save form metadata to localStorage (will be replaced with IPFS later)
 */
export function saveFormMetadata(formData: FormMetadata): void {
  try {
    const key = `form-meta-${formData.id}`;
    localStorage.setItem(key, JSON.stringify(formData));
    
    // Also maintain a list of all form IDs
    const formIds = getAllFormIds();
    if (!formIds.includes(formData.id)) {
      formIds.push(formData.id);
      localStorage.setItem("form-ids", JSON.stringify(formIds));
    }
  } catch (error) {
    console.error("Failed to save form metadata:", error);
    throw new Error("Failed to save form");
  }
}

/**
 * Load form metadata from localStorage (will be replaced with IPFS later)
 */
export function loadFormMetadata(formId: string): FormMetadata | null {
  try {
    const key = `form-meta-${formId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as FormMetadata;
  } catch (error) {
    console.error("Failed to load form metadata:", error);
    return null;
  }
}

/**
 * Get all form IDs
 */
export function getAllFormIds(): string[] {
  try {
    const data = localStorage.getItem("form-ids");
    if (!data) return [];
    return JSON.parse(data) as string[];
  } catch (error) {
    console.error("Failed to load form IDs:", error);
    return [];
  }
}

/**
 * Load all forms
 */
export function loadAllForms(): FormMetadata[] {
  const formIds = getAllFormIds();
  return formIds
    .map(id => loadFormMetadata(id))
    .filter((form): form is FormMetadata => form !== null);
}

/**
 * Delete form metadata
 */
export function deleteFormMetadata(formId: string): void {
  try {
    const key = `form-meta-${formId}`;
    localStorage.removeItem(key);
    
    // Remove from form IDs list
    const formIds = getAllFormIds();
    const updatedIds = formIds.filter(id => id !== formId);
    localStorage.setItem("form-ids", JSON.stringify(updatedIds));
  } catch (error) {
    console.error("Failed to delete form metadata:", error);
    throw new Error("Failed to delete form");
  }
}

/**
 * Generate form-meta.json content for download/IPFS
 */
export function generateFormMetadataJSON(formData: FormMetadata): string {
  return JSON.stringify(formData, null, 2);
}

/**
 * Parse form-meta.json content (for IPFS retrieval)
 */
export function parseFormMetadataJSON(json: string): FormMetadata {
  try {
    return JSON.parse(json) as FormMetadata;
  } catch (error) {
    console.error("Failed to parse form metadata JSON:", error);
    throw new Error("Invalid form metadata JSON");
  }
}

/**
 * Duplicate a form
 */
export function duplicateForm(formId: string): FormMetadata | null {
  const original = loadFormMetadata(formId);
  if (!original) return null;

  const duplicate: FormMetadata = {
    ...original,
    id: `form-${Date.now()}`,
    title: `${original.title} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveFormMetadata(duplicate);
  return duplicate;
}

/**
 * Get list of deleted form IDs
 */
export function getDeletedFormIds(): string[] {
  try {
    const data = localStorage.getItem("deleted-form-ids");
    if (!data) return [];
    return JSON.parse(data) as string[];
  } catch (error) {
    console.error("Failed to load deleted form IDs:", error);
    return [];
  }
}

/**
 * Mark a form as deleted (for blockchain forms that can't be truly deleted)
 */
export function markFormAsDeleted(formId: string): void {
  try {
    const deletedIds = getDeletedFormIds();
    console.log(`🗑️ Current deleted IDs before adding:`, deletedIds);
    if (!deletedIds.includes(formId)) {
      deletedIds.push(formId);
      localStorage.setItem("deleted-form-ids", JSON.stringify(deletedIds));
      console.log(`🗑️ Added ${formId} to deleted list. New list:`, deletedIds);
    } else {
      console.log(`🗑️ ${formId} already in deleted list`);
    }
  } catch (error) {
    console.error("Failed to mark form as deleted:", error);
  }
}

/**
 * Check if a form is marked as deleted
 */
export function isFormDeleted(formId: string): boolean {
  const deletedIds = getDeletedFormIds();
  const isDeleted = deletedIds.includes(formId);
  if (deletedIds.length > 0) {
    console.log(`🗑️ Deleted forms list:`, deletedIds);
    console.log(`🔍 Checking if ${formId} is deleted: ${isDeleted}`);
  }
  return isDeleted;
}
