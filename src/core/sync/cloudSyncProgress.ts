import type { CloudSyncProgress } from './cloudSyncStore';

/** 已同步 / 需同步文件数，如 `2/5` */
export function formatCloudSyncProgressCounts(progress: CloudSyncProgress | null): string | null {
  if (!progress || progress.total <= 0) return null;
  const completed = Math.min(progress.completed, progress.total);
  return `${completed}/${progress.total}`;
}

/** 在基础文案后附加「已完成/总数」（无可计数的文件时不显示） */
export function formatCloudSyncProgressText(
  base: string,
  progress: CloudSyncProgress | null,
): string {
  const counts = formatCloudSyncProgressCounts(progress);
  if (counts === null) return base;
  return `${base} ${counts}`;
}

export interface CloudSyncActiveLabels {
  preparing: string;
  syncing: string;
}

/**
 * 同步进行中：尚无文件进度时为「准备…」，开始传输后为「正在… x/y」。
 */
export function formatCloudSyncActiveLabel(
  labels: CloudSyncActiveLabels,
  progress: CloudSyncProgress | null,
): string {
  const counts = formatCloudSyncProgressCounts(progress);
  if (counts === null) return labels.preparing;
  return `${labels.syncing} ${counts}`;
}

/** 侧栏同步中固定主标题 */
export const CLOUD_SYNC_SIDEBAR_TITLE = '云同步中…';

/** 侧栏第二行：准备阶段 / 传输进度 */
export function formatCloudSyncSidebarSubtitle(progress: CloudSyncProgress | null): string {
  const counts = formatCloudSyncProgressCounts(progress);
  if (counts === null) return '正在获取云端数据…';
  return `正在同步 ${counts}`;
}

export const CLOUD_SYNC_UPLOAD_LABELS: CloudSyncActiveLabels = {
  preparing: '准备云同步',
  syncing: '正在云同步',
};

export const CLOUD_SYNC_PULL_LABELS: CloudSyncActiveLabels = {
  preparing: '准备从云端同步',
  syncing: '正在从云端同步',
};
