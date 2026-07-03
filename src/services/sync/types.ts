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

export interface SyncProvider {
  readonly id: string;
  /** 是否已配置（如 env 中有 Client ID） */
  isConfigured(): boolean;
  isAuthenticated(): Promise<boolean>;
  /** 已登录时返回 Google 账号信息；未登录或未配置时返回 null */
  getAccountProfile(): Promise<SyncAccountProfile | null>;
  authenticate(): Promise<void>;
  signOut(): Promise<void>;
  push(snapshot: BackupSnapshot): Promise<SyncResult>;
  pull(): Promise<BackupSnapshot>;
}
