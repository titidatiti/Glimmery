import type { StorageProvider } from '@/services/storage';
import type { StorageKeyValue } from '@/services/storage';
import type { BackupSnapshot, SyncProvider } from '@/services/sync';
import type { DriveManifest } from '@/services/sync/drive/driveLayout';
import { parseRemoteManifestJson } from '@/services/sync/drive/manifestSyncPlan';
import {
  loadRemoteManifestCacheJson,
  saveRemoteManifestCacheJson,
} from '@/core/storage';
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
  return assessCloudBackupOverwriteFromPlan(plan, local);
}

/** 仅基于 manifest 索引判断上传是否会覆盖较新的云端内容（无需下载文稿正文） */
export function assessCloudBackupOverwriteFromManifest(
  local: BackupSnapshot,
  remoteManifest: DriveManifest,
  localSettingsUpdatedAt: string,
): CloudBackupOverwriteWarning | null {
  const remoteEmpty =
    Object.keys(remoteManifest.documents).length === 0 && remoteManifest.settings === null;
  if (remoteEmpty) return null;

  const localById = new Map(local.documents.map((doc) => [doc.id, doc]));
  let remoteOnlyCount = 0;
  let newerRemoteConflictCount = 0;

  for (const [id, entry] of Object.entries(remoteManifest.documents)) {
    const localDoc = localById.get(id);
    if (!localDoc) {
      remoteOnlyCount += 1;
      continue;
    }
    if (entry.updatedAt > localDoc.updatedAt) {
      newerRemoteConflictCount += 1;
    }
  }

  let remoteOnlyThemeCount = 0;
  if (
    remoteManifest.settings &&
    localSettingsUpdatedAt < remoteManifest.settings.updatedAt
  ) {
    remoteOnlyThemeCount = 1;
  }

  if (
    remoteOnlyCount === 0 &&
    newerRemoteConflictCount === 0 &&
    remoteOnlyThemeCount === 0
  ) {
    return null;
  }

  return {
    remoteOnlyCount,
    newerRemoteConflictCount,
    remoteOnlyThemeCount,
  };
}

function assessCloudBackupOverwriteFromPlan(
  plan: RestorePlan,
  local: BackupSnapshot,
): CloudBackupOverwriteWarning | null {
  const newerRemoteConflicts = plan.conflicts.filter(
    (conflict) => conflict.remote.updatedAt > conflict.local.updatedAt,
  );

  const localThemeIds = new Set(local.customThemes.map((theme) => theme.id));
  const remoteOnlyThemeCount = plan.remoteThemes.filter(
    (theme) => !localThemeIds.has(theme.id),
  ).length;

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

export function getSettingsUpdatedAtForSync(): string {
  return exportThemeBackupState().updatedAt;
}

export async function backupAllDocuments(
  storage: StorageProvider,
  sync: SyncProvider,
  options?: { force?: boolean },
): Promise<{ success: boolean; pushed: number; error?: string }> {
  const snapshot = await buildBackupSnapshot(storage);
  const { updatedAt } = exportThemeBackupState();
  const result = await sync.push(snapshot, { settingsUpdatedAt: updatedAt, force: options?.force });

  if (result.success) {
    const manifestJson = await sync.fetchRemoteManifest();
    if (manifestJson) {
      await saveRemoteManifestCacheJson(storageAsKv(storage), manifestJson);
    }
  }

  return { success: result.success, pushed: result.pushed, error: result.error };
}

function storageAsKv(storage: StorageProvider): StorageKeyValue {
  return storage as unknown as StorageKeyValue;
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

/**
 * 增量拉取后的恢复计划：以 manifest 为云端全集，仅对已下载的正文做冲突比对。
 */
export function planRestoreWithManifest(
  local: DocumentData[],
  remoteManifest: DriveManifest,
  pulledRemoteDocs: DocumentData[],
  remoteThemes: BackupSnapshot['customThemes'],
  remoteActiveThemeId: string,
): RestorePlan {
  const localById = new Map(local.map((doc) => [doc.id, doc]));
  const pulledById = new Map(pulledRemoteDocs.map((doc) => [doc.id, doc]));
  const conflicts: SyncConflict[] = [];
  const remoteOnly: DocumentData[] = [];
  const toApplyFromRemote: DocumentData[] = [];

  for (const [id, entry] of Object.entries(remoteManifest.documents)) {
    const localDoc = localById.get(id);
    if (!localDoc) {
      const remoteDoc = pulledById.get(id);
      if (remoteDoc) {
        remoteOnly.push(remoteDoc);
        toApplyFromRemote.push(remoteDoc);
      }
      continue;
    }
    if (localDoc.updatedAt === entry.updatedAt) {
      continue;
    }
    const remoteDoc = pulledById.get(id);
    if (!remoteDoc) {
      continue;
    }
    if (
      localDoc.title === remoteDoc.title &&
      localDoc.content === remoteDoc.content &&
      localDoc.createdAt === remoteDoc.createdAt
    ) {
      continue;
    }
    conflicts.push({ id, local: localDoc, remote: remoteDoc });
  }

  const manifestIds = new Set(Object.keys(remoteManifest.documents));
  const localOnly = local.filter((doc) => !manifestIds.has(doc.id));

  return {
    conflicts,
    remoteOnly,
    localOnly,
    toApplyFromRemote,
    remoteThemes,
    remoteActiveThemeId,
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

export async function pullRemoteSyncData(
  storage: StorageProvider,
  sync: SyncProvider,
  options?: { full?: boolean },
): Promise<{ snapshot: BackupSnapshot; manifest: DriveManifest }> {
  const kv = storageAsKv(storage);
  const result = await sync.pull({
    localDocumentMetas: await storage.list(),
    localSettingsUpdatedAt: getSettingsUpdatedAtForSync(),
    cachedRemoteManifestJson: await loadRemoteManifestCacheJson(kv),
    full: options?.full,
  });
  await saveRemoteManifestCacheJson(kv, result.remoteManifestJson);
  const manifest =
    parseRemoteManifestJson(result.remoteManifestJson) ?? {
      version: 3,
      updatedAt: new Date(0).toISOString(),
      documents: {},
      settings: null,
    };
  return { snapshot: result.snapshot, manifest };
}

export async function pullRemoteBackup(
  storage: StorageProvider,
  sync: SyncProvider,
  options?: { full?: boolean },
): Promise<BackupSnapshot> {
  const { snapshot } = await pullRemoteSyncData(storage, sync, options);
  return snapshot;
}

/** @deprecated 使用 pullRemoteBackup */
export async function pullRemoteDocuments(
  storage: StorageProvider,
  sync: SyncProvider,
): Promise<DocumentData[]> {
  const snapshot = await pullRemoteBackup(storage, sync);
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
