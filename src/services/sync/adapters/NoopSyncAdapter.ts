import { DEFAULT_THEME_ID } from '@/core/themes';
import type {
  BackupSnapshot,
  CloudRevisionInfo,
  CloudRevisionSlot,
  CloudSyncSchemeMigrationResult,
  CloudSyncSchemeStatus,
  SyncAccountProfile,
  SyncProvider,
  SyncPullOptions,
  SyncPullResult,
  SyncPushOptions,
  SyncResult,
} from '../types';

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

  async push(snapshot: BackupSnapshot, options?: SyncPushOptions): Promise<SyncResult> {
    void snapshot;
    void options;
    return { success: true, pushed: 0, pulled: 0 };
  }

  async pull(_options?: SyncPullOptions): Promise<SyncPullResult> {
    return {
      snapshot: { documents: [], customThemes: [], activeThemeId: DEFAULT_THEME_ID },
      remoteManifestJson: JSON.stringify({
        version: 3,
        updatedAt: new Date(0).toISOString(),
        documents: {},
        settings: null,
      }),
      documentsFetched: 0,
    };
  }

  async fetchRemoteManifest(): Promise<string | null> {
    return null;
  }

  async detectCloudSyncScheme(): Promise<CloudSyncSchemeStatus> {
    return { kind: 'empty', version: null, targetVersion: 3 };
  }

  async migrateCloudSyncScheme(): Promise<CloudSyncSchemeMigrationResult> {
    return { fromVersion: 0, toVersion: 3 };
  }

  async listDocumentRevisions(_documentId: string): Promise<CloudRevisionInfo[]> {
    return [];
  }

  async pullDocumentRevision(
    _documentId: string,
    _slot: CloudRevisionSlot,
  ): Promise<import('@/core/documents').DocumentData | null> {
    return null;
  }

  async listSettingsRevisions(): Promise<CloudRevisionInfo[]> {
    return [];
  }

  async pullSettingsRevision(
    _slot: CloudRevisionSlot,
  ): Promise<Pick<BackupSnapshot, 'customThemes' | 'activeThemeId'> | null> {
    return null;
  }
}
