import { normalizeDocument, type DocumentData } from '@/core/documents';
import { DEFAULT_THEME_ID } from '@/core/themes';
import type { SerializedTheme } from '@/core/themes';
import { DRIVE_BACKUP_VERSION, type DriveBackupPayload } from './constants';
import type { BackupSnapshot } from './types';

export function createDriveBackupPayload(snapshot: BackupSnapshot): DriveBackupPayload {
  return {
    version: DRIVE_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    documents: snapshot.documents,
    customThemes: snapshot.customThemes,
    activeThemeId: snapshot.activeThemeId,
  };
}

export function parseDriveBackupPayload(raw: unknown): BackupSnapshot {
  if (!raw || typeof raw !== 'object') {
    throw new Error('云端备份格式无效');
  }

  const payload = raw as DriveBackupPayload;
  if (!Array.isArray(payload.documents)) {
    throw new Error('云端备份格式无效');
  }

  const customThemes = Array.isArray(payload.customThemes)
    ? (payload.customThemes as SerializedTheme[])
    : [];

  const activeThemeId =
    typeof payload.activeThemeId === 'string' ? payload.activeThemeId : DEFAULT_THEME_ID;

  return {
    documents: payload.documents.map((doc) => normalizeDocument(doc as DocumentData)),
    customThemes,
    activeThemeId,
  };
}

export function emptyBackupSnapshot(): BackupSnapshot {
  return {
    documents: [],
    customThemes: [],
    activeThemeId: DEFAULT_THEME_ID,
  };
}
