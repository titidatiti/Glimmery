import { useCallback, useEffect, useState } from 'react';
import {
  applyRestore,
  formatDocumentTitle,
  formatRestoreSummary,
  loadAllDocuments,
  performCloudBackup,
  planRestoreWithManifest,
  pullRemoteSyncData,
  useDocumentStore,
  type CloudBackupOverwriteWarning,
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
import { useCloudSyncStore, clearCloudSyncSessionExpiredNotice } from '@/core/sync';
import { useServices } from '@/services/context';
import { preloadGoogleIdentityScript } from '@/services/sync/adapters/googleDriveAuth';
import { CLOUD_SYNC_SESSION_EXPIRED_MESSAGE, type SyncAccountProfile } from '@/services/sync';
import { CloudRevisionPanel } from './CloudRevisionPanel';
import styles from './SyncSection.module.css';

function accountInitial(profile: SyncAccountProfile): string {
  const source = profile.name?.trim() || profile.email;
  return source.charAt(0).toUpperCase();
}

function AccountCard({
  profile,
  onSignOut,
  signOutDisabled,
}: {
  profile: SyncAccountProfile;
  onSignOut: () => void;
  signOutDisabled?: boolean;
}) {
  const name = profile.name?.trim();

  return (
    <div className={styles.accountCard}>
      {profile.pictureUrl ? (
        <img
          className={styles.accountAvatar}
          src={profile.pictureUrl}
          alt=""
          width={40}
          height={40}
        />
      ) : (
        <span className={styles.accountAvatarFallback} aria-hidden="true">
          {accountInitial(profile)}
        </span>
      )}
      <div className={styles.accountBody}>
        {name && name !== profile.email && (
          <p className={styles.accountName}>{name}</p>
        )}
        <p className={name && name !== profile.email ? styles.accountEmail : styles.accountName}>
          {profile.email}
        </p>
      </div>
      <button
        type="button"
        className={styles.signOutButton}
        disabled={signOutDisabled}
        onClick={onSignOut}
      >
        退出账号
      </button>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function BackupOverwritePrompt({
  warning,
  onConfirm,
  onCancel,
  disabled,
}: {
  warning: CloudBackupOverwriteWarning;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const details: string[] = [];
  if (warning.remoteOnlyCount > 0) {
    details.push(`${warning.remoteOnlyCount} 篇仅存在于云端的文稿将被删除`);
  }
  if (warning.newerRemoteConflictCount > 0) {
    details.push(`${warning.newerRemoteConflictCount} 篇文稿的云端版本更新`);
  }
  if (warning.remoteOnlyThemeCount > 0) {
    details.push(`${warning.remoteOnlyThemeCount} 个仅存在于云端的自定义配色将被删除`);
  }

  return (
    <div className={styles.conflicts}>
      <p className={styles.conflictsTitle}>
        云端存在比本地新的内容，继续备份将用本地数据覆盖云端：
      </p>
      <ul className={styles.overwriteList}>
        {details.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className={styles.bulkActions}>
        <button type="button" className={styles.actionButtonPrimary} disabled={disabled} onClick={onConfirm}>
          仍要覆盖云端
        </button>
        <button type="button" className={styles.bulkButton} disabled={disabled} onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
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
        <button type="button" className={styles.bulkButton} onClick={() => setAll('use-remote')}>
          全部用云端
        </button>
        <button type="button" className={styles.bulkButton} onClick={() => setAll('keep-local')}>
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
  const reloadFromStorage = useDocumentStore((s) => s.reloadFromStorage);
  const pendingCloudSync = useCloudSyncStore((s) => s.pendingCloudSync);
  const lastCloudBackupAt = useCloudSyncStore((s) => s.lastCloudBackupAt);

  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [accountProfile, setAccountProfile] = useState<SyncAccountProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [restorePlan, setRestorePlan] = useState<RestorePlan | null>(null);
  const [backupWarning, setBackupWarning] = useState<CloudBackupOverwriteWarning | null>(null);
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [backupIntervalSec, setBackupIntervalSec] = useState(loadCloudBackupIntervalSec);

  const configured = sync.isConfigured();

  const refreshAuth = useCallback(async () => {
    if (!configured) {
      setAuthenticated(false);
      setSessionExpired(false);
      setAccountProfile(null);
      return;
    }
    const session = await sync.getAuthSessionStatus();
    setSessionExpired(session === 'expired');
    const authed = session === 'active';
    setAuthenticated(authed);
    setAccountProfile(authed ? await sync.getAccountProfile() : null);
  }, [configured, sync]);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (configured) {
      preloadGoogleIdentityScript();
    }
  }, [configured]);

  const handleConnect = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await sync.authenticate();
      setAuthenticated(true);
      setSessionExpired(false);
      setAccountProfile(await sync.getAccountProfile());
      clearCloudSyncSessionExpiredNotice();
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
      setSessionExpired(false);
      setAccountProfile(null);
      setRestorePlan(null);
      setBackupWarning(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '退出失败');
    } finally {
      setBusy(false);
    }
  };

  const handleBackup = async (confirmedOverwrite = false) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    if (!confirmedOverwrite) {
      setBackupWarning(null);
    }
    try {
      const result = await performCloudBackup(storage, sync, {
        force: true,
        confirmedOverwrite,
      });
      if (result.status === 'needs_confirmation') {
        setBackupWarning(result.warning);
        return;
      }
      setBackupWarning(null);
      if (result.status === 'failed') {
        throw new Error(result.error);
      }
      if (result.status === 'success') {
        setMessage('已备份到 Google Drive');
      }
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
      const { snapshot, manifest } = await pullRemoteSyncData(storage, sync);
      const remoteEmpty =
        Object.keys(manifest.documents).length === 0 && manifest.settings === null;
      if (remoteEmpty) {
        setMessage('云端暂无备份');
        return;
      }
      const local = await loadAllDocuments(storage);
      const plan = planRestoreWithManifest(
        local,
        manifest,
        snapshot.documents,
        snapshot.customThemes,
        snapshot.activeThemeId,
      );
      if (plan.conflicts.length === 0) {
        const applied = await applyRestore(storage, plan, new Map());
        await reloadFromStorage(storage);
        useCloudSyncStore.getState().markSynced();
        setMessage(formatRestoreSummary(applied, plan.remoteThemes.length));
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
      await reloadFromStorage(storage);
      setRestorePlan(null);
      useCloudSyncStore.getState().markSynced();
      setMessage(formatRestoreSummary(applied, restorePlan.remoteThemes.length));
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

  if (authenticated === null) {
    return (
      <div className={styles.section}>
        <p className={styles.lead}>
        文稿与自定义配色将加密备份至 Google Drive 应用专用空间，本地始终为主副本。
      </p>
        <div className={styles.accountCardLoading} aria-busy="true">
          <p className={styles.accountPlaceholder}>正在检查登录状态…</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className={styles.section}>
        <p className={styles.lead}>
        文稿与自定义配色将加密备份至 Google Drive 应用专用空间，本地始终为主副本。
      </p>
        {sessionExpired && (
          <p className={styles.noticeError}>{CLOUD_SYNC_SESSION_EXPIRED_MESSAGE}</p>
        )}
        {error && <p className={styles.noticeError}>{error}</p>}
        {message && <p className={styles.noticeSuccess}>{message}</p>}
        <div className={styles.connectCard}>
          <p className={styles.connectHint}>
            {sessionExpired
              ? '请重新连接 Google 账号以恢复云同步与自动备份。'
              : '连接 Google 账号后，可自动或手动将文稿备份到云端，并在多设备间恢复。'}
          </p>
          <button
            type="button"
            className={styles.connectButton}
            disabled={busy}
            onPointerDown={() => preloadGoogleIdentityScript()}
            onClick={() => void handleConnect()}
          >
            {sessionExpired ? '重新连接 Google 账号' : '连接 Google 账号'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <p className={styles.lead}>
        文稿与自定义配色将加密备份至 Google Drive 应用专用空间，本地始终为主副本。
      </p>

      {error && <p className={styles.noticeError}>{error}</p>}
      {message && <p className={styles.noticeSuccess}>{message}</p>}

      <div className={styles.block}>
        <p className={styles.subheading}>已连接 Google 账号</p>
        {accountProfile ? (
          <AccountCard
            profile={accountProfile}
            signOutDisabled={busy}
            onSignOut={() => void handleSignOut()}
          />
        ) : (
          <div className={styles.accountCard}>
            <span className={styles.accountAvatarFallback} aria-hidden="true">
              G
            </span>
            <div className={styles.accountBody}>
              <p className={styles.accountName}>Google 账号</p>
              <p className={styles.accountEmail}>已授权，正在读取账号信息…</p>
            </div>
            <button
              type="button"
              className={styles.signOutButton}
              disabled={busy}
              onClick={() => void handleSignOut()}
            >
              退出账号
            </button>
          </div>
        )}
      </div>

      <div className={styles.block}>
        <div className={styles.infoGroup}>
          <p className={styles.subheading}>最近备份</p>
          <p className={styles.infoValue}>
            {lastCloudBackupAt ? formatTime(lastCloudBackupAt) : '尚无记录'}
          </p>
        </div>
        <div className={styles.infoGroup}>
          <p className={styles.subheading}>本地修改</p>
          <p
            className={`${styles.infoValue} ${pendingCloudSync ? styles.infoValuePending : ''}`}
          >
            {pendingCloudSync ? '待同步至云端' : '已全部同步'}
          </p>
        </div>
      </div>

      <div className={styles.block}>
        <p className={styles.subheading}>自动备份</p>
        <div className={styles.settingRow}>
          <span className={styles.itemLabel}>备份间隔</span>
          <div className={styles.settingControl}>
            <input
              type="number"
              className={styles.intervalInput}
              min={MIN_CLOUD_BACKUP_INTERVAL_SEC}
              max={MAX_CLOUD_BACKUP_INTERVAL_SEC}
              step={15}
              value={backupIntervalSec}
              onChange={(e) => handleIntervalChange(e.target.value)}
              aria-label="自动备份间隔（秒）"
            />
            <span className={styles.settingUnit}>秒</span>
          </div>
        </div>
        <p className={styles.fieldHint}>
          有未同步修改时按间隔自动备份；切换文稿时也会尝试同步。备份进行时在编辑区右下角显示「正在云同步」。离开页面前若仍有待同步内容，浏览器会提示确认。
        </p>
      </div>

      <div className={styles.actionGrid}>
        <button
          type="button"
          className={styles.actionButtonPrimary}
          disabled={busy}
          onClick={() => void handleBackup()}
        >
          立即备份
        </button>
        <button
          type="button"
          className={styles.actionButton}
          disabled={busy}
          onClick={() => void handleStartRestore()}
        >
          从云端恢复
        </button>
      </div>

      {backupWarning && (
        <BackupOverwritePrompt
          warning={backupWarning}
          disabled={busy}
          onConfirm={() => void handleBackup(true)}
          onCancel={() => setBackupWarning(null)}
        />
      )}

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
            className={styles.actionButtonPrimary}
            disabled={busy}
            onClick={() => void handleConfirmRestore()}
          >
            确认恢复
          </button>
        </>
      )}

      <CloudRevisionPanel disabled={busy} />
    </div>
  );
}
