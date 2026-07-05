import type { DocumentData } from '@/core/documents';
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

/** 云端备份快照：文稿 + 自定义配色 */
export interface BackupSnapshot {
  documents: DocumentData[];
  customThemes: SerializedTheme[];
  activeThemeId: string;
}

/** Google 云同步登录态（只读探测，不触发 OAuth 弹窗） */
export type CloudAuthSessionStatus = 'none' | 'active' | 'expired';

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
  push(snapshot: BackupSnapshot): Promise<SyncResult>;
  pull(): Promise<BackupSnapshot>;
}
