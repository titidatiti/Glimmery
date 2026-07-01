import type { DocumentData } from '@/core/documents';

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  error?: string;
}

export interface SyncProvider {
  readonly id: string;
  isAuthenticated(): Promise<boolean>;
  authenticate(): Promise<void>;
  push(docs: DocumentData[]): Promise<SyncResult>;
  pull(): Promise<DocumentData[]>;
}
