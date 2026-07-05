import { create } from 'zustand';

const LAST_CLOUD_BACKUP_AT_KEY = 'glimmery-last-cloud-backup-at';

function loadLastCloudBackupAt(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(LAST_CLOUD_BACKUP_AT_KEY);
  } catch {
    return null;
  }
}

function persistLastCloudBackupAt(iso: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LAST_CLOUD_BACKUP_AT_KEY, iso);
  } catch {
    /* quota / private mode */
  }
}

export interface CloudSyncStoreState {
  /** 本地有尚未成功备份到云端的内容 */
  pendingCloudSync: boolean;
  isCloudBackingUp: boolean;
  /** 当前同步已完成的文件数 / 总文件数（文稿 + 用户设置） */
  syncProgress: CloudSyncProgress | null;
  lastCloudBackupAt: string | null;
  backupError: string | null;
  markPending: () => void;
  markSynced: () => void;
  setBackingUp: (value: boolean) => void;
  setSyncProgress: (progress: CloudSyncProgress | null) => void;
  setBackupError: (error: string | null) => void;
}

export interface CloudSyncProgress {
  completed: number;
  total: number;
}

export const useCloudSyncStore = create<CloudSyncStoreState>((set) => ({
  pendingCloudSync: false,
  isCloudBackingUp: false,
  syncProgress: null,
  lastCloudBackupAt: loadLastCloudBackupAt(),
  backupError: null,

  markPending: () => set({ pendingCloudSync: true, backupError: null }),

  markSynced: () => {
    const lastCloudBackupAt = new Date().toISOString();
    persistLastCloudBackupAt(lastCloudBackupAt);
    set({
      pendingCloudSync: false,
      backupError: null,
      lastCloudBackupAt,
    });
  },

  setBackingUp: (value) => set({ isCloudBackingUp: value, syncProgress: null }),

  setSyncProgress: (progress) => set({ syncProgress: progress }),

  setBackupError: (error) => set({ backupError: error }),
}));

export function reportCloudSyncFileProgress(completed: number, total: number): void {
  useCloudSyncStore.getState().setSyncProgress({ completed, total });
}

type BackupExecutor = () => Promise<boolean>;

let backupExecutor: BackupExecutor | null = null;

export function registerCloudBackupExecutor(executor: BackupExecutor | null): void {
  backupExecutor = executor;
}

/** 后台触发备份，不阻塞调用方（如切换文稿） */
export function scheduleCloudBackupIfPending(): void {
  const { pendingCloudSync, isCloudBackingUp } = useCloudSyncStore.getState();
  if (!pendingCloudSync || isCloudBackingUp || !backupExecutor) return;
  void backupExecutor();
}
