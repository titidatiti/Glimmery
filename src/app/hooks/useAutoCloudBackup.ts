import { useCallback, useEffect, useRef, useState } from 'react';

import { performCloudBackup } from '@/core/documents/cloudBackup';
import {
  clampCloudBackupIntervalSec,
  loadCloudBackupIntervalSec,
} from '@/core/settings/cloudBackupPreferences';
import {
  registerCloudBackupExecutor,
  useCloudSyncStore,
} from '@/core/sync';
import type { StorageProvider } from '@/services/storage';
import type { SyncProvider } from '@/services/sync';

const CLOUD_AHEAD_MESSAGE = '云端有较新的备份，请在侧栏或设置中确认后再上传';

export function useAutoCloudBackup(storage: StorageProvider, sync: SyncProvider): void {
  const pendingCloudSync = useCloudSyncStore((s) => s.pendingCloudSync);
  const [intervalSec, setIntervalSec] = useState(loadCloudBackupIntervalSec);
  const storageRef = useRef(storage);
  const syncRef = useRef(sync);

  storageRef.current = storage;
  syncRef.current = sync;

  const runBackup = useCallback(async (): Promise<boolean> => {
    const result = await performCloudBackup(storageRef.current, syncRef.current);
    if (result.status === 'needs_confirmation') {
      useCloudSyncStore.getState().setBackupError(CLOUD_AHEAD_MESSAGE);
      return false;
    }
    return result.status === 'success' || result.status === 'skipped';
  }, []);

  useEffect(() => {
    registerCloudBackupExecutor(runBackup);
    return () => registerCloudBackupExecutor(null);
  }, [runBackup]);

  useEffect(() => {
    const refreshInterval = () => setIntervalSec(loadCloudBackupIntervalSec());
    window.addEventListener('glimmery-cloud-backup-interval-changed', refreshInterval);
    return () =>
      window.removeEventListener('glimmery-cloud-backup-interval-changed', refreshInterval);
  }, []);

  useEffect(() => {
    if (!pendingCloudSync || !sync.isConfigured()) return;

    const tick = window.setInterval(() => {
      void runBackup();
    }, clampCloudBackupIntervalSec(intervalSec) * 1000);

    return () => window.clearInterval(tick);
  }, [pendingCloudSync, sync, runBackup, intervalSec]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const { pendingCloudSync: pending } = useCloudSyncStore.getState();
      if (!pending || !syncRef.current.isConfigured()) return;

      /*
       * 现代浏览器会忽略自定义文案，仅展示系统默认确认框。
       * 用户选择「留在此页」后会在 focus 回调中尝试立即备份。
       */
      event.preventDefault();
      event.returnValue = '最后的修改尚未完成云同步，是否确定要强制退出？';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    let mayHaveDismissedUnload = false;

    const onBlur = () => {
      if (useCloudSyncStore.getState().pendingCloudSync) {
        mayHaveDismissedUnload = true;
      }
    };

    const onFocus = () => {
      if (mayHaveDismissedUnload && useCloudSyncStore.getState().pendingCloudSync) {
        mayHaveDismissedUnload = false;
        void runBackup();
      }
    };

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [runBackup]);
}
