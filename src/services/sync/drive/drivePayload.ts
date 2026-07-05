import { normalizeDocument, type DocumentData } from '@/core/documents';
import { DEFAULT_THEME_ID, type SerializedTheme } from '@/core/themes';

import type { BackupSnapshot } from '../types';

export const DRIVE_DOCUMENT_FILE_VERSION = 1;
export const DRIVE_SETTINGS_FILE_VERSION = 1;

export interface DriveDocumentFilePayload {
  version: typeof DRIVE_DOCUMENT_FILE_VERSION;
  document: DocumentData;
  /** 上传该版本时的本机名称 */
  clientName?: string;
}

export interface DriveSettingsFilePayload {
  version: typeof DRIVE_SETTINGS_FILE_VERSION;
  updatedAt: string;
  customThemes: SerializedTheme[];
  activeThemeId: string;
  clientName?: string;
}

export function createDocumentFilePayload(
  document: DocumentData,
  clientName?: string,
): DriveDocumentFilePayload {
  const payload: DriveDocumentFilePayload = {
    version: DRIVE_DOCUMENT_FILE_VERSION,
    document,
  };
  const name = clientName?.trim();
  if (name) payload.clientName = name;
  return payload;
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
  clientName?: string,
): DriveSettingsFilePayload {
  const payload: DriveSettingsFilePayload = {
    version: DRIVE_SETTINGS_FILE_VERSION,
    updatedAt,
    customThemes,
    activeThemeId,
  };
  const name = clientName?.trim();
  if (name) payload.clientName = name;
  return payload;
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
    clientName: typeof payload.clientName === 'string' ? payload.clientName : undefined,
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
