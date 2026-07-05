import { useCallback, useEffect, useState } from 'react';

import {
  CURRENT_LOCAL_STORAGE_SCHEME_VERSION,
  cloudSchemeNeedsMigration,
  formatCloudSchemeMigrationMessage,
  formatCloudSchemeReauthMessage,
  formatLocalSchemeMigrationMessage,
  isCloudSyncBlockedByScheme,
  loadStorageSchemeRecord,
  localSchemeNeedsMigration,
  markCloudMigrationDeferred,
  markCloudSchemeCurrent,
  migrateLocalStorageScheme,
} from '@/core/storage';
import type { StorageProvider } from '@/services/storage';
import type { StorageKeyValue } from '@/services/storage';
import type { CloudSyncSchemeStatus, SyncProvider } from '@/services/sync';

export type StorageSchemeGatePhase =
  | 'waiting'
  | 'checking'
  | 'local-prompt'
  | 'cloud-prompt'
  | 'cloud-reauth-prompt'
  | 'migrating'
  | 'ready'
  | 'failed';

export interface StorageSchemeGateState {
  phase: StorageSchemeGatePhase;
  /** 云同步是否因未迁移或用户暂缓而不可用 */
  blockCloudSync: boolean;
  localFromVersion: number | null;
  cloudStatus: CloudSyncSchemeStatus | null;
  error: string | null;
  confirmLocalMigration: () => Promise<void>;
  confirmCloudMigration: () => Promise<void>;
  confirmCloudReauth: () => Promise<void>;
  deferCloudMigration: () => Promise<void>;
  retryCheck: () => void;
}

function asKeyValue(storage: StorageProvider): StorageKeyValue {
  return storage as unknown as StorageKeyValue;
}

export function useStorageSchemeGate(
  storage: StorageProvider,
  sync: SyncProvider,
  appInitDone: boolean,
): StorageSchemeGateState {
  const kv = asKeyValue(storage);
  const [phase, setPhase] = useState<StorageSchemeGatePhase>('waiting');
  const [blockCloudSync, setBlockCloudSync] = useState(false);
  const [localFromVersion, setLocalFromVersion] = useState<number | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudSyncSchemeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finishReady = useCallback(async (block: boolean) => {
    setBlockCloudSync(block);
    setPhase('ready');
  }, []);

  const runCheck = useCallback(async () => {
    setPhase('checking');
    setError(null);

    try {
      const record = await loadStorageSchemeRecord(kv);

      if (localSchemeNeedsMigration(record.local)) {
        setLocalFromVersion(record.local);
        setPhase('local-prompt');
        return;
      }

      if (isCloudSyncBlockedByScheme()) {
        await finishReady(true);
        return;
      }

      if (sync.isConfigured()) {
        const session = await sync.getAuthSessionStatus();

        if (session === 'expired') {
          setPhase('cloud-reauth-prompt');
          return;
        }

        if (session === 'active') {
          const cloud = await sync.detectCloudSyncScheme();
          setCloudStatus(cloud);

          if (cloudSchemeNeedsMigration(cloud.version, cloud.kind)) {
            setPhase('cloud-prompt');
            return;
          }

          if (cloud.kind === 'current') {
            await markCloudSchemeCurrent(kv);
          }
        }
      }

      await finishReady(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '存储方案检查失败');
      setPhase('failed');
    }
  }, [finishReady, kv, sync]);

  useEffect(() => {
    if (!appInitDone || phase !== 'waiting') return;
    void runCheck();
  }, [appInitDone, phase, runCheck]);

  useEffect(() => {
    const onAuthRestored = () => {
      if (phase === 'ready' || phase === 'failed') {
        setPhase('waiting');
      }
    };
    window.addEventListener('glimmery-cloud-auth-restored', onAuthRestored);
    return () => window.removeEventListener('glimmery-cloud-auth-restored', onAuthRestored);
  }, [phase]);

  const confirmLocalMigration = useCallback(async () => {
    if (localFromVersion === null) return;
    setPhase('migrating');
    setError(null);
    try {
      await migrateLocalStorageScheme(kv, localFromVersion);
      setLocalFromVersion(null);
      setPhase('waiting');
      await runCheck();
    } catch (err) {
      setError(err instanceof Error ? err.message : '本地数据迁移失败');
      setPhase('failed');
    }
  }, [kv, localFromVersion, runCheck]);

  const confirmCloudMigration = useCallback(async () => {
    setPhase('migrating');
    setError(null);
    try {
      await sync.migrateCloudSyncScheme();
      await markCloudSchemeCurrent(kv);
      setCloudStatus(null);
      await finishReady(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '云端数据迁移失败');
      setPhase('failed');
    }
  }, [finishReady, kv, sync]);

  const confirmCloudReauth = useCallback(async () => {
    setPhase('migrating');
    setError(null);
    try {
      await sync.authenticate();
      window.dispatchEvent(new Event('glimmery-cloud-auth-restored'));
      setPhase('waiting');
      await runCheck();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google 登录失败');
      setPhase('cloud-reauth-prompt');
    }
  }, [runCheck, sync]);

  const deferCloudMigration = useCallback(async () => {
    await markCloudMigrationDeferred();
    setCloudStatus(null);
    await finishReady(true);
  }, [finishReady]);

  return {
    phase,
    blockCloudSync,
    localFromVersion,
    cloudStatus,
    error,
    confirmLocalMigration,
    confirmCloudMigration,
    confirmCloudReauth,
    deferCloudMigration,
    retryCheck: () => setPhase('waiting'),
  };
}

export function buildSchemeMigrationDialogMessage(
  gate: Pick<StorageSchemeGateState, 'phase' | 'localFromVersion' | 'cloudStatus'>,
): string {
  if (gate.phase === 'local-prompt' && gate.localFromVersion !== null) {
    return formatLocalSchemeMigrationMessage(
      gate.localFromVersion,
      CURRENT_LOCAL_STORAGE_SCHEME_VERSION,
    );
  }
  if (gate.phase === 'cloud-reauth-prompt') {
    return formatCloudSchemeReauthMessage();
  }
  if (gate.phase === 'cloud-prompt' && gate.cloudStatus) {
    const from = gate.cloudStatus.version ?? 2;
    return formatCloudSchemeMigrationMessage(from, gate.cloudStatus.targetVersion);
  }
  return '';
}
