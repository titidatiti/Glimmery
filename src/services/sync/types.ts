import type { DocumentData, DocumentMeta } from '@/core/documents';
import type { SerializedTheme } from '@/core/themes';

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  error?: string;
}

export interface SyncAccountProfile {
  email: string;
  name?: string;
  pictureUrl?: string;
}

/** 云端备份快照：文稿 + 自定义配色（逻辑聚合；Drive v3 物理分文件存储） */
export interface BackupSnapshot {
  documents: DocumentData[];
  customThemes: SerializedTheme[];
  activeThemeId: string;
}

export type CloudRevisionSlot = 'current' | 1 | 2 | 3;

export interface CloudRevisionInfo {
  slot: CloudRevisionSlot;
  updatedAt: string;
  label: string;
}

export interface SyncPushOptions {
  settingsUpdatedAt: string;
  /** 忽略云端较新时间戳，强制上传（用户已确认） */
  force?: boolean;
  /** 写入 manifest 的客户端名称（修改者） */
  clientName?: string;
}

export interface SyncMigrateOptions {
  /** 迁移写入 manifest 时使用的客户端名称 */
  clientName?: string;
}

export interface SyncPullOptions {
  localDocumentMetas?: Pick<DocumentMeta, 'id' | 'updatedAt'>[];
  localSettingsUpdatedAt?: string;
  /** 上次 pull/push 后缓存在本地的 manifest JSON */
  cachedRemoteManifestJson?: string | null;
  /** 拉取 manifest 中全部文稿（手动恢复等） */
  full?: boolean;
}

export interface SyncPullResult {
  snapshot: BackupSnapshot;
  /** 本次读取到的远程 manifest，供写入本地缓存 */
  remoteManifestJson: string;
  /** 实际下载的文稿文件数 */
  documentsFetched: number;
}

/** Google 云同步登录态（只读探测，不触发 OAuth 弹窗） */
export type CloudAuthSessionStatus = 'none' | 'active' | 'expired';

export type CloudSyncSchemeKind = 'empty' | 'current' | 'legacy' | 'outdated';

export interface CloudSyncSchemeStatus {
  kind: CloudSyncSchemeKind;
  version: number | null;
  targetVersion: number;
}

export interface CloudSyncSchemeMigrationResult {
  fromVersion: number;
  toVersion: number;
}

export interface SyncProvider {
  readonly id: string;
  /** 是否已配置（如 env 中有 Client ID） */
  isConfigured(): boolean;
  isAuthenticated(): Promise<boolean>;
  /** 区分「从未登录」与「曾登录但 token 已过期」；未配置时返回 none */
  getAuthSessionStatus(): Promise<CloudAuthSessionStatus>;
  /** 已登录时返回 Google 账号信息；未登录或未配置时返回 null */
  getAccountProfile(): Promise<SyncAccountProfile | null>;
  authenticate(): Promise<void>;
  signOut(): Promise<void>;
  /** 增量上传：仅推送 updatedAt 新于云端的文稿与设置文件 */
  push(snapshot: BackupSnapshot, options?: SyncPushOptions): Promise<SyncResult>;
  /** 按 manifest 增量拉取；无本地提示时退化为读 manifest 索引内全部当前版文件 */
  pull(options?: SyncPullOptions): Promise<SyncPullResult>;
  /** 只读远程 manifest（用于上传前比对，不下载文稿） */
  fetchRemoteManifest(): Promise<string | null>;
  /** 探测云端同步布局版本（只读） */
  detectCloudSyncScheme(): Promise<CloudSyncSchemeStatus>;
  /** 将云端旧版备份迁移至当前布局版本 */
  migrateCloudSyncScheme(options?: SyncMigrateOptions): Promise<CloudSyncSchemeMigrationResult>;
  listDocumentRevisions(documentId: string): Promise<CloudRevisionInfo[]>;
  pullDocumentRevision(
    documentId: string,
    slot: CloudRevisionSlot,
  ): Promise<DocumentData | null>;
  listSettingsRevisions(): Promise<CloudRevisionInfo[]>;
  pullSettingsRevision(
    slot: CloudRevisionSlot,
  ): Promise<Pick<BackupSnapshot, 'customThemes' | 'activeThemeId'> | null>;
}
