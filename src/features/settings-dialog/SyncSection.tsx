import { useCallback, useEffect, useState } from 'react';
import {
  applyRestore,
  formatDocumentTitle,
  loadAllDocuments,
  performCloudBackup,
  planRestore,
  pullRemoteDocuments,
  useDocumentStore,
  type ConflictResolution,
  type RestorePlan,
  type SyncConflict,
} from '@/core/documents';
import {
  clampCloudBackupIntervalSec,
  DEFAULT_CLOUD_BACKUP_INTERVAL_SEC,
  loadCloudBackupIntervalSec,
  MAX_CLOUD_BACKUP_INTERVAL_SEC,
  MIN_CLOUD_BACKUP_INTERVAL_SEC,
  saveCloudBackupIntervalSec,
  notifyCloudBackupIntervalChanged,
} from '@/core/settings/cloudBackupPreferences';
import { useCloudSyncStore } from '@/core/sync';
import { useServices } from '@/services/context';
import styles from './SyncSection.module.css';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function ConflictPicker({
  conflicts,
  resolutions,
  onChange,
}: {
  conflicts: SyncConflict[];
  resolutions: Map<string, ConflictResolution>;
  onChange: (id: string, resolution: ConflictResolution) => void;
}) {
  const setAll = (resolution: ConflictResolution) => {
    for (const c of conflicts) {
      onChange(c.id, resolution);
    }
  };

  return (
    <div className={styles.conflicts}>
      <p className={styles.conflictsTitle}>
        发现 {conflicts.length} 篇文稿本地与云端版本不一致，请选择保留哪一版：
      </p>
      <div className={styles.bulkActions}>
        <button type="button" className={styles.buttonGhost} onClick={() => setAll('use-remote')}>
          全部用云端
        </button>
        <button type="button" className={styles.buttonGhost} onClick={() => setAll('keep-local')}>
          全部保留本地
        </button>
      </div>
      {conflicts.map((conflict) => (
        <div key={conflict.id} className={styles.conflictItem}>
          <p className={styles.conflictName}>{formatDocumentTitle(conflict.local.title)}</p>
          <p className={styles.conflictMeta}>
            本地更新：{formatTime(conflict.local.updatedAt)}
            <br />
            云端更新：{formatTime(conflict.remote.updatedAt)}
          </p>
          <div className={styles.conflictChoices}>
            <label className={styles.choice}>
              <input
                type="radio"
                name={`conflict-${conflict.id}`}
                checked={(resolutions.get(conflict.id) ?? 'keep-local') === 'keep-local'}
                onChange={() => onChange(conflict.id, 'keep-local')}
              />
              保留本地
            </label>
            <label className={styles.choice}>
              <input
                type="radio"
                name={`conflict-${conflict.id}`}
                checked={resolutions.get(conflict.id) === 'use-remote'}
                onChange={() => onChange(conflict.id, 'use-remote')}
              />
              用云端覆盖
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SyncSection() {
  const { storage, sync } = useServices();
  const initialize = useDocumentStore((s) => s.initialize);
  const pendingCloudSync = useCloudSyncStore((s) => s.pendingCloudSync);
  const lastCloudBackupAt = useCloudSyncStore((s) => s.lastCloudBackupAt);

  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [restorePlan, setRestorePlan] = useState<RestorePlan | null>(null);
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [backupIntervalSec, setBackupIntervalSec] = useState(loadCloudBackupIntervalSec);

  const configured = sync.isConfigured();

  const refreshAuth = useCallback(async () => {
    if (!configured) {
      setAuthenticated(false);
      return;
    }
    setAuthenticated(await sync.isAuthenticated());
  }, [configured, sync]);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const handleConnect = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await sync.authenticate();
      setAuthenticated(true);
      setMessage('已连接 Google 账号');
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接失败');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await sync.signOut();
      setAuthenticated(false);
      setRestorePlan(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '退出失败');
    } finally {
      setBusy(false);
    }
  };

  const handleBackup = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const ok = await performCloudBackup(storage, sync, { force: true });
      if (!ok) {
        throw new Error(useCloudSyncStore.getState().backupError ?? '备份失败');
      }
      setMessage('已备份到 Google Drive');
    } catch (err) {
      setError(err instanceof Error ? err.message : '备份失败');
    } finally {
      setBusy(false);
    }
  };

  const handleIntervalChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    const clamped = clampCloudBackupIntervalSec(
      Number.isFinite(parsed) ? parsed : DEFAULT_CLOUD_BACKUP_INTERVAL_SEC,
    );
    setBackupIntervalSec(clamped);
    saveCloudBackupIntervalSec(clamped);
    notifyCloudBackupIntervalChanged();
  };

  const handleStartRestore = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    setRestorePlan(null);
    try {
      const remote = await pullRemoteDocuments(sync);
      if (remote.length === 0) {
        setMessage('云端暂无备份');
        return;
      }
      const local = await loadAllDocuments(storage);
      const plan = planRestore(local, remote);
      if (plan.conflicts.length === 0) {
        const applied = await applyRestore(storage, plan, new Map());
        await initialize(storage);
        useCloudSyncStore.getState().markSynced();
        setMessage(`已从云端恢复 ${applied} 篇文稿`);
        return;
      }
      const initial = new Map<string, ConflictResolution>();
      for (const c of plan.conflicts) {
        initial.set(c.id, 'keep-local');
      }
      setResolutions(initial);
      setRestorePlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : '拉取云端失败');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restorePlan) return;
    setBusy(true);
    setError(null);
    try {
      const applied = await applyRestore(storage, restorePlan, resolutions);
      await initialize(storage);
      setRestorePlan(null);
      useCloudSyncStore.getState().markSynced();
      setMessage(`恢复完成，已写入 ${applied} 篇文稿`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败');
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className={styles.section}>
        <p className={styles.lead}>
          将文稿备份到 Google Drive 的应用专用空间。本地 IndexedDB 始终是主存储。
        </p>
        <p className={styles.hint}>
          开发者在项目根目录配置 <code>VITE_GOOGLE_CLIENT_ID</code> 后重启服务即可启用。
          配置步骤见本地 <code>docs/GOOGLE_DRIVE_SETUP.md</code>。
        </p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <p className={styles.lead}>
        本地保存后，若已连接 Google 账号，将按设定间隔自动备份；切换文稿时也会尝试备份。关闭页面前若有未同步修改，浏览器会提示确认。
      </p>

      <p className={`${styles.status} ${authenticated ? styles.statusOk : ''}`}>
        {authenticated === null
          ? '正在检查登录状态…'
          : authenticated
            ? '已连接 Google 账号'
            : '未连接 Google 账号'}
      </p>

      {authenticated && (
        <p className={styles.status}>
          {pendingCloudSync
            ? '有尚未同步到云端的本地修改'
            : lastCloudBackupAt
              ? `最近云端备份：${formatTime(lastCloudBackupAt)}`
              : '暂无云端备份记录'}
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <div className={styles.actions}>
        {!authenticated ? (
          <button
            type="button"
            className={styles.buttonPrimary}
            disabled={busy}
            onClick={() => void handleConnect()}
          >
            连接 Google 账号
          </button>
        ) : (
          <>
            <label className={styles.intervalField}>
              <span className={styles.intervalLabel}>自动备份间隔（秒）</span>
              <input
                type="number"
                className={styles.intervalInput}
                min={MIN_CLOUD_BACKUP_INTERVAL_SEC}
                max={MAX_CLOUD_BACKUP_INTERVAL_SEC}
                step={15}
                value={backupIntervalSec}
                onChange={(e) => handleIntervalChange(e.target.value)}
              />
            </label>
            <button
              type="button"
              className={styles.buttonPrimary}
              disabled={busy}
              onClick={() => void handleBackup()}
            >
              备份到 Google Drive
            </button>
            <button
              type="button"
              className={styles.button}
              disabled={busy}
              onClick={() => void handleStartRestore()}
            >
              从云端恢复
            </button>
            <button
              type="button"
              className={styles.buttonGhost}
              disabled={busy}
              onClick={() => void handleSignOut()}
            >
              退出 Google 账号
            </button>
          </>
        )}
      </div>

      {restorePlan && restorePlan.conflicts.length > 0 && (
        <>
          <ConflictPicker
            conflicts={restorePlan.conflicts}
            resolutions={resolutions}
            onChange={(id, resolution) => {
              setResolutions((prev) => new Map(prev).set(id, resolution));
            }}
          />
          <button
            type="button"
            className={styles.buttonPrimary}
            disabled={busy}
            onClick={() => void handleConfirmRestore()}
          >
            确认恢复
          </button>
        </>
      )}
    </div>
  );
}
