import type { StorageKeyValue } from '@/services/storage';

import {
  CURRENT_CLOUD_SYNC_SCHEME_VERSION,
  CURRENT_LOCAL_STORAGE_SCHEME_VERSION,
  STORAGE_SCHEME_KV_KEY,
  clearCloudMigrationDeferSession,
  deferCloudMigrationThisSession,
  isCloudMigrationDeferredThisSession,
  parseStorageSchemeRecord,
  type StorageSchemeRecord,
} from './storageScheme';
import { clearRemoteManifestCache } from './remoteManifestCache';

export async function loadStorageSchemeRecord(kv: StorageKeyValue): Promise<StorageSchemeRecord> {
  const raw = await kv.getItem(STORAGE_SCHEME_KV_KEY);
  return parseStorageSchemeRecord(raw);
}

export async function saveStorageSchemeRecord(
  kv: StorageKeyValue,
  record: StorageSchemeRecord,
): Promise<void> {
  await kv.setItem(
    STORAGE_SCHEME_KV_KEY,
    JSON.stringify({
      ...record,
      updatedAt: new Date().toISOString(),
    }),
  );
}

/** 本地方案迁移占位：当前 v1 无需变换，仅更新版本标记 */
export async function migrateLocalStorageScheme(
  kv: StorageKeyValue,
  fromVersion: number,
): Promise<StorageSchemeRecord> {
  void fromVersion;
  const record = await loadStorageSchemeRecord(kv);
  const next: StorageSchemeRecord = {
    ...record,
    local: CURRENT_LOCAL_STORAGE_SCHEME_VERSION,
    updatedAt: new Date().toISOString(),
  };
  await saveStorageSchemeRecord(kv, next);
  return next;
}

export async function markCloudSchemeCurrent(kv: StorageKeyValue): Promise<void> {
  clearCloudMigrationDeferSession();
  await clearRemoteManifestCache(kv);
  const record = await loadStorageSchemeRecord(kv);
  await saveStorageSchemeRecord(kv, {
    ...record,
    cloud: CURRENT_CLOUD_SYNC_SCHEME_VERSION,
  });
}

export async function markCloudMigrationDeferred(): Promise<void> {
  deferCloudMigrationThisSession();
}

export function isCloudSyncBlockedByScheme(): boolean {
  return isCloudMigrationDeferredThisSession();
}
