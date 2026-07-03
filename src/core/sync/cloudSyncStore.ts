import { create } from 'zustand';

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
  lastCloudBackupAt: null,
  backupError: null,

  markPending: () => set({ pendingCloudSync: true, backupError: null }),

  markSynced: () =>
    set({
      pendingCloudSync: false,
      backupError: null,
      lastCloudBackupAt: new Date().toISOString(),
    }),

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
