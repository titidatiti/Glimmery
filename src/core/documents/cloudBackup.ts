import type { StorageProvider } from '@/services/storage';
import type { SyncProvider } from '@/services/sync';
import { useCloudSyncStore } from '@/core/sync';
import { backupAllDocuments } from '@/core/documents/syncUseCases';

/**
 * 执行一次全量云端备份。成功则清除 pending 状态。
 * @returns 是否已无待备份内容（成功或未配置/未登录且跳过）
 */
export async function performCloudBackup(
  storage: StorageProvider,
  sync: SyncProvider,
  options?: { force?: boolean },
): Promise<boolean> {
  const store = useCloudSyncStore.getState();

  if (!options?.force && !store.pendingCloudSync) return true;
  if (!sync.isConfigured()) return true;

  const authed = await sync.isAuthenticated();
  if (!authed) return false;

  if (store.isCloudBackingUp) return false;

  store.setBackingUp(true);
  store.setBackupError(null);

  try {
    const result = await backupAllDocuments(storage, sync);
    if (result.success) {
      store.markSynced();
      return true;
    }
    store.setBackupError(result.error ?? '云端备份失败');
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : '云端备份失败';
    store.setBackupError(message);
    return false;
  } finally {
    store.setBackingUp(false);
  }
}
