import type { DocumentMeta } from '@/core/documents';
import { DEFAULT_THEME_ID } from '@/core/themes';

import type { BackupSnapshot } from '../types';
import type { DriveManifest } from './driveLayout';

export interface ManifestPullPlan {
  documentIdsToFetch: string[];
  fetchSettings: boolean;
  /** 远程 manifest 相对缓存与本地均无变化，可跳过读文稿文件 */
  skipDocumentReads: boolean;
}

function documentEntryEqual(
  a: { updatedAt: string } | undefined,
  b: { updatedAt: string } | undefined,
): boolean {
  return (a?.updatedAt ?? '') === (b?.updatedAt ?? '');
}

/** 比较两份 manifest 的文稿与设置索引是否一致 */
export function remoteManifestsEqual(a: DriveManifest | null, b: DriveManifest | null): boolean {
  if (!a || !b) return false;
  if (a.version !== b.version) return false;
  if (!documentEntryEqual(a.settings ?? undefined, b.settings ?? undefined)) return false;

  const aIds = Object.keys(a.documents).sort();
  const bIds = Object.keys(b.documents).sort();
  if (aIds.length !== bIds.length) return false;
  for (let i = 0; i < aIds.length; i += 1) {
    if (aIds[i] !== bIds[i]) return false;
    if (!documentEntryEqual(a.documents[aIds[i]], b.documents[bIds[i]])) return false;
  }
  return true;
}

export function parseRemoteManifestJson(raw: string | null): DriveManifest | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DriveManifest;
    if (parsed.version !== 3 || !parsed.documents || typeof parsed.documents !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function serializeRemoteManifest(manifest: DriveManifest): string {
  return JSON.stringify(manifest);
}

/** 云端 manifest 相对缓存新增或 updatedAt 变化的文稿 id */
export function manifestChangedDocumentIds(
  remote: DriveManifest,
  cached: DriveManifest | null,
): string[] {
  if (!cached) return Object.keys(remote.documents);
  const changed: string[] = [];
  for (const [id, entry] of Object.entries(remote.documents)) {
    const prev = cached.documents[id];
    if (!prev || prev.updatedAt !== entry.updatedAt) {
      changed.push(id);
    }
  }
  return changed;
}

/**
 * 根据远程 manifest、本地 meta 与缓存 manifest 计算需拉取的文稿与设置。
 * @param full 为 true 时拉取 manifest 中全部文稿（手动恢复等场景）
 */
export function planManifestPull(
  remote: DriveManifest,
  localMetas: Pick<DocumentMeta, 'id' | 'updatedAt'>[],
  cached: DriveManifest | null,
  localSettingsUpdatedAt: string,
  options?: { full?: boolean },
): ManifestPullPlan {
  if (options?.full) {
    return {
      documentIdsToFetch: Object.keys(remote.documents),
      fetchSettings: remote.settings !== null,
      skipDocumentReads: false,
    };
  }

  const localById = new Map(localMetas.map((meta) => [meta.id, meta]));
  const remoteUnchangedFromCache = cached !== null && remoteManifestsEqual(remote, cached);

  const ids = new Set<string>();

  for (const [id, remoteEntry] of Object.entries(remote.documents)) {
    const localMeta = localById.get(id);
    if (!localMeta) {
      ids.add(id);
      continue;
    }
    if (localMeta.updatedAt !== remoteEntry.updatedAt) {
      ids.add(id);
    }
  }

  if (!remoteUnchangedFromCache) {
    for (const id of manifestChangedDocumentIds(remote, cached)) {
      const localMeta = localById.get(id);
      if (!localMeta || localMeta.updatedAt !== remote.documents[id]?.updatedAt) {
        ids.add(id);
      }
    }
  }

  const documentIdsToFetch = [...ids];
  const skipDocumentReads = documentIdsToFetch.length === 0;

  let fetchSettings = false;
  if (remote.settings) {
    const remoteSettingsAt = remote.settings.updatedAt;
    if (localSettingsUpdatedAt < remoteSettingsAt) {
      fetchSettings = true;
    } else if (cached && !documentEntryEqual(remote.settings, cached.settings ?? undefined)) {
      fetchSettings = true;
    }
  }

  return {
    documentIdsToFetch,
    fetchSettings,
    skipDocumentReads,
  };
}

export function hasSyncableThemePayload(
  snapshot: Pick<BackupSnapshot, 'customThemes' | 'activeThemeId'>,
): boolean {
  return snapshot.customThemes.length > 0 || snapshot.activeThemeId !== DEFAULT_THEME_ID;
}

/** 是否需上传用户设置文件（无自定义主题且云端无设置索引时不重复上传） */
export function shouldUploadSettingsForSync(
  snapshot: Pick<BackupSnapshot, 'customThemes' | 'activeThemeId'>,
  manifest: DriveManifest,
  settingsUpdatedAt: string,
  force: boolean,
): boolean {
  const hasLocalThemeData = hasSyncableThemePayload(snapshot);
  const remoteSettingsAt = manifest.settings?.updatedAt ?? '';

  if (force) {
    return hasLocalThemeData || manifest.settings !== null;
  }
  if (!manifest.settings) {
    return hasLocalThemeData;
  }
  return settingsUpdatedAt > remoteSettingsAt;
}

export function buildRemoteManifestFromSnapshot(
  documents: Pick<DocumentMeta, 'id' | 'updatedAt'>[],
  settingsUpdatedAt: string | null,
): DriveManifest {
  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    documents: Object.fromEntries(documents.map((doc) => [doc.id, { updatedAt: doc.updatedAt }])),
    settings: settingsUpdatedAt ? { updatedAt: settingsUpdatedAt } : null,
  };
}
