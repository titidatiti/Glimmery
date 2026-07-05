import type { StorageKeyValue } from '@/services/storage';

import { GoogleDriveAuth } from './googleDriveAuth';
import { emptyBackupSnapshot } from '../backupPayload';
import type {
  BackupSnapshot,
  CloudRevisionInfo,
  CloudRevisionSlot,
  SyncAccountProfile,
  SyncProvider,
  SyncPushOptions,
  SyncResult,
} from '../types';
import { GoogleDriveFileStore } from '../drive/googleDriveFileStore';
import { GoogleDriveSyncV3 } from '../drive/googleDriveSyncV3';

export class GoogleDriveAdapter implements SyncProvider {
  readonly id = 'google-drive';

  private readonly auth: GoogleDriveAuth;
  private readonly syncV3: GoogleDriveSyncV3;

  constructor(
    kv: StorageKeyValue,
    private readonly clientId: string,
  ) {
    this.auth = new GoogleDriveAuth(kv, clientId);
    this.syncV3 = new GoogleDriveSyncV3(new GoogleDriveFileStore(this.auth));
  }

  isConfigured(): boolean {
    return this.clientId.length > 0;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.auth.isAuthenticated();
  }

  async getAuthSessionStatus(): Promise<'none' | 'active' | 'expired'> {
    return this.auth.getAuthSessionStatus();
  }

  async getAccountProfile(): Promise<SyncAccountProfile | null> {
    return this.auth.getAccountProfile();
  }

  async authenticate(): Promise<void> {
    await this.auth.requestAccessToken({ prompt: 'consent' });
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }

  async push(snapshot: BackupSnapshot, options?: SyncPushOptions): Promise<SyncResult> {
    try {
      return await this.syncV3.pushSnapshot(
        snapshot,
        options?.settingsUpdatedAt ?? new Date(0).toISOString(),
        { force: options?.force },
      );
    } catch (error) {
      return {
        success: false,
        pushed: 0,
        pulled: 0,
        error: error instanceof Error ? error.message : '备份失败',
      };
    }
  }

  async pull(options?: import('../types').SyncPullOptions): Promise<import('../types').SyncPullResult> {
    try {
      return await this.syncV3.pullSnapshot(options);
    } catch {
      return {
        snapshot: emptyBackupSnapshot(),
        remoteManifestJson: JSON.stringify({
          version: 3,
          updatedAt: new Date(0).toISOString(),
          documents: {},
          settings: null,
        }),
        documentsFetched: 0,
      };
    }
  }

  async fetchRemoteManifest(): Promise<string | null> {
    try {
      return await this.syncV3.fetchRemoteManifestJson();
    } catch {
      return null;
    }
  }

  async detectCloudSyncScheme(): Promise<import('../types').CloudSyncSchemeStatus> {
    return this.syncV3.detectCloudSyncScheme();
  }

  async migrateCloudSyncScheme(): Promise<import('../types').CloudSyncSchemeMigrationResult> {
    return this.syncV3.migrateCloudSyncScheme();
  }

  async listDocumentRevisions(documentId: string): Promise<CloudRevisionInfo[]> {
    try {
      return await this.syncV3.listDocumentRevisions(documentId);
    } catch {
      return [];
    }
  }

  async pullDocumentRevision(
    documentId: string,
    slot: CloudRevisionSlot,
  ): Promise<import('@/core/documents').DocumentData | null> {
    try {
      return await this.syncV3.pullDocumentRevision(documentId, slot);
    } catch {
      return null;
    }
  }

  async listSettingsRevisions(): Promise<CloudRevisionInfo[]> {
    try {
      return await this.syncV3.listSettingsRevisions();
    } catch {
      return [];
    }
  }

  async pullSettingsRevision(
    slot: CloudRevisionSlot,
  ): Promise<Pick<BackupSnapshot, 'customThemes' | 'activeThemeId'> | null> {
    try {
      return await this.syncV3.pullSettingsRevision(slot);
    } catch {
      return null;
    }
  }
}
