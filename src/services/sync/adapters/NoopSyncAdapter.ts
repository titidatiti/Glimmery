import type { DocumentData } from '@/core/documents';
import type { SyncProvider, SyncResult } from '../types';

export class NoopSyncAdapter implements SyncProvider {
  readonly id = 'noop';

  async isAuthenticated(): Promise<boolean> {
    return false;
  }

  async authenticate(): Promise<void> {
    // 阶段二占位：Google Drive 同步尚未实现
  }

  async push(docs: DocumentData[]): Promise<SyncResult> {
    void docs;
    return { success: true, pushed: 0, pulled: 0 };
  }

  async pull(): Promise<DocumentData[]> {
    return [];
  }
}
