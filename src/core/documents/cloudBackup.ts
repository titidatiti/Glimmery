import { resolveCloudSyncErrorMessage } from '@/core/storage';
import type { StorageProvider } from '@/services/storage';
import type { SyncProvider } from '@/services/sync';
import { useCloudSyncStore } from '@/core/sync';
import { useDocumentStore } from '@/core/documents/documentStore';
import {
  assessCloudBackupOverwriteFromManifest,
  backupAllDocuments,
  buildBackupSnapshot,
  getSettingsUpdatedAtForSync,
  type CloudBackupOverwriteWarning,
} from '@/core/documents/syncUseCases';
import { parseRemoteManifestJson } from '@/services/sync/drive/manifestSyncPlan';

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
      const manifestJson = await sync.fetchRemoteManifest();
      const local = await buildBackupSnapshot(storage);
      if (manifestJson) {
        const manifest = parseRemoteManifestJson(manifestJson);
        if (manifest) {
          const warning = assessCloudBackupOverwriteFromManifest(
            local,
            manifest,
            getSettingsUpdatedAtForSync(),
          );
          if (warning) {
            return { status: 'needs_confirmation', warning };
          }
        }
      }
    }

    const result = await backupAllDocuments(storage, sync, {
      force: options?.confirmedOverwrite,
    });
    if (result.success) {
      store.markSynced();
      return { status: 'success' };
    }
    const error = result.error ?? '云端备份失败';
    store.setBackupError(error);
    return { status: 'failed', error };
  } catch (error) {
    const message = resolveCloudSyncErrorMessage(error, '云端备份失败');
    store.setBackupError(message);
    return { status: 'failed', error: message };
  } finally {
    store.setBackingUp(false);
  }
}

export interface PerformSaveShortcutOptions {
  /** 为 false 时仅落盘本地（如云同步被迁移 gate 阻断） */
  cloudEnabled?: boolean;
  confirmedOverwrite?: boolean;
}

export type PerformSaveShortcutResult =
  | PerformCloudBackupResult
  | { status: 'local_only' }
  | { status: 'no_document' };

/**
 * Ctrl/Cmd+S：立即保存当前文稿，再执行与手动备份相同的全量云同步（含冲突确认）。
 */
export async function performSaveShortcut(
  storage: StorageProvider,
  sync: SyncProvider,
  options?: PerformSaveShortcutOptions,
): Promise<PerformSaveShortcutResult> {
  const cloudEnabled = options?.cloudEnabled ?? true;
  const docStore = useDocumentStore.getState();

  if (!docStore.activeDocumentId) {
    return { status: 'no_document' };
  }

  await docStore.persistActiveDocument(storage);

  if (!cloudEnabled) {
    return { status: 'local_only' };
  }

  return performCloudBackup(storage, sync, {
    force: true,
    confirmedOverwrite: options?.confirmedOverwrite,
  });
}
