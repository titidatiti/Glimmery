/** Google Drive appData 分文件同步布局（v3） */

export const DRIVE_SYNC_LAYOUT_VERSION = 3;

export const DRIVE_MANIFEST_FILENAME = 'glimmery-manifest.json';

/** @deprecated v1/v2 单文件全量备份，首次 v3 同步时迁移 */
export const DRIVE_LEGACY_BACKUP_FILENAME = 'glimmery-documents.json';

export const DRIVE_SETTINGS_BASENAME = 'glimmery-settings.json';

export const DRIVE_DOC_PREFIX = 'glimmery-doc-';

/** 每个文稿 / 设置除当前外保留的历史版本数 */
export const DRIVE_MAX_REVISIONS = 3;

export type DriveRevisionSlot = 'current' | 1 | 2 | 3;

export interface DriveManifestDocumentEntry {
  updatedAt: string;
}

export interface DriveManifestSettingsEntry {
  updatedAt: string;
}

export interface DriveManifest {
  version: typeof DRIVE_SYNC_LAYOUT_VERSION;
  updatedAt: string;
  documents: Record<string, DriveManifestDocumentEntry>;
  settings: DriveManifestSettingsEntry | null;
}

export function emptyDriveManifest(): DriveManifest {
  return {
    version: DRIVE_SYNC_LAYOUT_VERSION,
    updatedAt: new Date(0).toISOString(),
    documents: {},
    settings: null,
  };
}

export function driveDocumentFilename(documentId: string, slot: DriveRevisionSlot = 'current'): string {
  if (slot === 'current') {
    return `${DRIVE_DOC_PREFIX}${documentId}.json`;
  }
  return `${DRIVE_DOC_PREFIX}${documentId}.rev${slot}.json`;
}

export function driveSettingsFilename(slot: DriveRevisionSlot = 'current'): string {
  if (slot === 'current') {
    return DRIVE_SETTINGS_BASENAME;
  }
  const base = DRIVE_SETTINGS_BASENAME.replace(/\.json$/, '');
  return `${base}.rev${slot}.json`;
}

export function parseDocumentIdFromFilename(name: string): string | null {
  const rev = /^glimmery-doc-(.+)\.rev[123]\.json$/.exec(name);
  if (rev) return rev[1];
  const current = /^glimmery-doc-(.+)\.json$/.exec(name);
  if (current) return current[1];
  return null;
}

export function isGlimmeryDriveFile(name: string): boolean {
  return (
    name === DRIVE_MANIFEST_FILENAME ||
    name === DRIVE_LEGACY_BACKUP_FILENAME ||
    name.startsWith(DRIVE_DOC_PREFIX) ||
    name === DRIVE_SETTINGS_BASENAME ||
    /^glimmery-settings\.rev[123]\.json$/.test(name)
  );
}

export function revisionSlotsNewestFirst(): DriveRevisionSlot[] {
  return ['current', 1, 2, 3];
}
