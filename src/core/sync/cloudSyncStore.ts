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
  lastCloudBackupAt: string | null;
  backupError: string | null;
  markPending: () => void;
  markSynced: () => void;
  setBackingUp: (value: boolean) => void;
  setBackupError: (error: string | null) => void;
}

export const useCloudSyncStore = create<CloudSyncStoreState>((set) => ({
  pendingCloudSync: false,
  isCloudBackingUp: false,
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

  setBackingUp: (value) => set({ isCloudBackingUp: value }),

  setBackupError: (error) => set({ backupError: error }),
}));

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
