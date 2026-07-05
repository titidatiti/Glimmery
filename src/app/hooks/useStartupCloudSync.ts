import { useEffect, useState } from 'react';

import { performStartupCloudSync } from '@/core/documents/cloudStartupSync';
import { useDocumentStore } from '@/core/documents';
import {
  claimStartupCloudSyncRun,
  notifyCloudSyncSessionExpiredOnce,
} from '@/core/sync';
import type { StorageProvider } from '@/services/storage';
import type { SyncProvider } from '@/services/sync';

export interface StartupCloudSyncState {
  /** 本地文稿已加载，且启动拉取流程已结束（含跳过） */
  ready: boolean;
  /** 正在从云端拉取并合并 */
  syncing: boolean;
}

/**
 * 本地 storage 初始化完成后，若 Google 已登录则静默拉取云端更新一次。
 */
export function useStartupCloudSync(
  storage: StorageProvider,
  sync: SyncProvider,
  options?: { enabled?: boolean },
): StartupCloudSyncState {
  const enabled = options?.enabled ?? true;
  const isLoading = useDocumentStore((s) => s.isLoading);
  const reloadFromStorage = useDocumentStore((s) => s.reloadFromStorage);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!enabled || isLoading || ready) return;

    if (!claimStartupCloudSyncRun()) {
      setReady(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      if (sync.isConfigured()) {
        const session = await sync.getAuthSessionStatus();
        if (session === 'expired') {
          notifyCloudSyncSessionExpiredOnce();
        } else if (session === 'active') {
          setSyncing(true);
          const result = await performStartupCloudSync(storage, sync);
          if (!cancelled && result.status === 'success') {
            await reloadFromStorage(storage);
          }
        }
      }

      if (!cancelled) {
        setSyncing(false);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, isLoading, ready, storage, sync, reloadFromStorage]);

  return { ready, syncing };
}
