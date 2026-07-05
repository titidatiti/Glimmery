/** Drive appDataFolder 中的备份文件名 */
export const DRIVE_BACKUP_FILENAME = 'glimmery-documents.json';

export const DRIVE_BACKUP_VERSION = 2;

export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

/** 读取当前授权 Google 账号的邮箱与显示名（OAuth 同意屏会一并展示） */
export const GOOGLE_USERINFO_EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';
export const GOOGLE_USERINFO_PROFILE_SCOPE = 'https://www.googleapis.com/auth/userinfo.profile';

export const GOOGLE_DRIVE_OAUTH_SCOPES = [
  DRIVE_APPDATA_SCOPE,
  GOOGLE_USERINFO_EMAIL_SCOPE,
  GOOGLE_USERINFO_PROFILE_SCOPE,
].join(' ');

/** GIS 回调中的 scope 是否包含 Drive appData 读写权限 */
export function includesDriveAppDataScope(scope: string | undefined): boolean {
  if (!scope?.trim()) return false;
  return scope.split(/\s+/).includes(DRIVE_APPDATA_SCOPE);
}

export const INSUFFICIENT_DRIVE_SCOPE_MESSAGE =
  '未获得 Google Drive 访问权限。请在设置中断开 Google 账号后重新连接，并在授权页允许访问 Drive。';

export const GOOGLE_DRIVE_SCOPE_ERROR_PATTERN = /insufficient authentication scopes/i;

export const KV_GOOGLE_DRIVE_TOKEN = 'sync:google-drive:token';
export const KV_GOOGLE_DRIVE_PROFILE = 'sync:google-drive:profile';

/** 曾连接 Google 但 access token 已失效（需重新授权） */
export const CLOUD_SYNC_SESSION_EXPIRED_MESSAGE =
  '云同步登录已过期，需要重新登录 Google 账号。请打开「设置 → 云同步」重新连接。';

export interface DriveBackupPayload {
  version: number;
  exportedAt: string;
  documents: import('@/core/documents').DocumentData[];
  /** v2+：用户自定义配色 */
  customThemes?: import('@/core/themes').SerializedTheme[];
  /** v2+：当前选用的主题 id */
  activeThemeId?: string;
}
