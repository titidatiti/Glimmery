import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  formatCloudBackupOverwritePrompt,
  performCloudBackup,
} from '@/core/documents';
import { CLOUD_SYNC_SCHEME_MIGRATION_REQUIRED } from '@/core/storage';
import { useCloudSyncStore, clearCloudSyncSessionExpiredNotice } from '@/core/sync';
import { formatUpdatedAt } from '@/lib';
import { useServices } from '@/services/context';
import { CLOUD_SYNC_SESSION_EXPIRED_MESSAGE } from '@/services/sync';
import { CloudIcon } from '@/ui/icons/CloudIcon';
import settingsStyles from '@/features/settings-dialog/SettingsDialog.module.css';
import styles from './CloudSyncTrigger.module.css';

export interface CloudSyncTriggerProps {
  /** 云端数据结构待迁移或用户本会话暂缓迁移 */
  cloudMigrationBlocked?: boolean;
}

function resolveStatusLine(input: {
  configured: boolean;
  isBackingUp: boolean;
  authenticated: boolean | null;
  sessionExpired: boolean;
  cloudMigrationBlocked: boolean;
  lastCloudBackupAt: string | null;
  pendingCloudSync: boolean;
}): { text: string; tone: 'default' | 'pending' | 'error' } {
  if (!input.configured) {
    return { text: '登录状态：未登录', tone: 'default' };
  }
  if (input.cloudMigrationBlocked) {
    return { text: '需完成数据迁移', tone: 'error' };
  }
  if (input.isBackingUp) {
    return { text: '正在同步…', tone: 'default' };
  }
  if (input.authenticated === null) {
    return { text: '正在检查登录状态…', tone: 'default' };
  }
  if (input.sessionExpired) {
    return { text: '登录状态：已过期', tone: 'error' };
  }
  if (!input.authenticated) {
    return { text: '登录状态：未登录', tone: 'default' };
  }
  const syncedAt = input.lastCloudBackupAt
    ? formatUpdatedAt(input.lastCloudBackupAt)
    : '尚无记录';
  if (input.pendingCloudSync) {
    return { text: `最近同步时间：${syncedAt} · 有待上传`, tone: 'pending' };
  }
  return { text: `最近同步时间：${syncedAt}`, tone: 'default' };
}

export function CloudSyncTrigger({ cloudMigrationBlocked = false }: CloudSyncTriggerProps) {
  const { storage, sync } = useServices();
  const isBackingUp = useCloudSyncStore((s) => s.isCloudBackingUp);
  const pendingCloudSync = useCloudSyncStore((s) => s.pendingCloudSync);
  const lastCloudBackupAt = useCloudSyncStore((s) => s.lastCloudBackupAt);
  const backupError = useCloudSyncStore((s) => s.backupError);

  const configured = sync.isConfigured();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const refreshAuth = useCallback(async () => {
    if (!configured) {
      setAuthenticated(false);
      setSessionExpired(false);
      return;
    }
    const session = await sync.getAuthSessionStatus();
    setSessionExpired(session === 'expired');
    setAuthenticated(session === 'active');
  }, [configured, sync]);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const runBackup = async (confirmedOverwrite = false) => {
    const result = await performCloudBackup(storage, sync, {
      force: true,
      confirmedOverwrite,
    });

    if (result.status === 'needs_confirmation') {
      const confirmed = window.confirm(formatCloudBackupOverwritePrompt(result.warning));
      if (confirmed) {
        await runBackup(true);
      }
      return;
    }

    if (result.status === 'failed') {
      useCloudSyncStore.getState().setBackupError(result.error);
    }
  };

  const handleClick = async () => {
    if (!configured || isBackingUp || cloudMigrationBlocked) return;

    try {
      if (!(await sync.isAuthenticated())) {
        await sync.authenticate();
        clearCloudSyncSessionExpiredNotice();
        window.dispatchEvent(new Event('glimmery-cloud-auth-restored'));
      }
      await runBackup(false);
    } catch {
      /* authenticate 失败时错误由 OAuth 流程抛出 */
    } finally {
      void refreshAuth();
    }
  };

  const status = useMemo(
    () =>
      resolveStatusLine({
        configured,
        isBackingUp,
        authenticated,
        sessionExpired,
        cloudMigrationBlocked,
        lastCloudBackupAt,
        pendingCloudSync,
      }),
    [
      configured,
      isBackingUp,
      authenticated,
      sessionExpired,
      cloudMigrationBlocked,
      lastCloudBackupAt,
      pendingCloudSync,
    ],
  );

  const hint = !configured
    ? '未配置云同步（需 VITE_GOOGLE_CLIENT_ID）'
    : cloudMigrationBlocked
      ? `${CLOUD_SYNC_SCHEME_MIGRATION_REQUIRED}。请刷新页面并完成迁移对话框。`
      : sessionExpired
        ? CLOUD_SYNC_SESSION_EXPIRED_MESSAGE
        : backupError
          ? backupError
          : authenticated
            ? '点击立即备份到 Google Drive'
            : '点击连接 Google 并备份';

  const statusClassName =
    status.tone === 'pending'
      ? `${styles.status} ${styles.statusPending}`
      : status.tone === 'error'
        ? `${styles.status} ${styles.statusError}`
        : styles.status;

  return (
    <button
      type="button"
      className={`${settingsStyles.trigger} ${styles.trigger}`}
      onClick={() => void handleClick()}
      disabled={!configured || isBackingUp || cloudMigrationBlocked}
      title={hint}
      aria-label={`云同步，${status.text}`}
    >
      <CloudIcon className={`${settingsStyles.triggerIcon} ${settingsStyles.triggerIconStatic}`} />
      <span className={styles.body}>
        <span className={styles.title}>{isBackingUp ? '云同步中…' : '云同步'}</span>
        <span className={statusClassName}>{status.text}</span>
      </span>
    </button>
  );
}
