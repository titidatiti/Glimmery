/** 本地 IndexedDB 文稿结构版本（随本地 schema 变更递增） */
export const CURRENT_LOCAL_STORAGE_SCHEME_VERSION = 1;

/** 云端 Google Drive 同步布局版本（须与 driveLayout.DRIVE_SYNC_LAYOUT_VERSION 一致） */
export const CURRENT_CLOUD_SYNC_SCHEME_VERSION = 3;

/** 旧版单文件全量备份（glimmery-documents.json） */
export const LEGACY_CLOUD_SYNC_SCHEME_VERSION = 2;

export const STORAGE_SCHEME_KV_KEY = 'glimmery:storage-scheme';

export interface StorageSchemeRecord {
  local: number;
  /** 上次已知云端布局版本；null 表示尚未探测或未登录 */
  cloud: number | null;
  updatedAt: string;
}

export function createDefaultSchemeRecord(): StorageSchemeRecord {
  return {
    local: CURRENT_LOCAL_STORAGE_SCHEME_VERSION,
    cloud: null,
    updatedAt: new Date().toISOString(),
  };
}

export function parseStorageSchemeRecord(raw: string | null): StorageSchemeRecord {
  if (!raw) return createDefaultSchemeRecord();
  try {
    const parsed = JSON.parse(raw) as Partial<StorageSchemeRecord>;
    return {
      local:
        typeof parsed.local === 'number'
          ? parsed.local
          : CURRENT_LOCAL_STORAGE_SCHEME_VERSION,
      cloud: typeof parsed.cloud === 'number' ? parsed.cloud : null,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return createDefaultSchemeRecord();
  }
}

export function cloudSchemeNeedsMigration(
  detectedVersion: number | null,
  kind: 'empty' | 'current' | 'legacy' | 'outdated',
): boolean {
  if (kind === 'empty' || kind === 'current') return false;
  if (kind === 'legacy' || kind === 'outdated') {
    return (detectedVersion ?? 0) < CURRENT_CLOUD_SYNC_SCHEME_VERSION;
  }
  return false;
}

export function localSchemeNeedsMigration(localVersion: number): boolean {
  return localVersion < CURRENT_LOCAL_STORAGE_SCHEME_VERSION;
}

export function formatCloudSchemeMigrationMessage(fromVersion: number, toVersion: number): string {
  return [
    `检测到云端数据仍为旧版结构（v${fromVersion}），当前应用使用 v${toVersion}。`,
    '',
    '需要一次性迁移后才能继续使用云同步。迁移不会删除本地文稿，仅将云端备份重组为新格式。',
    '',
    '是否现在开始迁移？',
  ].join('\n');
}

export function formatLocalSchemeMigrationMessage(fromVersion: number, toVersion: number): string {
  return [
    `检测到本地数据结构为旧版（v${fromVersion}），当前应用需要 v${toVersion}。`,
    '',
    '需要迁移本地数据后才能继续，不会删除您的文稿内容。',
    '',
    '是否现在开始迁移？',
  ].join('\n');
}

export function formatCloudSchemeReauthMessage(): string {
  return [
    '您曾使用过 Google 云同步，但当前登录已过期。',
    '',
    '重新登录后，应用将检查云端备份是否为旧版结构，并在需要时引导您完成一次性迁移。',
    '',
    '本地文稿不受影响。是否现在重新登录？',
  ].join('\n');
}

export const CLOUD_SYNC_SCHEME_MIGRATION_REQUIRED = '需要先完成云端数据结构迁移';

/** 云同步操作抛出的机器可读错误码（与 UI 文案分离） */
export const CLOUD_SYNC_SCHEME_MIGRATION_ERROR_CODE = 'CLOUD_SYNC_SCHEME_MIGRATION_REQUIRED';

export function isCloudSyncSchemeMigrationError(error: unknown): boolean {
  return error instanceof Error && error.message === CLOUD_SYNC_SCHEME_MIGRATION_ERROR_CODE;
}

export function resolveCloudSyncErrorMessage(error: unknown, fallback: string): string {
  if (isCloudSyncSchemeMigrationError(error)) {
    return CLOUD_SYNC_SCHEME_MIGRATION_REQUIRED;
  }
  return error instanceof Error ? error.message : fallback;
}

/** 本会话内用户选择暂缓云端迁移（刷新页面后会再次提示） */
export const CLOUD_SCHEME_MIGRATION_DEFERRED_SESSION_KEY = 'glimmery:cloud-scheme-migration-deferred';

export function isCloudMigrationDeferredThisSession(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(CLOUD_SCHEME_MIGRATION_DEFERRED_SESSION_KEY) === '1';
}

export function deferCloudMigrationThisSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(CLOUD_SCHEME_MIGRATION_DEFERRED_SESSION_KEY, '1');
}

export function clearCloudMigrationDeferSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(CLOUD_SCHEME_MIGRATION_DEFERRED_SESSION_KEY);
}
