import type { DocumentData } from '@/core/documents';
import { CLOUD_SYNC_SCHEME_MIGRATION_ERROR_CODE } from '@/core/storage';
import { DEFAULT_THEME_ID } from '@/core/themes';

import { parseDriveBackupPayload } from '../backupPayload';
import type {
  BackupSnapshot,
  CloudRevisionInfo,
  CloudRevisionSlot,
  SyncPullOptions,
  SyncPullResult,
  SyncResult,
} from '../types';
import {
  createDocumentFilePayload,
  createSettingsFilePayload,
  parseDocumentFilePayload,
  parseSettingsFilePayload,
  settingsPayloadToSnapshot,
} from './drivePayload';
import {
  DRIVE_LEGACY_BACKUP_FILENAME,
  DRIVE_MANIFEST_FILENAME,
  DRIVE_SYNC_LAYOUT_VERSION,
  type DriveManifest,
  type DriveRevisionSlot,
  driveDocumentFilename,
  driveSettingsFilename,
  emptyDriveManifest,
  revisionSlotsNewestFirst,
} from './driveLayout';
import { detectCloudSyncSchemeFromStore } from './driveSchemeDetect';
import {
  parseRemoteManifestJson,
  planManifestPull,
  serializeRemoteManifest,
} from './manifestSyncPlan';
import { GoogleDriveFileStore } from './googleDriveFileStore';
import type { CloudSyncSchemeMigrationResult, CloudSyncSchemeStatus } from '../types';

export class GoogleDriveSyncV3 {
  constructor(private readonly files: GoogleDriveFileStore) {}

  async detectCloudSyncScheme(): Promise<CloudSyncSchemeStatus> {
    return this.files.withToken(async (token) => {
      await this.files.refreshIndex(token);
      return detectCloudSyncSchemeFromStore(this.files, token);
    });
  }

  async migrateCloudSyncScheme(options?: {
    clientName?: string;
  }): Promise<CloudSyncSchemeMigrationResult> {
    return this.files.withToken(async (token) => {
      await this.files.refreshIndex(token);
      const before = await detectCloudSyncSchemeFromStore(this.files, token);
      if (before.kind === 'empty' || before.kind === 'current') {
        return {
          fromVersion: before.version ?? DRIVE_SYNC_LAYOUT_VERSION,
          toVersion: DRIVE_SYNC_LAYOUT_VERSION,
        };
      }
      const fromVersion = before.version ?? 0;
      await this.migrateLegacyToV3(token, options?.clientName);
      return { fromVersion, toVersion: DRIVE_SYNC_LAYOUT_VERSION };
    });
  }

  async fetchRemoteManifestJson(): Promise<string | null> {
    return this.files.withToken(async (token) => {
      await this.files.refreshIndex(token);
      await this.assertCloudSchemeCurrent(token);
      return this.files.read(token, DRIVE_MANIFEST_FILENAME);
    });
  }

  async pullSnapshot(options?: SyncPullOptions): Promise<SyncPullResult> {
    return this.files.withToken(async (token) => {
      await this.files.refreshIndex(token);
      await this.assertCloudSchemeCurrent(token);

      const manifestRaw = await this.files.read(token, DRIVE_MANIFEST_FILENAME);
      const remoteManifest = manifestRaw
        ? parseRemoteManifestJson(manifestRaw) ?? emptyDriveManifest()
        : emptyDriveManifest();
      const remoteManifestJson = manifestRaw ?? serializeRemoteManifest(remoteManifest);

      const cached = parseRemoteManifestJson(options?.cachedRemoteManifestJson ?? null);
      const localMetas = options?.localDocumentMetas ?? [];
      const localSettingsAt = options?.localSettingsUpdatedAt ?? new Date(0).toISOString();

      const pullPlan = planManifestPull(
        remoteManifest,
        localMetas,
        cached,
        localSettingsAt,
        { full: options?.full },
      );

      const documents: DocumentData[] = [];
      let documentsFetched = 0;

      if (!pullPlan.skipDocumentReads) {
        for (const documentId of pullPlan.documentIdsToFetch) {
          const raw = await this.files.read(token, driveDocumentFilename(documentId));
          if (!raw) continue;
          documentsFetched += 1;
          try {
            documents.push(parseDocumentFilePayload(JSON.parse(raw) as unknown));
          } catch {
            /* skip corrupt file */
          }
        }
      }

      let customThemes: BackupSnapshot['customThemes'] = [];
      let activeThemeId = DEFAULT_THEME_ID;
      if (pullPlan.fetchSettings || options?.full) {
        const settingsRaw = await this.files.read(token, driveSettingsFilename());
        if (settingsRaw) {
          try {
            const settings = parseSettingsFilePayload(JSON.parse(settingsRaw) as unknown);
            ({ customThemes, activeThemeId } = settingsPayloadToSnapshot(settings));
          } catch {
            /* ignore */
          }
        }
      }

      return {
        snapshot: { documents, customThemes, activeThemeId },
        remoteManifestJson,
        documentsFetched,
      };
    });
  }

