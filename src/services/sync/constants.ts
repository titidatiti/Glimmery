/** Drive appDataFolder 中的备份文件名 */
export const DRIVE_BACKUP_FILENAME = 'glimmery-documents.json';

export const DRIVE_BACKUP_VERSION = 1;

export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

export const KV_GOOGLE_DRIVE_TOKEN = 'sync:google-drive:token';

export interface DriveBackupPayload {
  version: number;
  exportedAt: string;
  documents: import('@/core/documents').DocumentData[];
}
