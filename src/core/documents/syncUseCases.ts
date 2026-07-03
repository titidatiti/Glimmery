import type { StorageProvider } from '@/services/storage';
import type { SyncProvider } from '@/services/sync';
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
}

export async function loadAllDocuments(storage: StorageProvider): Promise<DocumentData[]> {
  const metas = await storage.list();
  const docs = await Promise.all(metas.map((meta) => storage.load(meta.id)));
  return docs.filter((doc): doc is DocumentData => doc !== null);
}

export function planRestore(local: DocumentData[], remote: DocumentData[]): RestorePlan {
  const localById = new Map(local.map((doc) => [doc.id, doc]));
  const remoteById = new Map(remote.map((doc) => [doc.id, doc]));
  const conflicts: SyncConflict[] = [];
  const remoteOnly: DocumentData[] = [];
  const toApplyFromRemote: DocumentData[] = [];

  for (const remoteDoc of remote) {
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

  return { conflicts, remoteOnly, localOnly, toApplyFromRemote };
}

export async function backupAllDocuments(
  storage: StorageProvider,
  sync: SyncProvider,
): Promise<{ success: boolean; pushed: number; error?: string }> {
  const docs = await loadAllDocuments(storage);
  const result = await sync.push(docs);
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

  return applied;
}

export async function pullRemoteDocuments(sync: SyncProvider): Promise<DocumentData[]> {
  return sync.pull();
}