  async pushSnapshot(
    snapshot: BackupSnapshot,
    settingsUpdatedAt: string,
    options?: { force?: boolean; clientName?: string },
  ): Promise<SyncResult> {
    return this.files.withToken(async (token) => {
      await this.files.refreshIndex(token);
      await this.assertCloudSchemeCurrent(token);

      const manifest = await this.loadManifest(token);
      const clientName = options?.clientName?.trim();
      let pushed = 0;
      const force = options?.force === true;

      for (const doc of snapshot.documents) {
        const remote = manifest.documents[doc.id];
        if (!force && remote && remote.updatedAt >= doc.updatedAt) {
          continue;
        }
        await this.writeDocumentWithHistory(token, doc);
        manifest.documents[doc.id] = this.manifestEntry(doc.updatedAt, clientName);
        pushed += 1;
      }

      const remoteSettingsAt = manifest.settings?.updatedAt ?? '';
      const settingsChanged = force || !manifest.settings || settingsUpdatedAt > remoteSettingsAt;
      if (settingsChanged) {
        await this.writeSettingsWithHistory(token, settingsUpdatedAt, {
          customThemes: snapshot.customThemes,
          activeThemeId: snapshot.activeThemeId,
        });
        manifest.settings = this.manifestEntry(settingsUpdatedAt, clientName);
        pushed += 1;
      }

      manifest.updatedAt = new Date().toISOString();
      await this.files.write(token, DRIVE_MANIFEST_FILENAME, JSON.stringify(manifest));

      return { success: true, pushed, pulled: 0 };
    });
  }

  async listDocumentRevisions(documentId: string): Promise<CloudRevisionInfo[]> {
    return this.files.withToken(async (token) => {
      await this.files.refreshIndex(token);
      return this.collectRevisionInfos(token, (slot) => driveDocumentFilename(documentId, slot));
    });
  }

  async pullDocumentRevision(
    documentId: string,
    slot: CloudRevisionSlot,
  ): Promise<DocumentData | null> {
    return this.files.withToken(async (token) => {
      await this.files.refreshIndex(token);
      const raw = await this.files.read(token, driveDocumentFilename(documentId, slot));
      if (!raw) return null;
      return parseDocumentFilePayload(JSON.parse(raw) as unknown);
    });
  }

  async listSettingsRevisions(): Promise<CloudRevisionInfo[]> {
    return this.files.withToken(async (token) => {
      await this.files.refreshIndex(token);
      return this.collectRevisionInfos(token, (slot) => driveSettingsFilename(slot));
    });
  }

  async pullSettingsRevision(
    slot: CloudRevisionSlot,
  ): Promise<Pick<BackupSnapshot, 'customThemes' | 'activeThemeId'> | null> {
    return this.files.withToken(async (token) => {
      await this.files.refreshIndex(token);
      const raw = await this.files.read(token, driveSettingsFilename(slot));
      if (!raw) return null;
      const payload = parseSettingsFilePayload(JSON.parse(raw) as unknown);
      return settingsPayloadToSnapshot(payload);
    });
  }

