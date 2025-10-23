/**
 * Blockchain-related type definitions for Status Network integration
 */

export type PrivacyMode = 'identified' | 'anonymous';

export interface FormOnChain {
  creator: string;
  ipnsName: string;
  encryptedKeyCID: string;
  privacyMode: PrivacyMode;
  createdAt: number;
  active: boolean;
  submissionCount?: number;
}

export interface RegisterFormRequest {
  formId: string;
  ipnsName: string;
  encryptedKeyCID: string;
  creatorAddress: string;
  privacyMode: PrivacyMode;
}

export interface RegisterFormResponse {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
  error?: string;
}

export interface SubmitResponseRequest {
  formId: string;
  encryptedDataCID: string;
  privacyMode: PrivacyMode;
  submitterAddress?: string;
  verified?: boolean;
  identityType?: string;
}

export interface SubmitResponseResponse {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  submissionId?: number;
  explorerUrl?: string;
  error?: string;
}

export interface GetFormResponse {
  success: boolean;
  form?: FormOnChain;
  error?: string;
}

export interface IdentifiedSubmission {
  formId: string;
  encryptedDataCID: string;
  submitter: string;
  timestamp: number;
  verified: boolean;
  identityType: string;
}

export interface AnonymousSubmission {
  formId: string;
  encryptedDataCID: string;
  timestamp: number;
}
