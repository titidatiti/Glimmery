import { DRIVE_BACKUP_VERSION } from '../constants';
import {
  DRIVE_LEGACY_BACKUP_FILENAME,
  DRIVE_MANIFEST_FILENAME,
  DRIVE_SYNC_LAYOUT_VERSION,
} from './driveLayout';
import type { GoogleDriveFileStore } from './googleDriveFileStore';
import type { CloudSyncSchemeStatus } from '../types';

export async function detectCloudSyncSchemeFromStore(
  files: GoogleDriveFileStore,
  token: string,
): Promise<CloudSyncSchemeStatus> {
  const targetVersion = DRIVE_SYNC_LAYOUT_VERSION;

  if (files.has(DRIVE_MANIFEST_FILENAME)) {
    const raw = await files.read(token, DRIVE_MANIFEST_FILENAME);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { version?: number };
        const version = parsed.version ?? 0;
        if (version === targetVersion) {
          // v3 manifest 已存在但旧单文件仍在 → 迁移未完成或需清理残留
          if (files.has(DRIVE_LEGACY_BACKUP_FILENAME)) {
            return { kind: 'legacy', version: DRIVE_BACKUP_VERSION, targetVersion };
          }
          return { kind: 'current', version: targetVersion, targetVersion };
        }
        return { kind: 'outdated', version, targetVersion };
      } catch {
        return { kind: 'outdated', version: 0, targetVersion };
      }
    }
  }

  if (files.has(DRIVE_LEGACY_BACKUP_FILENAME)) {
    let version = DRIVE_BACKUP_VERSION;
    const legacyRaw = await files.read(token, DRIVE_LEGACY_BACKUP_FILENAME);
    if (legacyRaw) {
      try {
        const parsed = JSON.parse(legacyRaw) as { version?: number };
        if (typeof parsed.version === 'number') {
          version = parsed.version;
        }
      } catch {
        /* use default legacy version */
      }
    }
    return { kind: 'legacy', version, targetVersion };
  }

  return { kind: 'empty', version: null, targetVersion };
}
