import type { StorageProvider } from '@/services/storage';
import type { SyncProvider } from '@/services/sync';
import { useCloudSyncStore } from '@/core/sync';
import {
  assessCloudBackupOverwrite,
  backupAllDocuments,
  buildBackupSnapshot,
  pullRemoteBackup,
  type CloudBackupOverwriteWarning,
} from '@/core/documents/syncUseCases';

export type { CloudBackupOverwriteWarning };

export type PerformCloudBackupResult =
  | { status: 'success' }
  | { status: 'skipped' }
  | { status: 'failed'; error: string }
  | { status: 'needs_confirmation'; warning: CloudBackupOverwriteWarning };

export interface PerformCloudBackupOptions {
  force?: boolean;
  /** 用户已确认覆盖较新的云端备份 */
  confirmedOverwrite?: boolean;
}

/**
 * 执行一次全量云端备份。上传前若云端较新，返回 needs_confirmation 供 UI 二次确认。
 */
export async function performCloudBackup(
  storage: StorageProvider,
  sync: SyncProvider,
  options?: PerformCloudBackupOptions,
): Promise<PerformCloudBackupResult> {
  const store = useCloudSyncStore.getState();

  if (!options?.force && !store.pendingCloudSync) return { status: 'skipped' };
  if (!sync.isConfigured()) return { status: 'skipped' };

  const authed = await sync.isAuthenticated();
  if (!authed) {
    return { status: 'failed', error: '未连接 Google 账号' };
  }

  if (store.isCloudBackingUp) {
    return { status: 'failed', error: '正在同步中' };
  }

  store.setBackingUp(true);
  store.setBackupError(null);

  try {
    if (!options?.confirmedOverwrite) {
      const remote = await pullRemoteBackup(sync);
      const local = await buildBackupSnapshot(storage);
      const warning = assessCloudBackupOverwrite(local, remote);
      if (warning) {
        return { status: 'needs_confirmation', warning };
      }
    }

    const result = await backupAllDocuments(storage, sync);
    if (result.success) {
      store.markSynced();
      return { status: 'success' };
    }
    const error = result.error ?? '云端备份失败';
    store.setBackupError(error);
    return { status: 'failed', error };
  } catch (error) {
    const message = error instanceof Error ? error.message : '云端备份失败';
    store.setBackupError(message);
    return { status: 'failed', error: message };
  } finally {
    store.setBackingUp(false);
  }
}
