import type { DocumentData } from '@/core/documents';

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  error?: string;
}

export interface SyncProvider {
  readonly id: string;
  /** 是否已配置（如 env 中有 Client ID） */
  isConfigured(): boolean;
  isAuthenticated(): Promise<boolean>;
  authenticate(): Promise<void>;
  signOut(): Promise<void>;
  push(docs: DocumentData[]): Promise<SyncResult>;
  pull(): Promise<DocumentData[]>;
}
