import type { StorageKeyValue } from '@/services/storage';

/** IndexedDB kv：上次成功 pull/push 后已知的云端 manifest 快照（JSON 字符串） */
export const REMOTE_MANIFEST_CACHE_KV_KEY = 'glimmery:remote-manifest-cache';

export async function loadRemoteManifestCacheJson(kv: StorageKeyValue): Promise<string | null> {
  return kv.getItem(REMOTE_MANIFEST_CACHE_KV_KEY);
}

export async function saveRemoteManifestCacheJson(
  kv: StorageKeyValue,
  manifestJson: string,
): Promise<void> {
  await kv.setItem(REMOTE_MANIFEST_CACHE_KV_KEY, manifestJson);
}

export async function clearRemoteManifestCache(kv: StorageKeyValue): Promise<void> {
  await kv.removeItem(REMOTE_MANIFEST_CACHE_KV_KEY);
}
