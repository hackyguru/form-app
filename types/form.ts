// Form metadata types for JSON storage and IPFS

export interface FormFieldOption {
  id: string;
  value: string;
}

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  errorMessage?: string;
}

export interface FormField {
  id: string;
  type: "text" | "textarea" | "email" | "phone" | "number" | "select" | "radio" | "checkbox" | "date";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
}

export interface FormMetadata {
  id: string;
  title: string;
  description: string;
  status: "active" | "paused" | "closed";
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
  version: string; // For future compatibility
}

export interface FormResponse {
  id: string;
  formId: string;
  data: Record<string, string>;
  submittedAt: string;
  ipfsHash?: string; // For storing response on IPFS
}
