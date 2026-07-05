import type { StorageProvider } from '@/services/storage';
import type { CloudRevisionSlot, SyncProvider } from '@/services/sync';
import { applyThemeBackupState } from '@/core/themes/themeStore';
import type { DocumentData } from './types';
import { saveDocument } from './useCases';

export async function restoreDocumentFromCloudRevision(
  storage: StorageProvider,
  sync: SyncProvider,
  documentId: string,
  slot: CloudRevisionSlot,
): Promise<DocumentData | null> {
  const doc = await sync.pullDocumentRevision(documentId, slot);
  if (!doc) return null;
  await saveDocument(storage, doc);
  return doc;
}

export async function restoreSettingsFromCloudRevision(
  sync: SyncProvider,
  slot: CloudRevisionSlot,
): Promise<boolean> {
  const settings = await sync.pullSettingsRevision(slot);
  if (!settings) return false;
  applyThemeBackupState(settings.customThemes, settings.activeThemeId);
  return true;
}
