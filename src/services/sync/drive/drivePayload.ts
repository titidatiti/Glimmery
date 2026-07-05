import { normalizeDocument, type DocumentData } from '@/core/documents';
import { DEFAULT_THEME_ID, type SerializedTheme } from '@/core/themes';

import type { BackupSnapshot } from '../types';

export const DRIVE_DOCUMENT_FILE_VERSION = 1;
export const DRIVE_SETTINGS_FILE_VERSION = 1;

export interface DriveDocumentFilePayload {
  version: typeof DRIVE_DOCUMENT_FILE_VERSION;
  document: DocumentData;
}

export interface DriveSettingsFilePayload {
  version: typeof DRIVE_SETTINGS_FILE_VERSION;
  updatedAt: string;
  customThemes: SerializedTheme[];
  activeThemeId: string;
}

export function createDocumentFilePayload(document: DocumentData): DriveDocumentFilePayload {
  return {
    version: DRIVE_DOCUMENT_FILE_VERSION,
    document,
  };
}

export function parseDocumentFilePayload(raw: unknown): DocumentData {
  if (!raw || typeof raw !== 'object') {
    throw new Error('云端文稿文件格式无效');
  }
  const payload = raw as DriveDocumentFilePayload;
  if (!payload.document || typeof payload.document !== 'object') {
    throw new Error('云端文稿文件格式无效');
  }
  return normalizeDocument(payload.document as DocumentData);
}

export function createSettingsFilePayload(
  updatedAt: string,
  customThemes: SerializedTheme[],
  activeThemeId: string,
): DriveSettingsFilePayload {
  return {
    version: DRIVE_SETTINGS_FILE_VERSION,
    updatedAt,
    customThemes,
    activeThemeId,
  };
}

export function parseSettingsFilePayload(raw: unknown): DriveSettingsFilePayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('云端设置文件格式无效');
  }
  const payload = raw as DriveSettingsFilePayload;
  if (!Array.isArray(payload.customThemes)) {
    throw new Error('云端设置文件格式无效');
  }
  return {
    version: DRIVE_SETTINGS_FILE_VERSION,
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : new Date(0).toISOString(),
    customThemes: payload.customThemes as SerializedTheme[],
    activeThemeId:
      typeof payload.activeThemeId === 'string' ? payload.activeThemeId : DEFAULT_THEME_ID,
  };
}

export function settingsPayloadToSnapshot(payload: DriveSettingsFilePayload): Pick<
  BackupSnapshot,
  'customThemes' | 'activeThemeId'
> {
  return {
    customThemes: payload.customThemes,
    activeThemeId: payload.activeThemeId,
  };
}
