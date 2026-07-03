import type { StorageProvider } from '@/services/storage';
import type { BackupSnapshot, SyncProvider } from '@/services/sync';
import { applyThemeBackupState, exportThemeBackupState } from '@/core/themes/themeStore';
import type { DocumentData } from './types';

export interface SyncConflict {
  id: string;
  local: DocumentData;
  remote: DocumentData;
}

export type ConflictResolution = 'keep-local' | 'use-remote';

export interface RestorePlan {
  conflicts: SyncConflict[];
  /** 云端有、本地无 */
  remoteOnly: DocumentData[];
  /** 本地有、云端无（恢复时保留） */
  localOnly: DocumentData[];
  /** 内容一致或本地不存在冲突 */
  toApplyFromRemote: DocumentData[];
  remoteThemes: BackupSnapshot['customThemes'];
  remoteActiveThemeId: string;
}

export async function loadAllDocuments(storage: StorageProvider): Promise<DocumentData[]> {
  const metas = await storage.list();
  const docs = await Promise.all(metas.map((meta) => storage.load(meta.id)));
  return docs.filter((doc): doc is DocumentData => doc !== null);
}

export async function buildBackupSnapshot(storage: StorageProvider): Promise<BackupSnapshot> {
  const documents = await loadAllDocuments(storage);
  const { customThemes, activeThemeId } = exportThemeBackupState();
  return { documents, customThemes, activeThemeId };
}

export function planRestore(local: DocumentData[], remote: BackupSnapshot): RestorePlan {
  const localById = new Map(local.map((doc) => [doc.id, doc]));
  const remoteById = new Map(remote.documents.map((doc) => [doc.id, doc]));
  const conflicts: SyncConflict[] = [];
  const remoteOnly: DocumentData[] = [];
  const toApplyFromRemote: DocumentData[] = [];

  for (const remoteDoc of remote.documents) {
    const localDoc = localById.get(remoteDoc.id);
    if (!localDoc) {
      remoteOnly.push(remoteDoc);
      toApplyFromRemote.push(remoteDoc);
      continue;
    }
    if (localDoc.updatedAt === remoteDoc.updatedAt) {
      continue;
    }
    if (
      localDoc.title === remoteDoc.title &&
      localDoc.content === remoteDoc.content &&
      localDoc.createdAt === remoteDoc.createdAt
    ) {
      continue;
    }
    conflicts.push({ id: remoteDoc.id, local: localDoc, remote: remoteDoc });
  }

  const localOnly = local.filter((doc) => !remoteById.has(doc.id));

  return {
    conflicts,
    remoteOnly,
    localOnly,
    toApplyFromRemote,
    remoteThemes: remote.customThemes,
    remoteActiveThemeId: remote.activeThemeId,
  };
}

export async function backupAllDocuments(
  storage: StorageProvider,
  sync: SyncProvider,
): Promise<{ success: boolean; pushed: number; error?: string }> {
  const snapshot = await buildBackupSnapshot(storage);
  const result = await sync.push(snapshot);
  return { success: result.success, pushed: result.pushed, error: result.error };
}

export async function applyRestore(
  storage: StorageProvider,
  plan: RestorePlan,
  resolutions: Map<string, ConflictResolution>,
): Promise<number> {
  let applied = 0;

  for (const doc of plan.remoteOnly) {
    await storage.save(doc);
    applied += 1;
  }

  for (const conflict of plan.conflicts) {
    const resolution = resolutions.get(conflict.id) ?? 'keep-local';
    if (resolution === 'use-remote') {
      await storage.save(conflict.remote);
      applied += 1;
    }
  }

  applyThemeBackupState(plan.remoteThemes, plan.remoteActiveThemeId);

  return applied;
}

export async function pullRemoteBackup(sync: SyncProvider): Promise<BackupSnapshot> {
  return sync.pull();
}

/** @deprecated 使用 pullRemoteBackup */
export async function pullRemoteDocuments(sync: SyncProvider): Promise<DocumentData[]> {
  const snapshot = await pullRemoteBackup(sync);
  return snapshot.documents;
}

export function formatRestoreSummary(appliedDocs: number, themeCount: number): string {
  if (appliedDocs > 0 && themeCount > 0) {
    return `已从云端恢复 ${appliedDocs} 篇文稿与 ${themeCount} 个自定义配色`;
  }
  if (appliedDocs > 0) {
    return `已从云端恢复 ${appliedDocs} 篇文稿`;
  }
  if (themeCount > 0) {
    return `已从云端恢复 ${themeCount} 个自定义配色`;
  }
  return '云端数据已与本地一致';
}
