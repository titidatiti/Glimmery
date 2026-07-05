import { beforeEach, describe, expect, it } from 'vitest';

import {
  CLOUD_SCHEME_MIGRATION_DEFERRED_SESSION_KEY,
  CURRENT_LOCAL_STORAGE_SCHEME_VERSION,
  clearCloudMigrationDeferSession,
  cloudSchemeNeedsMigration,
  createDefaultSchemeRecord,
  deferCloudMigrationThisSession,
  isCloudMigrationDeferredThisSession,
  isCloudSyncSchemeMigrationError,
  localSchemeNeedsMigration,
  parseStorageSchemeRecord,
  resolveCloudSyncErrorMessage,
} from './storageScheme';

describe('storageScheme', () => {
  const sessionStore = new Map<string, string>();

  beforeEach(() => {
    sessionStore.clear();
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: {
        getItem: (key: string) => sessionStore.get(key) ?? null,
        setItem: (key: string, value: string) => sessionStore.set(key, value),
        removeItem: (key: string) => sessionStore.delete(key),
      },
      configurable: true,
    });
  });

  it('无记录时使用当前本地方案版本', () => {
    const record = parseStorageSchemeRecord(null);
    expect(record.local).toBe(CURRENT_LOCAL_STORAGE_SCHEME_VERSION);
    expect(record.cloud).toBeNull();
  });

  it('识别本地与云端待迁移', () => {
    expect(localSchemeNeedsMigration(CURRENT_LOCAL_STORAGE_SCHEME_VERSION - 1)).toBe(true);
    expect(localSchemeNeedsMigration(CURRENT_LOCAL_STORAGE_SCHEME_VERSION)).toBe(false);
    expect(cloudSchemeNeedsMigration(2, 'legacy')).toBe(true);
    expect(cloudSchemeNeedsMigration(3, 'current')).toBe(false);
    expect(cloudSchemeNeedsMigration(null, 'empty')).toBe(false);
  });

  it('本会话暂缓迁移标记', () => {
    expect(isCloudMigrationDeferredThisSession()).toBe(false);
    deferCloudMigrationThisSession();
    expect(isCloudMigrationDeferredThisSession()).toBe(true);
    expect(sessionStore.get(CLOUD_SCHEME_MIGRATION_DEFERRED_SESSION_KEY)).toBe('1');
    clearCloudMigrationDeferSession();
    expect(isCloudMigrationDeferredThisSession()).toBe(false);
  });

  it('云同步迁移错误映射为用户文案', () => {
    const err = new Error('CLOUD_SYNC_SCHEME_MIGRATION_REQUIRED');
    expect(isCloudSyncSchemeMigrationError(err)).toBe(true);
    expect(resolveCloudSyncErrorMessage(err, 'fallback')).toBe('需要先完成云端数据结构迁移');
    expect(resolveCloudSyncErrorMessage(new Error('other'), 'fallback')).toBe('other');
  });

  it('createDefaultSchemeRecord 与解析兼容', () => {
    const raw = JSON.stringify(createDefaultSchemeRecord());
    const parsed = parseStorageSchemeRecord(raw);
    expect(parsed.local).toBe(CURRENT_LOCAL_STORAGE_SCHEME_VERSION);
    expect(parsed.cloud).toBeNull();
  });
});
