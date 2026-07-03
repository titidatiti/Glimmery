import { useCallback, useEffect, useState } from 'react';
import {
  formatCloudBackupOverwritePrompt,
  performCloudBackup,
} from '@/core/documents';
import { useCloudSyncStore } from '@/core/sync';
import { useServices } from '@/services/context';
import { CloudIcon } from '@/ui/icons/CloudIcon';
import settingsStyles from '@/features/settings-dialog/SettingsDialog.module.css';

export function CloudSyncTrigger() {
  const { storage, sync } = useServices();
  const isBackingUp = useCloudSyncStore((s) => s.isCloudBackingUp);
  const pendingCloudSync = useCloudSyncStore((s) => s.pendingCloudSync);
  const backupError = useCloudSyncStore((s) => s.backupError);

  const configured = sync.isConfigured();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

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
    if (!configured || isBackingUp) return;

    try {
      if (!(await sync.isAuthenticated())) {
        await sync.authenticate();
      }
      await runBackup(false);
    } catch {
      /* authenticate 失败时错误由 OAuth 流程抛出 */
    } finally {
      void refreshAuth();
    }
  };

  const label = isBackingUp ? '同步中…' : '云同步';
  const hint = !configured
    ? '未配置云同步（需 VITE_GOOGLE_CLIENT_ID）'
    : authenticated === false
      ? '点击连接 Google 并备份'
      : pendingCloudSync
        ? '有待备份的本地修改'
        : backupError
          ? backupError
          : '立即备份到 Google Drive';

  return (
    <button
      type="button"
      className={settingsStyles.trigger}
      onClick={() => void handleClick()}
      disabled={!configured || isBackingUp}
      title={hint}
      aria-label={hint}
    >
      <CloudIcon className={`${settingsStyles.triggerIcon} ${settingsStyles.triggerIconStatic}`} />
      <span>{label}</span>
    </button>
  );
}
