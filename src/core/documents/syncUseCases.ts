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

/** 上传备份前：云端比本地新、需用户确认才可覆盖 */
export interface CloudBackupOverwriteWarning {
  remoteOnlyCount: number;
  newerRemoteConflictCount: number;
  remoteOnlyThemeCount: number;
}

export function assessCloudBackupOverwrite(
  local: BackupSnapshot,
  remote: BackupSnapshot,
): CloudBackupOverwriteWarning | null {
  const remoteEmpty = remote.documents.length === 0 && remote.customThemes.length === 0;
  if (remoteEmpty) return null;

  const plan = planRestore(local.documents, remote);
  const newerRemoteConflicts = plan.conflicts.filter(
    (conflict) => conflict.remote.updatedAt > conflict.local.updatedAt,
  );

  const localThemeIds = new Set(local.customThemes.map((theme) => theme.id));
  const remoteOnlyThemeCount = remote.customThemes.filter((theme) => !localThemeIds.has(theme.id)).length;

  if (
    plan.remoteOnly.length === 0 &&
    newerRemoteConflicts.length === 0 &&
    remoteOnlyThemeCount === 0
  ) {
    return null;
  }

  return {
    remoteOnlyCount: plan.remoteOnly.length,
    newerRemoteConflictCount: newerRemoteConflicts.length,
    remoteOnlyThemeCount,
  };
}

export function formatCloudBackupOverwritePrompt(warning: CloudBackupOverwriteWarning): string {
  const lines = ['云端存在比本地新的内容，继续备份将用本地数据覆盖云端：'];

  if (warning.remoteOnlyCount > 0) {
    lines.push(`· ${warning.remoteOnlyCount} 篇仅存在于云端的文稿将被删除`);
  }
  if (warning.newerRemoteConflictCount > 0) {
    lines.push(`· ${warning.newerRemoteConflictCount} 篇文稿的云端版本更新`);
  }
  if (warning.remoteOnlyThemeCount > 0) {
    lines.push(`· ${warning.remoteOnlyThemeCount} 个仅存在于云端的自定义配色将被删除`);
  }

  lines.push('', '仍要用本地数据覆盖云端吗？');
  return lines.join('\n');
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

/** 启动拉取：同 ID 冲突时采用 updatedAt 较新的版本 */
export function buildAutoRestoreResolutions(plan: RestorePlan): Map<string, ConflictResolution> {
  const resolutions = new Map<string, ConflictResolution>();
  for (const conflict of plan.conflicts) {
    resolutions.set(
      conflict.id,
      conflict.remote.updatedAt > conflict.local.updatedAt ? 'use-remote' : 'keep-local',
    );
  }
  return resolutions;
}

export function countAppliedRestoreDocs(
  plan: RestorePlan,
  resolutions: Map<string, ConflictResolution>,
): number {
  let applied = plan.remoteOnly.length;
  for (const conflict of plan.conflicts) {
    if (resolutions.get(conflict.id) === 'use-remote') {
      applied += 1;
    }
  }
  return applied;
}

function serializeThemeForCompare(theme: BackupSnapshot['customThemes'][number]): string {
  return JSON.stringify(theme);
}

/** 云端配色与本地不同，且 applyRestore 会写入时返回 true */
export function hasThemeRestoreChanges(plan: RestorePlan): boolean {
  if (plan.remoteThemes.length === 0) return false;

  const local = exportThemeBackupState();
  if (plan.remoteThemes.length !== local.customThemes.length) return true;

  const localById = new Map(
    local.customThemes.map((theme) => [theme.id, serializeThemeForCompare(theme)]),
  );
  for (const remoteTheme of plan.remoteThemes) {
    const localSerialized = localById.get(remoteTheme.id);
    if (localSerialized !== serializeThemeForCompare(remoteTheme)) {
      return true;
    }
  }

  if (plan.remoteActiveThemeId === local.activeThemeId) return false;
  return plan.remoteThemes.some((theme) => theme.id === plan.remoteActiveThemeId);
}

export function needsStartupRestore(
  plan: RestorePlan,
  resolutions: Map<string, ConflictResolution>,
): boolean {
  if (countAppliedRestoreDocs(plan, resolutions) > 0) return true;
  return hasThemeRestoreChanges(plan);
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