  private async collectRevisionInfos(
    token: string,
    filenameForSlot: (slot: DriveRevisionSlot) => string,
  ): Promise<CloudRevisionInfo[]> {
    const infos: CloudRevisionInfo[] = [];
    for (const slot of revisionSlotsNewestFirst()) {
      const raw = await this.files.read(token, filenameForSlot(slot));
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as { updatedAt?: string; document?: DocumentData };
        const updatedAt =
          parsed.document?.updatedAt ??
          (typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString());
        infos.push({
          slot,
          updatedAt,
          label: slot === 'current' ? '当前云端版本' : `历史版本 ${slot}`,
        });
      } catch {
        /* skip */
      }
    }
    return infos;
  }

  private async loadManifest(token: string): Promise<DriveManifest> {
    const raw = await this.files.read(token, DRIVE_MANIFEST_FILENAME);
    if (!raw) return emptyDriveManifest();
    try {
      const parsed = JSON.parse(raw) as DriveManifest;
      if (parsed.version !== 3 || !parsed.documents) {
        return emptyDriveManifest();
      }
      return parsed;
    } catch {
      return emptyDriveManifest();
    }
  }

  private manifestEntry(updatedAt: string, clientName?: string) {
    const entry = { updatedAt };
    const name = clientName?.trim();
    if (name) {
      return { ...entry, clientName: name };
    }
    return entry;
  }

  private async assertCloudSchemeCurrent(token: string): Promise<void> {
    const status = await detectCloudSyncSchemeFromStore(this.files, token);
    if (status.kind === 'legacy' || status.kind === 'outdated') {
      throw new Error(CLOUD_SYNC_SCHEME_MIGRATION_ERROR_CODE);
    }
  }

  private async migrateLegacyToV3(token: string, clientName?: string): Promise<void> {
    if (this.files.has(DRIVE_MANIFEST_FILENAME)) {
      const raw = await this.files.read(token, DRIVE_MANIFEST_FILENAME);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as DriveManifest;
          if (parsed.version === DRIVE_SYNC_LAYOUT_VERSION) {
            if (this.files.has(DRIVE_LEGACY_BACKUP_FILENAME)) {
              await this.files.delete(token, DRIVE_LEGACY_BACKUP_FILENAME);
            }
            return;
          }
        } catch {
          /* 无效 manifest，继续尝试从 legacy 迁移 */
        }
      }
      await this.files.delete(token, DRIVE_MANIFEST_FILENAME);
    }

    const legacyRaw = await this.files.read(token, DRIVE_LEGACY_BACKUP_FILENAME);
    if (!legacyRaw) {
      throw new Error('找不到可迁移的云端旧版备份文件');
    }

    const legacy = parseDriveBackupPayload(JSON.parse(legacyRaw) as unknown);
    const settingsUpdatedAt = new Date().toISOString();

    for (const doc of legacy.documents) {
      await this.writeDocumentWithHistory(token, doc, false);
    }

    await this.writeSettingsWithHistory(
      token,
      settingsUpdatedAt,
      {
        customThemes: legacy.customThemes,
        activeThemeId: legacy.activeThemeId,
      },
      false,
    );

    const trimmedClientName = clientName?.trim();
    const manifest: DriveManifest = {
      version: 3,
      updatedAt: new Date().toISOString(),
      documents: Object.fromEntries(
        legacy.documents.map((doc) => [
          doc.id,
          this.manifestEntry(doc.updatedAt, trimmedClientName),
        ]),
      ),
      settings:
        legacy.customThemes.length > 0 || legacy.activeThemeId !== DEFAULT_THEME_ID
          ? this.manifestEntry(settingsUpdatedAt, trimmedClientName)
          : null,
    };
    await this.files.write(token, DRIVE_MANIFEST_FILENAME, JSON.stringify(manifest));
    await this.files.delete(token, DRIVE_LEGACY_BACKUP_FILENAME);
  }

  private async writeDocumentWithHistory(
    token: string,
    doc: DocumentData,
    rotate = true,
  ): Promise<void> {
    const body = JSON.stringify(createDocumentFilePayload(doc));
    const nameFor = (slot: DriveRevisionSlot) => driveDocumentFilename(doc.id, slot);
    if (rotate && this.files.has(nameFor('current'))) {
      await this.rotateFiles(token, nameFor);
    }
    await this.files.write(token, nameFor('current'), body);
  }

  private async writeSettingsWithHistory(
    token: string,
    updatedAt: string,
    snapshot: Pick<BackupSnapshot, 'customThemes' | 'activeThemeId'>,
    rotate = true,
  ): Promise<void> {
    const body = JSON.stringify(
      createSettingsFilePayload(updatedAt, snapshot.customThemes, snapshot.activeThemeId),
    );
    const nameFor = (slot: DriveRevisionSlot) => driveSettingsFilename(slot);
    if (rotate && this.files.has(nameFor('current'))) {
      await this.rotateFiles(token, nameFor);
    }
    await this.files.write(token, nameFor('current'), body);
  }

  private async rotateFiles(
    token: string,
    nameFor: (slot: DriveRevisionSlot) => string,
  ): Promise<void> {
    const current = await this.files.read(token, nameFor('current'));
    const rev1 = await this.files.read(token, nameFor(1));
    const rev2 = await this.files.read(token, nameFor(2));

    if (rev2) {
      await this.files.write(token, nameFor(3), rev2);
    } else if (this.files.has(nameFor(3))) {
      await this.files.delete(token, nameFor(3));
    }

    if (rev1) {
      await this.files.write(token, nameFor(2), rev1);
    } else if (this.files.has(nameFor(2))) {
      await this.files.delete(token, nameFor(2));
    }

    if (current) {
      await this.files.write(token, nameFor(1), current);
    }
  }
}
