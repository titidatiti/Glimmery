import { isCloudSyncSchemeMigrationError, resolveCloudSyncErrorMessage } from '@/core/storage';
import type { StorageProvider } from '@/services/storage';
import type { SyncProvider } from '@/services/sync';
import { useCloudSyncStore } from '@/core/sync';
import {
  applyRestore,
  buildAutoRestoreResolutions,
  loadAllDocuments,
  needsStartupRestore,
  planRestoreWithManifest,
  pullRemoteSyncData,
} from './syncUseCases';

export type StartupCloudSyncResult =
  | {
      status: 'skipped';
      reason:
        | 'not_configured'
        | 'not_authenticated'
        | 'empty_remote'
        | 'already_synced'
        | 'busy'
        | 'scheme_migration_required';
    }
  | { status: 'success'; appliedDocs: number }
  | { status: 'failed'; error: string };

/**
 * 打开应用时静默拉取云端更新（需已登录且 token 有效）。
 * 冲突按 updatedAt 较新版本合并；本地独有文稿保留。
 */
export async function performStartupCloudSync(
  storage: StorageProvider,
  sync: SyncProvider,
): Promise<StartupCloudSyncResult> {
  if (!sync.isConfigured()) {
    return { status: 'skipped', reason: 'not_configured' };
  }

  const authed = await sync.isAuthenticated();
  if (!authed) {
    return { status: 'skipped', reason: 'not_authenticated' };
  }

  const cloudStore = useCloudSyncStore.getState();
  if (cloudStore.isCloudBackingUp) {
    return { status: 'skipped', reason: 'busy' };
  }

  cloudStore.setBackingUp(true);
  cloudStore.setBackupError(null);

  try {
    const { snapshot, manifest } = await pullRemoteSyncData(storage, sync);
    const remoteEmpty =
      Object.keys(manifest.documents).length === 0 && manifest.settings === null;
    if (remoteEmpty) {
      return { status: 'skipped', reason: 'empty_remote' };
    }

    const local = await loadAllDocuments(storage);
    const plan = planRestoreWithManifest(
      local,
      manifest,
      snapshot.documents,
      snapshot.customThemes,
      snapshot.activeThemeId,
    );
    const resolutions = buildAutoRestoreResolutions(plan);

    if (!needsStartupRestore(plan, resolutions)) {
      return { status: 'skipped', reason: 'already_synced' };
    }

    const appliedDocs = await applyRestore(storage, plan, resolutions);
    cloudStore.markPending();

    return { status: 'success', appliedDocs };
  } catch (error) {
    if (isCloudSyncSchemeMigrationError(error)) {
      cloudStore.setBackupError(resolveCloudSyncErrorMessage(error, '启动同步失败'));
      return { status: 'skipped', reason: 'scheme_migration_required' };
    }
    const message = resolveCloudSyncErrorMessage(error, '启动同步失败');
    cloudStore.setBackupError(message);
    return { status: 'failed', error: message };
  } finally {
    cloudStore.setBackingUp(false);
  }
}
