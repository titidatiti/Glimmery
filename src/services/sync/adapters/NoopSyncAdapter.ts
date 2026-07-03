import type { DocumentData } from '@/core/documents';
import type { SyncProvider, SyncResult } from '../types';

export class NoopSyncAdapter implements SyncProvider {
  readonly id = 'noop';

  isConfigured(): boolean {
    return false;
  }

  async isAuthenticated(): Promise<boolean> {
    return false;
  }

  async authenticate(): Promise<void> {
    // 未配置 VITE_GOOGLE_CLIENT_ID 时使用空实现
  }

  async signOut(): Promise<void> {
    /* noop */
  }

  async push(docs: DocumentData[]): Promise<SyncResult> {
    void docs;
    return { success: true, pushed: 0, pulled: 0 };
  }

  async pull(): Promise<DocumentData[]> {
    return [];
  }
}
