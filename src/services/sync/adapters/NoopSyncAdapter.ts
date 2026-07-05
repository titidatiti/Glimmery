import { DEFAULT_THEME_ID } from '@/core/themes';
import type { BackupSnapshot, SyncAccountProfile, SyncProvider, SyncResult } from '../types';

export class NoopSyncAdapter implements SyncProvider {
  readonly id = 'noop';

  isConfigured(): boolean {
    return false;
  }

  async isAuthenticated(): Promise<boolean> {
    return false;
  }

  async getAuthSessionStatus(): Promise<'none' | 'active' | 'expired'> {
    return 'none';
  }

  async getAccountProfile(): Promise<SyncAccountProfile | null> {
    return null;
  }

  async authenticate(): Promise<void> {
    // 未配置 VITE_GOOGLE_CLIENT_ID 时使用空实现
  }

  async signOut(): Promise<void> {
    /* noop */
  }

  async push(snapshot: BackupSnapshot): Promise<SyncResult> {
    void snapshot;
    return { success: true, pushed: 0, pulled: 0 };
  }

  async pull(): Promise<BackupSnapshot> {
    return { documents: [], customThemes: [], activeThemeId: DEFAULT_THEME_ID };
  }
}
