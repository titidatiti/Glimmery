import { CLOUD_SYNC_SESSION_EXPIRED_MESSAGE } from '@/services/sync/constants';

import { useCloudSyncStore } from './cloudSyncStore';

/** 跨 React StrictMode 重挂载，保证启动同步与过期弹窗各只执行一次 */
let startupCloudSyncClaimed = false;
let sessionExpiredAlertShown = false;

export function claimStartupCloudSyncRun(): boolean {
  if (startupCloudSyncClaimed) return false;
  startupCloudSyncClaimed = true;
  return true;
}

export function notifyCloudSyncSessionExpiredOnce(): void {
  useCloudSyncStore.getState().setBackupError(CLOUD_SYNC_SESSION_EXPIRED_MESSAGE);
  if (sessionExpiredAlertShown) return;
  sessionExpiredAlertShown = true;
  window.alert(CLOUD_SYNC_SESSION_EXPIRED_MESSAGE);
}

/** 用户重新连接 Google 后清除过期提示状态 */
export function clearCloudSyncSessionExpiredNotice(): void {
  sessionExpiredAlertShown = false;
  if (useCloudSyncStore.getState().backupError === CLOUD_SYNC_SESSION_EXPIRED_MESSAGE) {
    useCloudSyncStore.getState().setBackupError(null);
  }
}
